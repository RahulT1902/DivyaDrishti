import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { extractIntent } from "@/lib/intelligence/intentExtractor";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Configure Provider dynamically
const useDeepSeek = !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "sk-...";

const aiProvider = createOpenAI({
  baseURL: useDeepSeek ? 'https://api.deepseek.com/v1' : undefined,
  apiKey: useDeepSeek ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY,
});

const aiModel = useDeepSeek ? "deepseek-chat" : "gpt-4o";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return buildErrorResponse("DATA_MALFORMATION", "Please provide a valid question.", 400);
    }

    // 1. Get User Context
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return buildErrorResponse("DATA_MALFORMATION", "User profile not found.", 404);
    }

    // 2. Intent Extraction
    const extractedIntent = extractIntent(question);
    
    // Ensure intent is passed as an object
    const intent = {
      domain: extractedIntent.domain,
      type: extractedIntent.type || "general",
      confidence: extractedIntent.confidence,
      timeframe: "this-week"
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
    const narrative = generateNarrative(intent as any, "this-week" as any, chart, temporal);

    // 5. LLM Agentic Layer
    let answerText = "";
    let followUpText = "What specific aspect of this phase would you like to explore further?";

    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      answerText = `[Deterministic Insight]: ${narrative.heroInsight}\n\n${narrative.realityTranslation}\n\n👉 Focus on structured consistency during this ${intent.domain} phase.`;
    } else {
      const prompt = `You are Chat Pundit, an elite diagnostic Vedic astrologer.
The user asked: "${question}"

Analyze their current life phase using the DeepInsight JSON below.
Provide your response in EXACTLY 2 or 3 short paragraphs.
- Paragraph 1: Direct Answer (Stance) based on the insight.
- Paragraph 2/3: Explanation and Guidance.
- End with a separate punchy Verdict sentence.
NEVER use jargon like "Rahu", "Ketu", "Dasha", or "House".
Speak plainly, authoritatively, and empirically.

DeepInsight JSON:
${JSON.stringify(narrative, null, 2)}`;

      try {
        const { text } = await generateText({
          model: aiProvider.chat(aiModel),
          prompt,
          temperature: 0.7,
        });
        answerText = text;
      } catch (aiError) {
        console.error("AI Generation failed (Quota/Auth):", aiError);
        answerText = `[Deterministic Insight]: ${narrative.heroInsight}\n\n${narrative.realityTranslation}\n\n👉 Focus on structured consistency during this ${intent.domain} phase.`;
      }
      
      if (intent.domain === "career") followUpText = "Are you considering a specific role change, or just reviewing options?";
      else if (intent.domain === "finance") followUpText = "Is this related to an investment or an ongoing expense?";
      else if (intent.domain === "relationship") followUpText = "Are you seeking clarity on a specific dynamic or general harmony?";
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
