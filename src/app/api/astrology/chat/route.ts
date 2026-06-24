import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { extractIntent } from "@/lib/intelligence/intentExtractor";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";
import { callAI, hasAnyProvider } from "@/lib/ai/provider";
import { computeBodyRiskProfile, getTopRisks, type BodyRiskProfile } from "@/lib/intelligence/health/bodyRiskProfile";
import { buildDomainPrompt, buildFollowUp } from "@/lib/intelligence/domainPromptEngine";

export async function POST(req: NextRequest) {
  try {
    const { question, domain: forcedDomain, timeframe: forcedTimeframe, email: bodyEmail, conversationHistory } = await req.json();
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
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (bodyEmail || emailHeader).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: userEmail ? { email: userEmail } : undefined,
      orderBy: userEmail ? undefined : { createdAt: "desc" },
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
      narrativeStyle: extractedIntent.narrativeStyle,
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
      // ── Body Risk Profile (health domain only) ───────────────────────────
      let bodyRiskProfile: BodyRiskProfile | null = null;
      let topRisks: Array<{ system: string; score: number }> = [];
      if (targetDomain === "health" && temporal?.stack) {
        bodyRiskProfile = computeBodyRiskProfile(chart, temporal.stack, currentTransits.positions);
        topRisks = getTopRisks(bodyRiskProfile, 3);
      }

      const historyBlock = history.length > 0
        ? `\nRecent conversation (for context):\n${history.map(m => `${m.role === 'user' ? 'User' : 'Pundit'}: ${m.content}`).join('\n')}\n`
        : "";

      let prompt: string;

      if (targetDomain === "health" && bodyRiskProfile) {
        // ── Health Domain: Wellness Advisor Mode (all scores stay internal) ──
        // History is NOT injected here — the bodyRiskProfile prompt is self-contained
        // and cross-domain history (e.g. a prior career question) would confuse the AI.
        const todayLabel = new Date().toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        });
        const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
        const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Moola","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
        const moonTransit = currentTransits.positions.find(p => p.name === "Moon");
        const moonSignName = moonTransit ? ZODIAC[Math.floor(moonTransit.longitude / 30)] : null;
        const moonDeg = moonTransit ? (moonTransit.longitude % 30).toFixed(1) : null;
        const moonNakshatraName = moonTransit ? NAKSHATRAS[Math.min(26, Math.floor((moonTransit.longitude % 360) / (360 / 27)))] : null;
        const moonNote = moonSignName
          ? `\nToday's Moon: ${moonSignName} at ${moonDeg}°${moonNakshatraName ? `, Nakshatra ${moonNakshatraName}` : ""} — Moon shifts Nakshatra roughly every 24 hours, changing which body systems are most sensitive today.`
          : "";

        prompt = `You are a Vedic wellness advisor generating a personal health forecast.

Today's date: ${todayLabel}${moonNote}

The user asked: "${question}"

You have been given a bodyRiskProfile — an internal model that scores 24 body systems (0–100) for today's health sensitivity based on the user's natal chart, active Dasha, and current transits. Higher score = more astrological stress on that system today.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — SCORES ARE STRICTLY INTERNAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never show raw numbers. Never write "Eyes: 59", "Stress: 82", or "Score: 74".
Users must only read outcomes and experiences — never model values.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE: WELLNESS ADVISOR (not astrologer, not data scientist)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond like a trusted health advisor reviewing today's conditions.
Target composition: 90% health forecast · 10% astrological context (maximum one or two brief phrases explaining why — nothing more).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO INTERPRET SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
70–100 → High sensitivity. Mention clearly with specific symptoms and guidance.
50–69  → Moderate sensitivity. Mention the body area with gentle specificity.
30–49  → Low-moderate. Mention only if user has a known history with that area.
0–29   → Stable. Do not mention unless the user specifically asks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE → REAL SYMPTOM TRANSLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
head / sinuses       → headache, brain fog, mental fatigue, heaviness in head
eyes                 → eye strain, dryness, screen fatigue, tired eyes by evening
nervousSystem        → overthinking, scattered focus, mental restlessness
stress               → mental exhaustion, irritability, difficulty unwinding
sleep                → restlessness, delayed sleep, light sleep, fatigue on waking
digestiveSystem /
stomach / liver      → acidity, bloating, gas, indigestion, appetite changes, discomfort after meals
muscles / joints /
knees / lowerBack /
spine                → stiffness, mild backache, joint discomfort, body tension
heart                → palpitations, chest heaviness, breathlessness on exertion
kidneys              → fatigue, water retention, lower back heaviness
recovery             → slow recovery after effort, lingering tiredness, drained feeling
lungs                → breathlessness, chest tightness
throat / neck /
shoulders            → tension, stiffness, soreness

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIGESTION PRIORITY RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If stomach, digestiveSystem, or liver have moderate or higher sensitivity (50+), always include digestive guidance even if another system ranks slightly higher. Most users have digestive sensitivity. When in doubt, mention digestion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER CONTEXT AWARENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user's question mentions any of the following, increase that area's visibility:
• acidity / stomach / digestion issues → always include digestive guidance
• screen work / long sitting / desk job → emphasize eyes, back, neck
• poor sleep / stress / anxiety         → emphasize sleep, stress, nervous system
• exercise / gym / physical work        → emphasize muscles, recovery, joints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT STRUCTURE — DAILY HEALTH BRIEFING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Structure every response as a prioritized daily health briefing. The user should immediately know what needs the most attention today. Do NOT treat all body systems equally.

MANDATORY FORMAT (follow this exactly):

**Today's Health Focus: [#1 system from the ranked list]**
2–3 sentences on what the user will likely feel in that specific area — name the symptoms, when during the day they may peak, and what makes them worse.

**Also worth watching today:**
• [#2 system] — one sentence, 1–2 specific symptoms
• [#3 system] — one sentence, 1–2 specific symptoms

**What to do today:**
2–3 concrete everyday actions (hydration, meal timing, screen breaks, avoiding heavy foods, rest). Sound like a sensible friend, not a prescription.

One closing line about pacing or self-care.

Rules:
• "Today's Health Focus" heading is mandatory — use it in every health response.
• #1, #2, #3 must map to the pre-ranked systems listed at the bottom of this prompt.
• If digestion (stomach / digestiveSystem / liver) appears in the top 3, always name specific symptoms: acidity, bloating, gas, indigestion, appetite changes.
• Do NOT use clinical headings like "High Risk Areas", "Body System Report", "Score Analysis".
• Write like a trusted advisor giving a quick morning briefing — clear priorities, not a general wellness article.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never write: "The profile shows…", "The score for eyes is…", "The model flags…", "The chart clusters…", "Risk profile indicates…"
Always write: "You may notice…", "Your body could…", "Recovery may feel…", "Today appears…", "It's worth being mindful of…"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREFERRED RESPONSE EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Overall, today appears manageable but your body may be more reactive than usual to stress and irregular routines. Digestive sensitivity is one area to watch — delayed meals or heavy foods could trigger mild acidity or bloating. Eye fatigue may also build during the second half of the day, especially after extended screen time.

Energy levels look adequate for normal activities, but recovery could feel slower than usual. Prioritizing regular meals, short breaks, and staying well-hydrated will make a noticeable difference today.

Today is about maintaining balance, not pushing yourself harder."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECK BEFORE RESPONDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Will the user learn: which body parts need attention · which symptoms may occur · practical steps to take · how today is likely to feel?
If not, revise before responding.

Today's pre-ranked top 3 body systems (use these directly for the mandatory output structure):
1. ${topRisks[0]?.system ?? "stress"} — highest sensitivity today → use for "Today's Health Focus"
2. ${topRisks[1]?.system ?? "recovery"} — second priority → first bullet under "Also worth watching"
3. ${topRisks[2]?.system ?? "digestiveSystem"} — third priority → second bullet under "Also worth watching"

bodyRiskProfile (internal — do NOT reveal these numbers to the user):
${JSON.stringify(bodyRiskProfile, null, 2)}

DeepInsight JSON (use only for minimal astrological timing context — 10% max):
${JSON.stringify(narrative, null, 2)}`;
      } else {
        // ── Non-health: Domain-Specific Prompt ─────────────────────────────
        prompt = buildDomainPrompt(
          intent as any,
          JSON.stringify(narrative, null, 2),
          question,
          bodyRiskProfile
        );
        if (historyBlock) prompt = historyBlock + "\n" + prompt;
      } // end health/generic branch

      try {
        const { text } = await callAI({ prompt, temperature: 0.7 });
        answerText = text;
      } catch (aiError: any) {
        console.error("AI Generation failed (all providers):", aiError);
        answerText = `[API Error - LLM Gateway Failed]: ${aiError.message || "AI gateway timeout."}\n\n[Deterministic Fallback]: ${narrative.heroInsight}\n\n${narrative.realityTranslation}`;
      }
      
      if (intent.domain === "career") followUpText = buildFollowUp("career", intent.type);
      else if (intent.domain === "finance") followUpText = buildFollowUp("finance", intent.type);
      else if (intent.domain === "relationship") followUpText = buildFollowUp("relationship", intent.type);
      else if (intent.domain === "health") followUpText = buildFollowUp("health", intent.type);
      else followUpText = buildFollowUp(intent.domain, intent.type);
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
