import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { 
  getNakshatra, 
  getBalanceYears, 
  buildMahadashaTimeline, 
  getCurrentDasha 
} from "@/lib/astrology/dasha";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { Intent, IntentDomain } from "@/lib/intelligence/types";
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
    const { message, timeframe, domain, conversationHistory, email: bodyEmail } = await req.json();

    if (!message || !domain || !timeframe) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 1. Get user context
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (bodyEmail || emailHeader).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: userEmail ? { email: userEmail } : undefined,
      orderBy: userEmail ? undefined : { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return NextResponse.json(
        { success: false, error: "User or birth details not found" },
        { status: 404 }
      );
    }

    // 2. Intent Identification
    const intent: Intent = {
      domain: domain as IntentDomain,
      type: "general",
      confidence: 1, // Add confidence field which is required by Intent interface
      timeframe: timeframe.replace("-", "") as any
    };

    // 3. Astro Intelligence Pipeline
    const chart = await calculateLagnaChart({
      date: user.birthDetails.dateOfBirth.toISOString().split("T")[0],
      time: user.birthDetails.timeOfBirth,
      latitude: user.birthDetails.latitude,
      longitude: user.birthDetails.longitude,
      timezone: user.birthDetails.timezone,
    });

    const transits = await calculateCurrentTransits();

    const moon = (chart as any).planets.find((p: any) => p.name === "Moon");
    const nakshatra = getNakshatra(moon?.longitude || 0);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(user.birthDetails.dateOfBirth, nakshatra.lord, balance);
    const currentDasha = getCurrentDasha(timeline, new Date());

    if (!currentDasha) {
      throw new Error("Unable to calculate current dasha phase.");
    }

    // 4. Generate DeepInsight JSON
    const insight = generateNarrative(
      intent, 
      timeframe as any, 
      chart, 
      { stack: currentDasha, transits }
    );

    // 5. LLM Narrative Generation
    let chatResponseText = "";
    let answerText = "";
    
    // Check if DEEPSEEK_API_KEY is available
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      answerText = `[Deterministic Insight]: ${insight.heroInsight}\n\n${insight.realityTranslation}\n\n👉 This phase favors stability over aggressive moves.`;
    } else {
      const prompt = `You are a Vedic Astrology Intelligence Engine named DivyaDrishti.
Analyze the user's question and current life phase using the DeepInsight JSON below.

Question: "${message}"
Current Timeline Context: ${timeframe}
Focus Area: ${domain}
Conversation History: ${JSON.stringify(conversationHistory)}

DeepInsight JSON:
${JSON.stringify(insight, null, 2)}`;

      try {
        const { text } = await generateText({
          model: aiProvider.chat(aiModel),
          prompt,
          temperature: 0.8,
        });
        answerText = text;
      } catch (aiError) {
        console.error("AI Generation failed (Quota/Auth):", aiError);
        answerText = `[Deterministic Insight]: ${insight.heroInsight}\n\n${insight.realityTranslation}\n\n👉 This phase favors stability over aggressive moves.`;
      }
    }
    
    chatResponseText = answerText;

    // 6. Save conversation to database
    await prisma.predictionRecord.create({
      data: {
        userId: user.id,
        type: "chat_interaction",
        domain: domain,
        prediction: message,
        predictionScore: insight.confidence.timing / 10,
        accuracyPredicted: insight.confidence.manifestation / 10,
        confidence: insight.confidence.timing / 10,
        risk: insight.confidence.volatility / 10,
        startTime: new Date(),
        endTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      response: chatResponseText,
      insight: insight, // Send the JSON back for the Progressive UI
      intent: intent
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate cosmic insight." },
      { status: 500 }
    );
  }
}
