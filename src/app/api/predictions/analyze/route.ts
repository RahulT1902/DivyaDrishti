import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getCurrentDasha } from "@/lib/astrology/dasha";
import { generateHumanGuidance } from "@/lib/intelligence/interpretationEngine";

type Domain = "career" | "finance" | "health" | "relationships" | "growth" | "mind";
type Timeframe = "today" | "this-week" | "this-month" | "this-year";

const domainInsights: Record<Domain, { title: string; description: string }> = {
  career: {
    title: "Career Guidance",
    description: "Professional growth, job changes, and opportunities",
  },
  finance: {
    title: "Financial Insights",
    description: "Investments, income, and financial decisions",
  },
  health: {
    title: "Health & Wellness",
    description: "Physical and mental well-being",
  },
  relationships: {
    title: "Relationship Guidance",
    description: "Love, family, and social connections",
  },
  growth: {
    title: "Personal Growth",
    description: "Self-improvement and life evolution",
  },
  mind: {
    title: "Mind & Peace",
    description: "Mental clarity, meditation, and inner peace",
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get("timeframe") as Timeframe) || "today";
    const domain = (searchParams.get("domain") as Domain) || "career";

    // Get user
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate chart
    const chart = await calculateLagnaChart({
      date: user.birthDetails.dateOfBirth.toISOString().split("T")[0],
      time: user.birthDetails.timeOfBirth,
      latitude: user.birthDetails.latitude,
      longitude: user.birthDetails.longitude,
      timezone: user.birthDetails.timezone,
    });

    // Get transits
    const currentTransits = await calculateCurrentTransits();

    // Calculate dasha
    const moon = chart.planets.find((p: any) => p.name === "Moon");
    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(
      user.birthDetails.dateOfBirth,
      nakshatra.lord,
      balance
    );
    const currentDasha = getCurrentDasha(timeline, new Date());

    // Generate predictions
    const predictions = generateDomainPredictions(
      chart,
      currentTransits,
      currentDasha,
      domain,
      timeframe
    );

    return NextResponse.json({
      success: true,
      predictions: {
        ...predictions,
        ...domainInsights[domain],
        timeframe,
        domain,
      },
    });
  } catch (error: any) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateDomainPredictions(
  chart: any,
  transits: any,
  dasha: any,
  domain: Domain,
  timeframe: Timeframe
) {
  // Base predictions for each domain
  const predictions: Record<Domain, { analysis: string; keyPoints: string[] }> = {
    career: {
      analysis: `Based on your current planetary positions and ${dasha.ad.planet} Antardasha, your career sector shows ${
        dasha.ad.planet === "Jupiter" ? "excellent expansion potential" : "steady progress with consolidation opportunities"
      }. ${
        transits.positions.some((p: any) => p.name === "Saturn")
          ? "Saturn's influence suggests this is a time for building strong foundations."
          : "Jupiter's positive influence enhances growth opportunities."
      }`,
      keyPoints: [
        "Focus on skill development and strategic planning",
        "Network with influential contacts",
        "Avoid impulsive career decisions",
        "This is favorable for long-term projects",
      ],
    },
    finance: {
      analysis: `Your financial sector is currently ${
        transits.positions.some((p: any) => p.name === "Jupiter") ? "in an expansion phase" : "in consolidation mode"
      }. With ${dasha.ad.planet} active, focus on ${
        dasha.ad.planet === "Jupiter" ? "strategic investments and growth" : "risk management and savings"
      }.`,
      keyPoints: [
        "Review investments and diversify portfolio",
        "Avoid speculative decisions",
        "Focus on long-term wealth building",
        "Monitor cash flow carefully",
      ],
    },
    health: {
      analysis: `Health indicators suggest maintaining a balanced routine. Current planetary configurations indicate ${
        dasha.ad.planet === "Mars"
          ? "increased energy levels - channel this positively"
          : "a period for rest and recovery"
      }.`,
      keyPoints: [
        "Maintain consistent exercise routine",
        "Focus on preventive healthcare",
        "Manage stress through meditation",
        "Adequate sleep is crucial now",
      ],
    },
    relationships: {
      analysis: `Your relationship sector shows ${
        dasha.ad.planet === "Venus"
          ? "harmonious energies for deepening connections"
          : "a time for understanding and communication"
      }. Focus on genuine connection and authenticity.`,
      keyPoints: [
        "Communicate openly with loved ones",
        "Plan quality time together",
        "Address any pending issues thoughtfully",
        "Build stronger emotional bonds",
      ],
    },
    growth: {
      analysis: `This period is favorable for personal evolution. ${dasha.ad.planet} suggests focusing on ${
        dasha.ad.planet === "Jupiter" ? "new learning opportunities" : "consolidating existing skills"
      }.`,
      keyPoints: [
        "Invest in learning and development",
        "Step out of comfort zone carefully",
        "Seek mentorship and guidance",
        "Document your progress",
      ],
    },
    mind: {
      analysis: `Mental clarity is enhanced during this period. Current astral configuration suggests ${
        dasha.ad.planet === "Mercury" ? "enhanced cognitive abilities" : "a good time for introspection"
      }.`,
      keyPoints: [
        "Practice meditation and mindfulness",
        "Journal your thoughts regularly",
        "Seek quiet time for reflection",
        "Trust your intuition",
      ],
    },
  };

  return predictions[domain];
}
