"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DetailedSection {
  title?: string;
  content?: string;
}

interface PredictionPayload {
  analysis?: string;
  narrative?: string;
  detailedReport?: Record<string, DetailedSection>;
  keyPoints?: string[];
}

type OutputMode = "PANDIT" | "SIMPLE_ENGLISH";

function buildInitialAssistantContent(predictions: PredictionPayload, timeframe: string, domain: string): string {
  return predictions.narrative
    ? predictions.narrative
    : predictions.detailedReport
      ? generateDetailedReportContent(predictions)
      : `I'm analyzing your ${domain} predictions for ${timeframe}. Based on the current celestial positions, here's what I found:\n\n${predictions.analysis || "Loading analysis..."}`;
}

export default function PredictionChat({
  predictions,
  timeframe,
  domain,
  outputMode,
  modeLoading,
  onModeChange,
  onBack,
}: {
  predictions: PredictionPayload;
  timeframe: string;
  domain: string;
  outputMode: OutputMode;
  modeLoading: boolean;
  onModeChange: (mode: OutputMode) => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: buildInitialAssistantContent(predictions, timeframe, domain),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: buildInitialAssistantContent(predictions, timeframe, domain),
        timestamp: new Date(),
      },
    ]);
  }, [predictions, timeframe, domain]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/predictions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "",
          message: input,
          timeframe,
          domain,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't process that. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl border-b border-purple-500/20 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                {domain.charAt(0).toUpperCase() + domain.slice(1)} Guidance
              </h1>
              <p className="text-sm text-slate-400">
                Timeframe: <span className="capitalize text-purple-300">{timeframe}</span>
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-purple-500/30 bg-slate-900/50 p-1">
            <button
              onClick={() => onModeChange("PANDIT")}
              disabled={modeLoading}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                outputMode === "PANDIT" ? "bg-purple-500 text-white" : "text-slate-300 hover:text-white"
              } ${modeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Hindi
            </button>
            <button
              onClick={() => onModeChange("SIMPLE_ENGLISH")}
              disabled={modeLoading}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                outputMode === "SIMPLE_ENGLISH" ? "bg-purple-500 text-white" : "text-slate-300 hover:text-white"
              } ${modeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-6 py-8">
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl px-6 py-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-slate-800/50 border border-purple-500/20 text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800/50 border border-purple-500/20 px-6 py-4 rounded-lg">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.1,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-t from-slate-950 to-slate-950/40 backdrop-blur-xl border-t border-purple-500/20 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 px-6 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:bg-slate-800 outline-none transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center gap-2 font-semibold"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Questions are limited to <strong>{domain}</strong> predictions for{" "}
            <strong className="capitalize">{timeframe}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function generateDetailedReportContent(predictions: PredictionPayload): string {
  const report = predictions.detailedReport;
  if (!report) return predictions.analysis || "Loading analysis...";

  let content = `${predictions.analysis || ""}\n\n`;

  // Add each section as flowing narrative (no explicit section headers)
  Object.values(report).forEach((section) => {
    if (section.content) {
      content += `${section.content}\n\n`;
    }
  });

  // Add key points
  if (predictions.keyPoints?.length) {
    content += `Practical takeaway:\n${predictions.keyPoints.map((point: string) => `- ${point}`).join('\n')}`;
  }

  return content;
}

