"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertCircle, TrendingUp, Shield } from "lucide-react";
import { Intent, Timeframe, DeepInsight, AstroEvidence } from "@/lib/intelligence/types";

interface ContextualChatProps {
  intent: Intent;
  timeframe: Timeframe;
  initialMessage?: string;
  variant?: "light" | "dark";
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  insight?: DeepInsight;
}

export default function ContextualChat({ intent, timeframe, initialMessage, variant = "light" }: ContextualChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "ai", content: initialMessage || `I am your Cosmic Advisor. I am currently aligned with your ${intent.domain} guidance for ${timeframe}. How can I clarify these energies for you?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const response = await fetch("/api/predictions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          timeframe,
          domain: intent.domain,
          email: userEmail
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: data.response,
          insight: data.insight 
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "ai", content: "I encountered an error analyzing the cosmic signals. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const isDark = variant === "dark";

  return (
    <div className={`flex flex-col h-full min-h-[500px] overflow-hidden ${isDark ? 'bg-black/20 text-white' : 'glass-card bg-white shadow-sm border-black/[0.03]'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.01]'} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDark ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/10'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-white/80' : 'text-black/80'}`}>Cosmic Advisor</h4>
            <p className={`text-[9px] uppercase tracking-widest font-medium ${isDark ? 'text-white/20' : 'text-black/40'}`}>Aligned with {intent.domain} • {timeframe}</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar min-h-0">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
              {/* Text Message */}
              <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed ${
                msg.role === 'user' 
                  ? (isDark ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' : 'bg-amber-500/10 text-amber-900 border border-amber-500/20')
                  : (isDark ? 'bg-white/5 text-white/80 border border-white/5' : 'bg-black/[0.03] text-black/80 border border-black/[0.05]')
              } ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                {msg.content}
              </div>

              {/* Progressive Disclosure UI (Only for AI with insight) */}
              {msg.insight && msg.role === "ai" && (
                <div className={`w-full max-w-[85%] p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'} mt-2`}>
                  
                  {/* Layer 1: Hero Insight */}
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {msg.insight.heroInsight}
                  </h3>

                  {/* Layer 2: Core Summary */}
                  <p className="text-xs opacity-80 mb-4">{msg.insight.realityTranslation}</p>

                  {/* Intelligence Density Indicators */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-[10px] gap-2">
                      <span className="w-16">Timing</span>
                      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(msg.insight.confidence.timing / 10) * 100}%` }} />
                      </div>
                      <span>{msg.insight.confidence.timing}/10</span>
                    </div>
                    <div className="flex items-center text-[10px] gap-2">
                      <span className="w-16">Stability</span>
                      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(msg.insight.confidence.manifestation / 10) * 100}%` }} />
                      </div>
                      <span>{msg.insight.confidence.manifestation}/10</span>
                    </div>
                  </div>

                  {/* Layer 4: Expandable Evidence */}
                  <details className="text-xs group">
                    <summary className="cursor-pointer font-semibold flex items-center gap-1 opacity-70 hover:opacity-100">
                      Why this conclusion?
                    </summary>
                    <div className="mt-3 space-y-3 pl-2 border-l-2 border-amber-500/30">
                      {msg.insight.evidence.map((ev: AstroEvidence, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          {ev.impact === "supportive" ? <TrendingUp className="w-3 h-3 text-green-500 mt-0.5" /> : 
                           ev.impact === "restrictive" ? <Shield className="w-3 h-3 text-red-500 mt-0.5" /> : 
                           <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5" />}
                          <div>
                            <span className="font-semibold block">{ev.factor}</span>
                            <span className="opacity-80 block">{ev.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>

                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex justify-start">
             <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-black/[0.03] border-black/[0.05]'} p-4 rounded-2xl rounded-tl-none border flex gap-1`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
             </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.01]'}`}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a clarifying question..."
            className={`w-full h-12 rounded-xl pl-5 pr-12 text-sm outline-none transition-all font-medium border ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:border-amber-500/50' 
                : 'bg-white border-black/[0.05] text-black placeholder:text-black/20 focus:border-amber-500/30'
            }`}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-30 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
