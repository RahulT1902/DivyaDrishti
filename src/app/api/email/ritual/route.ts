import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email") || "";
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (emailParam || emailHeader).trim().toLowerCase();

    if (!userEmail) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; padding: 20px; color: #7f1d1d;">
          <h3>Error: Authentication email is required.</h3>
          <p>Please supply '?email=user@domain.com' as a query parameter.</p>
         </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Look up User
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true }
    });

    if (!user) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; padding: 20px; color: #7f1d1d;">
          <h3>Error: User not found.</h3>
         </body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Look up today's or most recent cached Daily Insight
    const latestInsight = await prisma.dailyInsight.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    });

    // Determine Day of Week details for elegant defaults
    const today = new Date();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = weekdays[today.getDay()];

    // Core default Vedic themes based on day of week
    const defaultThemes: Record<string, { theme: string; bullets: string[] }> = {
      Sunday: {
        theme: "Solar Alignment & Vitality",
        bullets: ["soak in morning sunlight", "align physical posture and spine", "step into quiet self-leadership"]
      },
      Monday: {
        theme: "Quiet Reflection & Emotional Anchoring",
        bullets: ["practice deep hydration", "observe a conscious digital break", "stabilize your sleep cycle"]
      },
      Tuesday: {
        theme: "Disciplined Restraint & Physical Focus",
        bullets: ["structure your primary tasks", "practice alternate-nostril breathing", "cool impulsive conversations"]
      },
      Wednesday: {
        theme: "Cognitive Ordering & Written Clarity",
        bullets: ["perform a written brain-dump", "cleanse active inbox notification loops", "speak with deliberate brevity"]
      },
      Thursday: {
        theme: "Wisdom Expansion & Mentor Respect",
        bullets: ["dedicate time to quiet study", "practice gratitude journaling", "share knowledge generously"]
      },
      Friday: {
        theme: "Aesthetic Harmony & Creative Sweetness",
        bullets: ["bring neatness to your workspace", "speak with gentle contentment", "appreciate natural aesthetics"]
      },
      Saturday: {
        theme: "Patience, Order & Selfless Action",
        bullets: ["light a simple Saturday evening candle", "practice patient service to others", "conduct a weekly structural review"]
      }
    };

    const defaultTheme = defaultThemes[currentDayName] || defaultThemes.Monday;

    // Build the Theme and Bullet points based on DB data or fallback
    let themeHeadline = defaultTheme.theme;
    let focusBullets = defaultTheme.bullets;

    if (latestInsight) {
      themeHeadline = latestInsight.summary;
      // Filter out empty or duplicate entries
      const favorableArr = latestInsight.favorable as any;
      if (Array.isArray(favorableArr) && favorableArr.length > 0) {
        focusBullets = (favorableArr as string[]).slice(0, 3);
      }
    }

    // Render premium, ultra-clean HTML email body
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DivyaDrishti Daily Ritual</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" max-width="500px" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #FFFFFF; border: 1px solid #EADFC7; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(63, 45, 29, 0.03);">
          
          <!-- Elegant Top Header Strip -->
          <tr>
            <td style="padding: 30px 40px 10px 40px; text-align: center;">
              <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4em; color: #8C7864; display: block; margin-bottom: 5px;">Celestial Guidance</span>
              <h1 style="font-family: 'Georgia', serif; font-size: 20px; font-weight: normal; letter-spacing: 0.1em; color: #3F2D1D; margin: 0; text-transform: uppercase;">DivyaDrishti</h1>
              <div style="width: 40px; height: 1px; background-color: #EADFC7; margin: 15px auto 0 auto;"></div>
            </td>
          </tr>

          <!-- Core Theme Section -->
          <tr>
            <td style="padding: 20px 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF8; border: 1px solid #F1E7D0; border-radius: 16px; padding: 25px 20px; text-align: center;">
                <tr>
                  <td>
                    <span style="font-size: 24px; display: block; margin-bottom: 8px;">🪔</span>
                    <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; color: #A08060; display: block; margin-bottom: 6px;">Today's Theme</span>
                    <h2 style="font-family: 'Georgia', serif; font-size: 18px; font-weight: normal; color: #3F2D1D; margin: 0; line-height: 1.4;">
                      ${themeHeadline}
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Focus Directives Section -->
          <tr>
            <td style="padding: 10px 40px 30px 40px;">
              <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #3F2D1D; margin-top: 0; margin-bottom: 15px;">Focus gently on:</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${focusBullets.map(bullet => `
                  <tr>
                    <td valign="top" style="font-size: 13px; color: #3F2D1D; padding: 6px 0; width: 20px; text-align: left;">•</td>
                    <td valign="top" style="font-size: 13px; color: #3F2D1D; padding: 6px 0; font-weight: 300; line-height: 1.4; text-align: left;">
                      ${bullet}
                    </td>
                  </tr>
                `).join("")}
              </table>
            </td>
          </tr>

          <!-- Grounding Quote Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8F5EF; border-top: 1px solid #EADFC7; text-align: center;">
              <p style="font-size: 10px; color: #8C7864; margin: 0; font-family: 'Georgia', serif; font-style: italic; line-height: 1.5;">
                "Mastery lies in steady composure and conscious restraint."
              </p>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.25em; color: #A69280; display: block; margin-top: 8px;">
                DivyaDrishti v2.0 • 6:00 AM Ritual
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return new NextResponse(emailHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59"
      }
    });

  } catch (error: any) {
    console.error("[Email Ritual Route Error]:", error?.message || error);
    return new NextResponse(
      `<html><body style="font-family: sans-serif; padding: 20px; color: #7f1d1d;">
        <h3>Error: Internal Server Error</h3>
        <p>Failed to synthesize daily email ritual.</p>
       </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
