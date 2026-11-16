"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { authFetch } from "@/lib/auth/webFetch";

interface Due {
  id: string;
  domain: string;
  direction: "favourable" | "caution";
  confidence: "firm" | "moderate";
  reason: string;
  checkQuestion: string;
}
interface HitRate { answered: number; score: number | null }
interface Data { due: Due[]; upcoming: number; stats: { overall: HitRate; byConfidence: Record<string, HitRate> } }

const OUTCOMES: Array<{ id: "yes" | "somewhat" | "no"; label: string }> = [
  { id: "yes", label: "Yes" },
  { id: "somewhat", label: "Somewhat" },
  { id: "no", label: "No" },
];

const pct = (s: number | null) => (s === null ? null : `${Math.round(s * 100)}%`);

/**
 * Step C check-in: once a predicted window has passed, ask whether it matched,
 * and show Pundit's measured track record (only after 5 answers — a rate from
 * two check-ins would claim more than it shows).
 */
export default function PredictionCheckIn() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    authFetch("/api/predictions/accountability")
      .then(r => r.json())
      .then(j => { if (j?.success) setData(j.data); })
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const answer = async (id: string, outcome: string) => {
    setBusy(true);
    try {
      await authFetch("/api/predictions/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, outcome }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null;
  const { due, upcoming, stats } = data;
  if (!due.length && !upcoming && !stats.overall.answered) return null;

  const record = stats.overall.score !== null
    ? `Track record: ${pct(stats.overall.score)} from ${stats.overall.answered} check-ins` +
      (["firm", "moderate"].map(c => stats.byConfidence[c]?.score != null ? `${c} ${pct(stats.byConfidence[c].score)}` : null)
        .filter(Boolean).map(s => ` · ${s}`).join(""))
    : `Track record appears after 5 check-ins (${stats.overall.answered} so far)`;
  const item = due[0];

  return (
    <div className="px-5 py-3 border-b border-[#F1E7D0] bg-[#FFFBF2]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Prediction check-in</p>
        <p className="text-[10px] text-amber-700/70">
          {record}{upcoming ? ` · ${upcoming} being tracked` : ""}
        </p>
      </div>
      {item ? (
        <div className="mt-2">
          <p className="text-sm text-stone-800">{item.checkQuestion}</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Pundit called this {item.direction === "caution" ? "a caution period" : "a favourable period"} ({item.confidence}) — {item.reason}.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {OUTCOMES.map(o => (
              <button
                key={o.id}
                disabled={busy}
                onClick={() => answer(item.id, o.id)}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 disabled:opacity-50"
              >
                {o.label}
              </button>
            ))}
            <button
              disabled={busy}
              onClick={() => answer(item.id, "skip")}
              className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700 disabled:opacity-50"
            >
              Not sure
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-stone-500 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Nothing to check right now — you'll be asked once a predicted window has passed.
        </p>
      )}
    </div>
  );
}
