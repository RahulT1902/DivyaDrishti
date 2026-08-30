"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scroll, Download, Loader2, CheckCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { authFetch } from "@/lib/auth/webFetch";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS  = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

const DOMAINS = [
  { key: "career",       label: "Career & Purpose",     emoji: "💼", color: "amber" },
  { key: "health",       label: "Health & Wellbeing",   emoji: "🌿", color: "emerald" },
  { key: "finance",      label: "Finance & Wealth",      emoji: "💰", color: "yellow" },
  { key: "relationship", label: "Relationships & Love",  emoji: "💝", color: "rose" },
] as const;

interface ReportData {
  year:         number;
  career:       string | null;
  health:       string | null;
  finance:      string | null;
  relationship: string | null;
  paidAt:       string | null;
}

declare global {
  interface Window { Razorpay: any; }
}

function DomainSection({ domain, content }: { domain: typeof DOMAINS[number]; content: string }) {
  const [expanded, setExpanded] = useState(true);
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="border border-amber-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-amber-50 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{domain.emoji}</span>
          <span className="text-sm font-bold text-amber-800 uppercase tracking-widest">{domain.label}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-5 space-y-4">
              {paragraphs.map((para, i) => {
                if (i === 0) return (
                  <p key={i} className="text-base font-serif font-medium text-amber-900 border-l-2 border-amber-500 pl-4 py-1 leading-snug">
                    {para}
                  </p>
                );
                return (
                  <p key={i} className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{para}</p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnnualReportPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR + 1);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Check if report already exists for selected year
  useEffect(() => {
    setChecking(true);
    setReport(null);
    authFetch(`/api/astrology/annual-report/year?year=${selectedYear}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.paid) setReport(data.data);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [selectedYear]);

  const handlePurchase = async () => {
    setError(null);
    setPurchasing(true);

    try {
      // Load Razorpay script
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load payment gateway"));
          document.head.appendChild(s);
        });
      }

      // Create order
      const orderRes = await authFetch("/api/astrology/annual-report/purchase", {
        method: "POST",
        body:   JSON.stringify({ year: selectedYear }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        if (orderData.data?.alreadyPurchased) {
          // Refresh
          const r = await authFetch(`/api/astrology/annual-report/year?year=${selectedYear}`).then(r => r.json());
          if (r.success && r.data.paid) setReport(r.data);
          setPurchasing(false);
          return;
        }
        throw new Error(orderData.error?.message ?? "Failed to create order");
      }

      const { orderId, amount, currency, keyId } = orderData.data;

      // Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         keyId,
          amount,
          currency,
          name:        "DivyaDrishti",
          description: `${selectedYear} Annual Reading`,
          order_id:    orderId,
          theme:       { color: "#D97706" },
          handler: async (response: any) => {
            try {
              setLoading(true);
              const verifyRes = await authFetch("/api/astrology/annual-report/verify", {
                method: "POST",
                body:   JSON.stringify({
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  year:              selectedYear,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setReport(verifyData.data);
                resolve();
              } else {
                reject(new Error(verifyData.error?.message ?? "Verification failed"));
              }
            } catch (e: any) {
              reject(e);
            } finally {
              setLoading(false);
            }
          },
          modal: { ondismiss: () => reject(new Error("cancelled")) },
        });
        rzp.open();
      });
    } catch (err: any) {
      if (err.message !== "cancelled") setError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Scroll className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900 tracking-wide">Annual Reading</h1>
        </div>
        <p className="text-sm text-amber-700/60">Complete year outlook across all four domains of life</p>
      </div>

      {/* Year picker */}
      {!report && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Select Year</p>
          <div className="flex gap-3">
            {YEAR_OPTIONS.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                  selectedYear === y
                    ? "bg-amber-600 text-white border-amber-600 shadow-md"
                    : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {checking ? (
            <div className="flex items-center gap-2 text-amber-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Checking…</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">What's included</p>
                <ul className="space-y-1">
                  {DOMAINS.map(d => (
                    <li key={d.key} className="flex items-center gap-2 text-sm text-amber-800">
                      <span>{d.emoji}</span> {d.label}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                onClick={handlePurchase}
                disabled={purchasing || loading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing || loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {loading ? "Generating your reading…" : "Opening payment…"}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Get {selectedYear} Annual Reading — ₹599</>
                )}
              </button>
              <p className="text-[10px] text-amber-600/50 text-center">One-time purchase · Secure payment via Razorpay · UPI · Cards · Netbanking</p>
            </div>
          )}
        </div>
      )}

      {/* Report */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            ref={reportRef}
            className="space-y-4"
            id="annual-report-content"
          >
            {/* Report header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-100 print:border-amber-300">
              <div>
                <h2 className="text-lg font-bold text-amber-900">{report.year} Annual Reading</h2>
                <p className="text-[10px] text-amber-600/50 uppercase tracking-widest">DivyaDrishti · Vedic Astrology</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-50 transition-colors print:hidden"
                >
                  <Download className="w-3 h-3" /> Save as PDF
                </button>
              </div>
            </div>

            {/* Domain sections */}
            {DOMAINS.map(d => report[d.key as keyof ReportData] ? (
              <DomainSection
                key={d.key}
                domain={d}
                content={report[d.key as keyof ReportData] as string}
              />
            ) : null)}

            {/* Purchase another year */}
            <div className="pt-4 border-t border-amber-100 flex gap-3 print:hidden">
              {YEAR_OPTIONS.filter(y => y !== report.year).map(y => (
                <button
                  key={y}
                  onClick={() => { setReport(null); setSelectedYear(y); }}
                  className="text-xs font-bold text-amber-600 border border-amber-200 rounded-full px-4 py-2 hover:bg-amber-50 transition-colors"
                >
                  Get {y} Reading
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
