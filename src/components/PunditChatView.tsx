"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Compass, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "pundit";
  content: string;
  followUp?: string;
}

export default function PunditChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "pundit",
      content: "Welcome. I am here to help you understand how your current life phase (Dasha) is shaping your reality.\n\nWhat is your primary concern today? (e.g., career change, financial move, or personal stress)"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const res = await fetch("/api/astrology/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, email: userEmail }),
      });
      const result = await res.json();

      if (result.success) {
        setMessages(prev => [
          ...prev,
          {
            role: "pundit",
            content: result.data.answer,
            followUp: result.data.followUp
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "pundit",
            content: "The cosmic lines are noisy at the moment. Please try rephrasing your question."
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "pundit",
          content: "I am unable to reach the celestial engine right now."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white border border-[#F1E7D0] rounded-3xl overflow-hidden shadow-md">
      
      {/* Header */}
      <div className="p-5 border-b border-[#F1E7D0] flex items-center justify-between bg-amber-50">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
               <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
               <h3 className="text-sm font-bold tracking-widest text-amber-800 uppercase">Chat Pundit</h3>
               <p className="text-[10px] text-amber-700/50 uppercase tracking-widest">Diagnostic Consult</p>
            </div>
         </div>
          <div className="flex items-center gap-2 px-4 py-1 bg-emerald-100 border border-emerald-200 rounded-full">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
             <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Active Engine</span>
          </div>
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] space-y-4 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-5 rounded-2xl ${
                  m.role === "user"
                    ? "bg-amber-100 border border-amber-200 text-amber-900"
                    : "bg-amber-50 border border-[#F1E7D0]"
                }`}>
                  {m.role === "pundit" ? (
                    <PunditResponse content={m.content} />
                  ) : (
                    <p className="text-sm font-normal leading-relaxed">{m.content}</p>
                  )}
                </div>

                {m.role === "pundit" && m.followUp && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.5 }}
                     className="pl-6 space-y-3"
                   >
                      <p className="text-xs text-indigo-300 font-light italic">
                        {m.followUp}
                      </p>
                      <button 
                        onClick={() => handleSend(m.followUp)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                      >
                        Explore This <ArrowRight className="w-3 h-3" />
                      </button>
                   </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
               <div className="p-5 rounded-2xl bg-amber-50 border border-[#F1E7D0] flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="text-xs text-amber-700/60 font-medium tracking-widest uppercase">Pundit is reflecting...</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-5 bg-amber-50 border-t border-[#F1E7D0]">
         <form
           onSubmit={(e) => { e.preventDefault(); handleSend(); }}
           className="relative flex items-center gap-3"
         >
            <div className="relative flex-1">
               <input
                 ref={inputRef}
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Ask about career, timing, relationships..."
                 className="w-full bg-white border border-[#F1E7D0] rounded-full py-3.5 pl-5 pr-12 text-sm text-amber-900 placeholder-amber-400/60 outline-none focus:border-amber-400 transition-all"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
                  <Sparkles className="w-4 h-4 text-amber-400/40" />
               </div>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-200 hover:bg-amber-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale transition-all"
            >
               <Send className="w-4 h-4" />
            </button>
         </form>
         <p className="text-[9px] text-amber-700/30 text-center mt-3 uppercase tracking-[0.3em]">
           Ask about Career, Money, Relationships, or Timing
         </p>
      </div>

    </div>
  );
}

function PunditResponse({ content }: { content: string }) {
  const parts = content.split("\n\n");

  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (i === 0) return (
          <p key={i} className="text-base font-serif font-medium text-amber-900 border-l-2 border-amber-500 pl-4 py-1 leading-snug">
            {part}
          </p>
        );

        if (i === parts.length - 1) return (
          <p key={i} className="text-xs font-bold text-amber-600 border-t border-amber-100 pt-3 tracking-wide">
            {part}
          </p>
        );

        return (
          <p key={i} className="text-sm text-amber-800 font-normal leading-relaxed whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </div>
  );
}
