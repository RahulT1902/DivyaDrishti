import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return new Response("Email required", { status: 400 });
    }

    // ── 1. Fetch User Context & Birth Details ────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email },
      include: { birthDetails: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // ── 2. Fetch Today's Cached Daily Guidance ──────────────────────────────
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dailyInsight = await prisma.dailyInsight.findFirst({
      where: {
        userId: user.id,
        date: today,
      },
      orderBy: { generatedAt: "desc" },
    });

    // Elegant fallback content if daily brief has not been generated yet today
    const headline = dailyInsight?.summary || "Quiet alignment brings clarity to action.";
    const tone = dailyInsight?.emotionalTone || "Reflective & Grounded";
    
    let dashaText = "Saturn Mahadasha";
    if (user.birthDetails) {
      const birthYear = user.birthDetails.dateOfBirth.getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 30) {
        dashaText = "Jupiter Mahadasha • Mercury Antar";
      } else {
        dashaText = "Saturn Mahadasha • Venus Antar";
      }
    }

    const dateFormatted = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    // ── 3. Render Premium Editorial Editorial Social Card (1080x1080) ────────
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#060112",
            backgroundImage: "radial-gradient(circle at 50% 30%, #1c0f38 0%, #060112 70%)",
            padding: "80px",
            boxSizing: "border-box",
            border: "1px solid rgba(197, 160, 89, 0.15)",
          }}
        >
          {/* Outer Thin Gold Border */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "30px",
              right: "30px",
              bottom: "30px",
              border: "1px solid rgba(197, 160, 89, 0.2)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                fontWeight: "300",
                letterSpacing: "0.4em",
                color: "#c5a059",
                marginBottom: "8px",
              }}
            >
              DIVYADRISHTI
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                letterSpacing: "0.3em",
                color: "rgba(165, 180, 252, 0.4)",
                textTransform: "uppercase",
              }}
            >
              Celestial Guidance Practice
            </span>
          </div>

          {/* Core Body Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              maxWidth: "800px",
              margin: "auto 0",
            }}
          >
            {/* User Meta */}
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                letterSpacing: "0.2em",
                color: "rgba(255, 255, 255, 0.6)",
                textTransform: "uppercase",
                marginBottom: "40px",
              }}
            >
              {user.name}
            </span>

            {/* Main Quote / Hero Directive */}
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "44px",
                lineHeight: "1.4",
                color: "#ffffff",
                fontStyle: "italic",
                fontWeight: "300",
                marginBottom: "45px",
              }}
            >
              &ldquo;{headline}&rdquo;
            </span>

            {/* Horizontal Gold Line Accent */}
            <div
              style={{
                width: "60px",
                height: "1px",
                backgroundColor: "rgba(197, 160, 89, 0.4)",
                marginBottom: "40px",
              }}
            />

            {/* Cosmic State Details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "0.25em",
                  color: "#c5a059",
                  textTransform: "uppercase",
                }}
              >
                {tone}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color: "rgba(165, 180, 252, 0.6)",
                }}
              >
                {dashaText}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "rgba(255, 255, 255, 0.3)",
              }}
            >
              {dateFormatted}
            </span>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "#c5a059",
                opacity: 0.8,
              }}
            >
              divyadrishti.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (error: any) {
    console.error("[Cosmic Card Rendering Error]", error);
    return new Response("Failed to generate Cosmic Card", { status: 500 });
  }
}
