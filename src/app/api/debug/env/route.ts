import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDeepSeek: !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "sk-...",
    hasGroq: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "gsk_...",
    hasGemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-key-here",
    deepseekKeyPrefix: process.env.DEEPSEEK_API_KEY?.slice(0, 8) ?? "NOT SET",
    groqKeyPrefix: process.env.GROQ_API_KEY?.slice(0, 8) ?? "NOT SET",
    geminiKeyPrefix: process.env.GEMINI_API_KEY?.slice(0, 8) ?? "NOT SET",
  });
}
