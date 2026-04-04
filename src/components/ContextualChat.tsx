"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare, ShieldAlert } from "lucide-react";
import { HumanGuidance, Intent, Timeframe } from "@/lib/intelligence/types";

interface ContextualChatProps {
  guidance: HumanGuidance;
  intent: Intent;
  timeframe: Timeframe;
  initialMessage?: string;
  variant?: "light" | "dark";
}

export default function ContextualChat({ guidance, intent, timeframe, initialMessage, variant = "light" }: ContextualChatProps) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>(() => [
    { role: "ai", content: initialMessage || `I am your Cosmic Advisor. I am currently aligned with your ${intent} guidance for ${timeframe.replace("-", " ")}. How can I clarify these energies for you?` }
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

    // Simulate AI response with strict guardrails
    setTimeout(() => {
      let response = "";
      
      // Guardrail Check: Timeframe/Context
      if (userMsg.toLowerCase().includes("next month") || userMsg.toLowerCase().includes("next year")) {
        response = `I am currently aligned with your guidance for ${timeframe.replace("-", " ")}. To explore future periods, please recalibrate your timeframe in the dashboard.`;
      } else if (guidance.decisionSignal === "WAIT" && (userMsg.toLowerCase().includes("should i move") || userMsg.toLowerCase().includes("start now"))) {
        response = `Based on your current ${intent} alignment, the heavens advise a 'WAIT' signal. It is better to observe and prepare rather than taking immediate aggressive steps. Patience will bring more clarity soon.`;
      } else {
        response = `Your ${intent} current is ${guidance.emotionalTone.toLowerCase()}. The focus should remain on ${guidance.whatToDo[0].toLowerCase()}. ${guidance.oneLineTruth}`;
      }

      setMessages(prev => [...prev, { role: "ai", content: response }]);
      setLoading(false);
    }, 1000);
  };

  const isDark = variant === "dark";

  return (
    <div className={`flex flex-col h-full min-h-[500px] overflow-hidden ${isDark ? 'bg-black/20 text-white' : 'glass-card bg-white shadow-sm border-black/[0.03]'}`}>
      {/* Chat Header: Institutional Style */}
      <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.01]'} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDark ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/10'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-white/80' : 'text-black/80'}`}>Cosmic Advisor</h4>
            <p className={`text-[9px] uppercase tracking-widest font-medium ${isDark ? 'text-white/20' : 'text-black/40'}`}>Aligned with {intent} • {timeframe.replace("-", " ")}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar min-h-0">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed ${
                msg.role === 'user' 
                  ? (isDark ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' : 'bg-amber-500/10 text-amber-900 border border-amber-500/20')
                  : (isDark ? 'bg-white/5 text-white/80 border border-white/5' : 'bg-black/[0.03] text-black/80 border border-black/[0.05]')
              } ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                {msg.content}
              </div>
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

      {/* Input */}
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
