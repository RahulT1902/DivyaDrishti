import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Domain = "career" | "finance" | "health" | "relationships" | "growth" | "mind";
type Timeframe = "today" | "this-week" | "this-month" | "this-year";

export async function POST(req: NextRequest) {
  try {
    const { message, timeframe, domain, conversationHistory } = await req.json();

    if (!message || !domain || !timeframe) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user context
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate a contextual response based on the domain and timeframe
    const response = generateContextualResponse(
      message,
      domain as Domain,
      timeframe as Timeframe,
      conversationHistory
    );

    // Save conversation to database
    await prisma.predictionRecord.create({
      data: {
        userId: user.id,
        type: "chat_interaction",
        domain: domain,
        prediction: message,
        predictionScore: 0.8,
        accuracyPredicted: 0,
        confidence: 0.8,
        risk: 0.2,
        startTime: new Date(),
        endTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateContextualResponse(
  message: string,
  domain: Domain,
  timeframe: Timeframe,
  conversationHistory: any[]
): string {
  // Create contextual responses based on common questions
  const lowerMessage = message.toLowerCase();

  const domainContext = {
    career: {
      positive: [
        "The cosmos favors your professional growth right now. Consider taking on new challenges.",
        "Your work energy is aligned with expansion. This is a good time for negotiations.",
        "Professional relationships will be harmonious. Collaborate openly with colleagues.",
      ],
      challenges: [
        "Take a step back and evaluate your career direction carefully.",
        "This is a consolidation period. Focus on strengthening existing skills.",
        "Patience is needed. Don't rush major career decisions right now.",
      ],
    },
    finance: {
      positive: [
        "Financial flow looks favorable. This is a good time for new investments.",
        "Your earning potential is highlighted. Seek new income opportunities.",
        "Wealth accumulation is supported by the cosmos right now.",
      ],
      challenges: [
        "Review your spending habits carefully.",
        "Save rather than spend during this period.",
        "Avoid speculative investments for now.",
      ],
    },
    health: {
      positive: [
        "Your vitality is at a good level. Maintain your health practices.",
        "Energy levels are high. Use this time for fitness activities.",
        "Mental clarity is your strength right now.",
      ],
      challenges: [
        "Rest and recovery are important now.",
        "Pay attention to dietary and sleep habits.",
        "Reduce stress through meditation.",
      ],
    },
    relationships: {
      positive: [
        "Relationships are harmonious. Deepen your connections.",
        "Communication flows beautifully. Express your feelings openly.",
        "This is favorable for commitment and bonding.",
      ],
      challenges: [
        "Give each other space and respect.",
        "Listen more than you speak.",
        "Avoid misunderstandings through clear communication.",
      ],
    },
    growth: {
      positive: [
        "This is an excellent phase for learning and development.",
        "Your potential is expanding. Embrace new opportunities.",
        "Growth is natural now. Don't hold back.",
      ],
      challenges: [
        "Focus on one goal at a time.",
        "Build patience in your development journey.",
        "Seek guidance from mentors.",
      ],
    },
    mind: {
      positive: [
        "Your intuition is strong. Trust your inner voice.",
        "Mental clarity allows for important decisions.",
        "This is peaceful time for introspection.",
      ],
      challenges: [
        "Overthinking might cloud judgment. Breathe.",
        "Practice meditation for clarity.",
        "Limit external stimulation.",
      ],
    },
  };

  // Check for specific question types
  if (
    lowerMessage.includes("when") ||
    lowerMessage.includes("timeline") ||
    lowerMessage.includes("how long")
  ) {
    return `Based on the current ${timeframe} timeframe you've selected, this influence is active through the end of this period. Specific timing depends on planetary transits. For more precision, please consult after the period ends.\n\nIn the context of ${domain}, observe how things unfold during this window.`;
  }

  if (
    lowerMessage.includes("risk") ||
    lowerMessage.includes("danger") ||
    lowerMessage.includes("bad")
  ) {
    const challenges = domainContext[domain].challenges;
    return `Awareness of challenges is wisdom. In your ${domain} area during ${timeframe}:\n\n${challenges[Math.floor(Math.random() * challenges.length)]}\n\nRemember, challenges are opportunities for growth.`;
  }

  if (
    lowerMessage.includes("opportunity") ||
    lowerMessage.includes("best") ||
    lowerMessage.includes("action")
  ) {
    const positive = domainContext[domain].positive;
    return `This is an excellent insight. Regarding opportunities in ${domain} during ${timeframe}:\n\n${positive[Math.floor(Math.random() * positive.length)]}\n\nSeize the moment with calculated decisions.`;
  }

  // Default contextual response
  const responses = [
    `Your question about ${domain} during ${timeframe} touches on an important area. Based on current planetary configurations, focus on ${getKeyAction(domain)}. The cosmic timing supports thoughtful action here.`,
    `That's a relevant point for your ${domain} journey. In this ${timeframe} window, consider how ${getKeyInsight(domain)} aligns with your goals.`,
    `Interesting perspective. Within the ${timeframe} timeframe, your ${domain} sector is responding to ${getPlanetaryInfluence(domain)}. This creates opportunities for ${getOpportunity(domain)}.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function getKeyAction(domain: Domain): string {
  const actions = {
    career: "strategic planning and relationship building",
    finance: "reviewing investments and diversifying",
    health: "consistency in health practices",
    relationships: "genuine communication",
    growth: "learning something new",
    mind: "introspection and clarity",
  };
  return actions[domain];
}

function getKeyInsight(domain: Domain): string {
  const insights = {
    career: "your professional direction",
    finance: "your financial goals",
    health: "your wellness routine",
    relationships: "your emotional connections",
    growth: "your development path",
    mind: "your inner peace",
  };
  return insights[domain];
}

function getPlanetaryInfluence(domain: Domain): string {
  const influences = {
    career: "current transits in your 10th house",
    finance: "Jupiter's position relative to your wealth indicators",
    health: "lunar phases and their effect on vitality",
    relationships: "Venus aspects in your seventh house",
    growth: "Mercury's cognitive influence",
    mind: "the nodes' karmic guidance",
  };
  return influences[domain];
}

function getOpportunity(domain: Domain): string {
  const opportunities = {
    career: "advancement and recognition",
    finance: "sustainable wealth building",
    health: "establishing stronger wellness habits",
    relationships: "deeper bonds with loved ones",
    growth: "meaningful personal evolution",
    mind: "discovering inner wisdom",
  };
  return opportunities[domain];
}
