import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { computePanchang } from "@/lib/astrology/panchang";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { extractIntent } from "@/lib/intelligence/intentExtractor";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";
import { callAI, hasAnyProvider } from "@/lib/ai/provider";
import { computeBodyRiskProfile, getTopRisks, type BodyRiskProfile } from "@/lib/intelligence/health/bodyRiskProfile";
import { buildHealthFindings, type HealthFindings } from "@/lib/intelligence/health/healthFindingsEngine";
import { buildFollowUp } from "@/lib/intelligence/domainPromptEngine";
import { classifyQuestion } from "@/lib/intelligence/v5/intentEngine";
import { buildAstrologicalBrief } from "@/lib/intelligence/v5/astrologicalBriefing";
import { buildV5Prompt } from "@/lib/intelligence/v5/promptBuilder";
import { NatalPromiseAnalyzer, LifeDomainActivationEngine } from "@/lib/intelligence/lifeInsights/services";

export async function POST(req: NextRequest) {
  try {
    const { question, domain: forcedDomain, timeframe: forcedTimeframe, conversationHistory } = await req.json();
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(conversationHistory)
      ? conversationHistory.map((m: any) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: String(m.content).slice(0, 600),
        })).slice(-6)
      : [];
    if (!question || typeof question !== "string") {
      return buildErrorResponse("DATA_MALFORMATION", "Please provide a valid question.", 400);
    }

    // 1. Get User Context
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) {
      return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);
    }

    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return buildErrorResponse("DATA_MALFORMATION", "User profile not found.", 404);
    }

    // 2. Intent Extraction
    const extractedIntent = extractIntent(question);

    // Determine domain — fall back to history scan when current question is ambiguous
    let targetDomain = forcedDomain || extractedIntent.domain;
    if (!targetDomain || targetDomain === "general") {
      // Scan recent user messages in history for a clear domain signal
      const recentUserText = history
        .filter(m => m.role === "user")
        .slice(-3)
        .map(m => m.content)
        .join(" ");
      if (recentUserText) {
        const historyIntent = extractIntent(recentUserText);
        if (historyIntent.domain && historyIntent.domain !== "general") {
          targetDomain = historyIntent.domain;
        }
      }
    }
    targetDomain = targetDomain || "general";

    // Map extracted timeframe or timing query to corresponding API timeframes
    let targetTimeframe = "this-week";
    if (forcedTimeframe) {
      targetTimeframe = forcedTimeframe;
    } else if (extractedIntent.timeframe === "today") {
      targetTimeframe = "today";
    } else if (extractedIntent.timeframe === "week") {
      targetTimeframe = "this-week";
    } else if (extractedIntent.timeframe === "month") {
      targetTimeframe = "this-month";
    } else if (extractedIntent.timeframe === "year") {
      targetTimeframe = "this-year";
    } else if (
      extractedIntent.type === "timing" ||
      /when|clear|expect|month|year|date|future|timeline/i.test(question)
    ) {
      // For general timing questions, expand scope to month or year to allow broader forecast horizons
      targetTimeframe = /year/i.test(question) ? "this-year" : "this-month";
    }

    // Ensure intent is passed as an object
    const intent = {
      domain: targetDomain,
      type: extractedIntent.type || "general",
      confidence: extractedIntent.confidence,
      timeframe: targetTimeframe,
    };

    // 3. Astrology Engine (Standard Setup)
    const { birthDetails } = user;
    const chart = await calculateLagnaChart({
      date: birthDetails.dateOfBirth.toISOString().split('T')[0],
      time: birthDetails.timeOfBirth,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone,
    });

    const moon = chart.planets.find(p => p.name === "Moon");
    if (!moon) throw new Error("Moon data required");

    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
    const temporal = getDashaContext(timeline, new Date());
    const currentTransits = await calculateCurrentTransits();

    // 4. Intelligence Logic
    const narrative = generateNarrative(intent as any, targetTimeframe as any, chart, {
      ...temporal,
      transits: currentTransits.positions
    });

    // 5. LLM Agentic Layer
    let answerText = "";
    let followUpText = buildFollowUp(intent.domain, intent.type);

    if (!hasAnyProvider()) {
      answerText = `[Deterministic Insight]: ${narrative.heroInsight}\n\n${narrative.realityTranslation}\n\n👉 Focus on structured consistency during this ${intent.domain} phase.`;
    } else {
      // ── Build rich user profile for V4 prompt ────────────────────────────
      const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
      const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Moola","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];

      const lagnaSign = chart.lagna.sign; // 1-12
      const lagnaSignName = ZODIAC[lagnaSign - 1] ?? "Aries";
      const natalMoon = chart.planets.find(p => p.name === "Moon");
      const natalMoonSignName = ZODIAC[(natalMoon?.sign ?? 1) - 1] ?? "Aries";

      // Transit positions as house numbers relative to lagna
      const transitSummary = currentTransits.positions
        .map(p => {
          const house = ((p.sign - lagnaSign + 12) % 12) + 1;
          return `${p.name} in ${ZODIAC[p.sign - 1]} (House ${house})${p.speed < 0 ? " ℞" : ""}`;
        })
        .join("\n");

      // Date and Moon transit note
      const todayLabel = new Date().toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
      const moonTransit = currentTransits.positions.find(p => p.name === "Moon");
      const moonSignName = moonTransit ? ZODIAC[Math.floor(moonTransit.longitude / 30)] : null;
      const moonDeg = moonTransit ? (moonTransit.longitude % 30).toFixed(1) : null;
      const moonNakshatraName = moonTransit
        ? NAKSHATRAS[Math.min(26, Math.floor((moonTransit.longitude % 360) / (360 / 27)))]
        : null;
      // Panchang context — Tithi, Yoga, Rahu Kaal derived from current transit positions
      let panchangNote = "";
      try {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const sunPos = currentTransits.positions.find(p => p.name === "Sun");
        const moonPos = currentTransits.positions.find(p => p.name === "Moon");
        if (sunPos && moonPos) {
          const panchangData = computePanchang({
            sunLongitude: sunPos.longitude,
            moonLongitude: moonPos.longitude,
            date: todayStr,
            lat: Number(birthDetails.latitude),
            lng: Number(birthDetails.longitude),
            timezone: birthDetails.timezone || "Asia/Kolkata",
          });
          const rahuKaal = panchangData.rahuKaal
            ? `, Rahu Kaal ${panchangData.rahuKaal.start}–${panchangData.rahuKaal.end}`
            : "";
          panchangNote = `\nPanchang: Tithi ${panchangData.tithi} | Yoga ${panchangData.yoga}${rahuKaal}`;
        }
      } catch {
        // Panchang is enrichment — don't block the chat on failure
      }

      const moonTransitNote = moonSignName
        ? `\nToday's Moon: ${moonSignName} at ${moonDeg}°${moonNakshatraName ? `, Nakshatra ${moonNakshatraName}` : ""}${panchangNote}`
        : panchangNote;

      // ── Body Risk Profile (health domain only) ───────────────────────────
      let bodyRiskProfile: BodyRiskProfile | null = null;
      let topRisks: Array<{ system: string; score: number }> = [];
      let healthFindings: HealthFindings | null = null;
      if (targetDomain === "health" && temporal?.stack) {
        bodyRiskProfile = computeBodyRiskProfile(chart, temporal.stack, currentTransits.positions);
        topRisks = getTopRisks(bodyRiskProfile, 3);
        healthFindings = buildHealthFindings(bodyRiskProfile);
      }

      // ── Vedic Chart-Specific Context ─────────────────────────────────────
      // Compute genuine per-user astrological facts from the natal chart.
      // These differ between users and make the LLM response chart-specific.
      const CHAT_TO_VEDIC: Record<string, string> = {
        career: "Career", finance: "Wealth", relationship: "Marriage",
        family: "Marriage", health: "Health", business: "Business",
        education: "Education", spirituality: "Spirituality", general: "Career"
      };
      const vedaDomainKey = CHAT_TO_VEDIC[targetDomain] || "Career";
      const mdLordVedic = temporal?.stack?.mahadasha || "Saturn";
      const adLordVedic = temporal?.stack?.antardasha || "Jupiter";

      const natalPromises = NatalPromiseAnalyzer.evaluate(chart as any);
      const promiseMapVedic = natalPromises.reduce((acc, p) => { acc[p.domain] = p.score; return acc; }, {} as Record<string, number>);
      const domainPromise = natalPromises.find(p => p.domain === vedaDomainKey);
      const activations = LifeDomainActivationEngine.evaluate(mdLordVedic, adLordVedic, chart as any, promiseMapVedic);
      const domainActivation = activations.find(a => a.domain === vedaDomainKey) || activations.sort((a, b) => b.score - a.score)[0];

      // Build a concise kundali context string the LLM will narrate from
      let kundaliContext = "";
      if (domainPromise) {
        const supportingFacts = domainPromise.supporting.slice(0, 3).map(s => `  • ${s}`).join("\n");
        const weakeningFacts = domainPromise.weakening.slice(0, 2).map(s => `  • ${s}`).join("\n");
        const activationLine = domainActivation
          ? `\nCURRENT ACTIVATION   : ${domainActivation.score}/100 — ${domainActivation.score >= 80 ? "Strongly active" : domainActivation.score >= 65 ? "Active" : domainActivation.score >= 50 ? "Moderately active" : "Subdued"}`
          : "";
        kundaliContext = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KUNDALI-SPECIFIC READING (this is unique to this person's chart — use these facts, never generic ones)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN ASSESSED      : ${vedaDomainKey}
NATAL PROMISE SCORE  : ${domainPromise.potential}/100 (${domainPromise.confidenceLabel})${activationLine}
CHART INTERPRETATION : ${domainPromise.interpretation}
CONFIDENCE BASIS     : ${domainPromise.confidenceReason}

WHAT SUPPORTS THIS PERSON IN ${vedaDomainKey.toUpperCase()}:
${supportingFacts || "  • Chart analysis in progress"}
${weakeningFacts ? `\nWHAT CREATES FRICTION OR CAUTION:\n${weakeningFacts}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION: Narrate your answer from the KUNDALI-SPECIFIC READING above. These facts are computed from this person's actual birth chart. A different person would see different scores and reasons. Do NOT use generic phrases that would apply to anyone — use the specific scores, interpretation, and supporting factors above as the backbone of your answer.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      }

      // ── V5 Pipeline ───────────────────────────────────────────────────────
      // Layer 1: Rich intent classification
      let richIntent = classifyQuestion(question, targetDomain);

      // Timeframe inheritance for follow-up questions:
      // If user asks "how about next 2 months?" (follow-up, new timeframe) → use the new timeframe.
      // If user asks "what about finance?" (follow-up, no timeframe) → inherit timeframe from prior message.
      if (richIntent.isFollowUp && richIntent.timeframe === "general" && history.length > 0) {
        const recentUserMessages = history
          .filter(m => m.role === "user")
          .slice(-3)
          .map(m => m.content)
          .reverse();
        for (const msg of recentUserMessages) {
          const prevIntent = classifyQuestion(msg, targetDomain);
          if (prevIntent.timeframe !== "general" && prevIntent.timeframeLabel) {
            richIntent = { ...richIntent, timeframe: prevIntent.timeframe, timeframeLabel: prevIntent.timeframeLabel };
            break;
          }
        }
      }

      // Layer 2: Astrological briefing — plain-English pre-computed reasoning
      const brief = buildAstrologicalBrief(
        narrative as any,
        temporal?.stack ?? { mahadasha: "unknown", antardasha: "unknown" },
        currentTransits.positions,
        chart as any,
        targetDomain
      );

      // Layer 3: Assemble V5 prompt (narrate from brief, not raw JSON)
      const prompt = buildV5Prompt({
        question,
        richIntent,
        brief,
        lagnaSignName,
        natalMoonSignName,
        dashaStack: temporal?.stack ?? { mahadasha: "unknown", antardasha: "unknown" },
        transitSummary,
        conversationHistory: history,
        todayLabel,
        moonTransitNote,
        topRisks: topRisks.length > 0 ? topRisks : undefined,
        bodyRiskProfile: bodyRiskProfile ? (bodyRiskProfile as unknown as Record<string, number>) : undefined,
        healthFindings: healthFindings ?? undefined,
        kundaliContext: kundaliContext || undefined,
      });

      try {
        const { text } = await callAI({ prompt, temperature: 0.72 });

        // Extract the LLM-generated follow-up suggestion (EXPLORE: line)
        // and strip it from the visible answer.
        const exploreMatch = text.match(/\nEXPLORE:\s*(.+?)(?:\n|$)/);
        if (exploreMatch?.[1]) {
          followUpText = exploreMatch[1].trim();
        }
        answerText = text.replace(/\nEXPLORE:\s*.+?(?:\n|$)/g, "").trimEnd();
      } catch (aiError: any) {
        console.error("AI Generation failed (all providers):", aiError);
        answerText = `[API Error - LLM Gateway Failed]: ${aiError.message || "AI gateway timeout."}\n\n[Deterministic Fallback]: ${narrative.heroInsight}\n\n${narrative.realityTranslation}`;
      }
    }

    return buildSuccessResponse({
      answer: answerText,
      followUp: followUpText,
      confidence: "high",
      intent: { domain: intent.domain, type: intent.type }
    });

  } catch (error: any) {
    console.error("[pundit/chat] Error:", error);
    return buildErrorResponse("INTERNAL_ERROR", error.message);
  }
}
