import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

async function testDeepSeek() {
  try {
    const client = createOpenAI({ baseURL: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY });
    await generateText({ model: client.chat("deepseek-chat"), prompt: "Say OK", maxTokens: 5 });
    return "OK";
  } catch (e: any) {
    return e?.message?.slice(0, 100) ?? "unknown error";
  }
}

async function testGroq() {
  try {
    const client = createOpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY });
    await generateText({ model: client.chat("llama-3.3-70b-versatile"), prompt: "Say OK", maxTokens: 5 });
    return "OK";
  } catch (e: any) {
    return e?.message?.slice(0, 100) ?? "unknown error";
  }
}

async function testGemini() {
  try {
    const client = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    await generateText({ model: client("gemini-2.0-flash"), prompt: "Say OK", maxTokens: 5 } as any);
    return "OK";
  } catch (e: any) {
    return e?.message?.slice(0, 100) ?? "unknown error";
  }
}

export async function GET() {
  const [deepseek, groq, gemini] = await Promise.all([testDeepSeek(), testGroq(), testGemini()]);
  return NextResponse.json({ deepseek, groq, gemini });
}
