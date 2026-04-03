"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Target, ChevronRight, Loader2, AlertCircle, XCircle, Link2, Building2, CheckSquare, Square } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const FOCUS_AREAS = [
  { id: "pricing", label: "Pricing" },
  { id: "ads", label: "Ads" },
  { id: "seo", label: "SEO & Marketing" },
  { id: "social", label: "Social" },
  { id: "reviews", label: "Customer Reviews" },
  { id: "news", label: "News & Funding" },
];

type Phase = "form" | "submitting" | "error";

interface CreditError {
  required: number;
  remaining: number;
}

export default function CompetitorAnalysisNewPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [creditError, setCreditError] = useState<CreditError | null>(null);

  useEffect(() => {
    if (phase === "error" && creditError) {
      const timer = setTimeout(() => {
        setCreditError(null);
        if (phase === "error") setPhase("form"); 
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [phase, creditError]);

  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [ownUrl, setOwnUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  function toggleFocus(id: string) {
    setFocusAreas((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competitorUrl.trim()) return;

    setPhase("submitting");
    setErrorMsg("");
    setCreditError(null);

    try {
      const { getIdToken } = await import("firebase/auth");
      const token = await getIdToken(user as Parameters<typeof getIdToken>[0]);

      const res = await fetch(`${API_URL}/api/competitor-analysis`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitor_url: competitorUrl.trim(),
          competitor_name: competitorName.trim() || undefined,
          own_url: ownUrl.trim() || undefined,
          industry: industry.trim() || undefined,
          focus_areas: focusAreas,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402 && err.detail?.error === "insufficient_credits") {
          setCreditError({ required: err.detail.credits_required, remaining: err.detail.credits_remaining });
          setPhase("error");
          return;
        }
        throw new Error(typeof err.detail === "string" ? err.detail : `Error ${res.status}`);
      }

      const { reportId } = await res.json();
      router.push(`/competitor-analysis/${reportId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 relative">
      {/* Sticky credit error banner */}
      <AnimatePresence>
        {phase === "error" && creditError && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-8 right-8 z-50 flex items-center justify-between gap-6 px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(245,158,11,0.15)] border border-amber-500/20 backdrop-blur-md"
            style={{ backgroundColor: "rgba(30, 20, 10, 0.85)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 shrink-0">
                <AlertCircle size={16} className="text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-amber-50">Not enough credits</span>
                <span className="text-xs text-amber-200/60 mt-0.5">
                  Need <strong className="text-amber-100 font-medium">{creditError.required}</strong>, but you only have <strong className="text-amber-100 font-medium">{creditError.remaining}</strong>.
                </span>
              </div>
            </div>
            <button onClick={() => setCreditError(null)} className="text-amber-400/50 hover:text-amber-200 hover:bg-amber-400/10 p-1.5 rounded-full transition-all shrink-0">
              <XCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Target size={18} className="text-[var(--accent-amber)]" />
        <h1 className="text-xl font-bold text-[var(--text-1)]">Analyze a Competitor</h1>
      </div>
      <p className="text-sm text-[var(--text-3)] mb-8">
        Enter a competitor's URL to generate a deep AI-synthesized report. The pipeline runs in the background and takes 3–5 minutes.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Competitor URL — required */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Competitor URL <span className="text-[var(--accent-amber)]">*</span>
          </label>
          <div className="relative">
            <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              type="url"
              required
              placeholder="https://competitor.com"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              disabled={phase === "submitting"}
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Competitor name — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Competitor Name <span className="text-[var(--text-3)] font-normal normal-case">(optional — auto-derived if blank)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Notion, Linear, Figma"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            disabled={phase === "submitting"}
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
          />
        </div>

        {/* Own URL — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Your Product URL{" "}
            <span className="text-[var(--text-3)] font-normal normal-case">(optional — enables vs. You comparison)</span>
          </label>
          <div className="relative">
            <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              type="url"
              placeholder="https://yourproduct.com"
              value={ownUrl}
              onChange={(e) => setOwnUrl(e.target.value)}
              disabled={phase === "submitting"}
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
            />
          </div>
          {ownUrl && (
            <p className="text-[11px] text-[var(--accent-amber)] mt-1.5 flex items-center gap-1">
              <CheckSquare size={11} />
              A "vs. You" comparison section will be included in the report.
            </p>
          )}
        </div>

        {/* Industry — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Industry <span className="text-[var(--text-3)] font-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              type="text"
              placeholder="e.g. SaaS, E-commerce, FinTech"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={phase === "submitting"}
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Focus areas — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Focus Areas <span className="text-[var(--text-3)] font-normal normal-case">(optional — all areas included by default)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FOCUS_AREAS.map((area) => {
              const selected = focusAreas.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleFocus(area.id)}
                  disabled={phase === "submitting"}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    selected
                      ? "bg-amber-950/30 border-amber-700/50 text-[var(--accent-amber)]"
                      : "bg-[var(--bg-1)] border-[var(--border-subtle)] text-[var(--text-3)] hover:border-[var(--border-default)] hover:text-[var(--text-2)]"
                  } disabled:opacity-50`}
                >
                  {selected ? <CheckSquare size={12} /> : <Square size={12} />}
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generic error */}
        {phase === "error" && !creditError && errorMsg && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/30 border border-red-800/40 text-sm text-red-400">
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--text-3)]">75 credits · takes ~3–5 min</p>
          <button
            type="submit"
            disabled={!competitorUrl.trim() || phase === "submitting"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "submitting" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Run Analysis
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
