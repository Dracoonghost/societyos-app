"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Link2, Loader2, AlertCircle, XCircle, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const INDUSTRIES = [
  "B2B SaaS",
  "Developer Tools",
  "Consumer App",
  "E-commerce",
  "Agency / Services",
  "Media / Content",
  "Physical Product",
  "Marketplace",
  "Other",
];

type Phase = "form" | "submitting" | "error";

interface CreditError {
  required: number;
  remaining: number;
}

export default function NewBrandPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [creditError, setCreditError] = useState<CreditError | null>(null);

  const [brandUrl, setBrandUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");

  // Auto-clear credit error toast after 6 seconds
  useEffect(() => {
    if (phase === "error" && creditError) {
      const timer = setTimeout(() => {
        setCreditError(null);
        setPhase("form");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase, creditError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandUrl.trim()) return;

    setPhase("submitting");
    setErrorMsg("");
    setCreditError(null);

    try {
      const { getIdToken } = await import("firebase/auth");
      const token = await getIdToken(user as Parameters<typeof getIdToken>[0]);

      const res = await fetch(`${API_URL}/api/brands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_url: brandUrl.trim(),
          brand_name: brandName.trim() || undefined,
          industry: industry || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402 && err.detail?.error === "insufficient_credits") {
          setCreditError({
            required: err.detail.credits_required,
            remaining: err.detail.credits_remaining,
          });
          setPhase("error");
          return;
        }
        throw new Error(typeof err.detail === "string" ? err.detail : `Error ${res.status}`);
      }

      const { brandId } = await res.json();
      router.push(`/my-brand/${brandId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 relative">
      {/* Credit error toast */}
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
                  Need <strong className="text-amber-100">{creditError.required}</strong>, you have{" "}
                  <strong className="text-amber-100">{creditError.remaining}</strong>.{" "}
                  <a href="/account" className="underline text-amber-300">Top up</a>
                </span>
              </div>
            </div>
            <button
              onClick={() => { setCreditError(null); setPhase("form"); }}
              className="text-amber-400/50 hover:text-amber-200 hover:bg-amber-400/10 p-1.5 rounded-full transition-all shrink-0"
            >
              <XCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={18} className="text-[var(--accent-cyan)]" />
        <h1 className="text-xl font-bold text-[var(--text-1)]">Add Your Brand</h1>
      </div>
      <p className="text-sm text-[var(--text-3)] mb-8">
        Enter your brand&apos;s website URL. We&apos;ll crawl it and run a full analysis — SEO audit, technical review,
        social media discovery, issue checks, competitor identification, and a complete brand overview. Takes 3–5 minutes.
      </p>

      {/* What you'll get */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 rounded-xl border"
        style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
      >
        {[
          { label: "Brand Overview", desc: "Mission, ICP, value prop" },
          { label: "SEO Audit", desc: "Keywords, gaps, structured data" },
          { label: "Technical", desc: "Stack, performance, security" },
          { label: "AI & Geo", desc: "LLM readiness, local SEO" },
          { label: "Issue Checks", desc: "Critical, warnings, info" },
          { label: "Social Media", desc: "Profiles + analysis" },
          { label: "Competitors", desc: "Discovered & rankable" },
          { label: "Brand Summary", desc: "Health score + actions" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-[var(--text-1)]">{label}</p>
            <p className="text-[10px] text-[var(--text-3)]">{desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Brand URL — required */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Brand Website URL <span className="text-[var(--accent-amber)]">*</span>
          </label>
          <div className="relative">
            <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              type="url"
              required
              placeholder="https://yourbrand.com"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              disabled={phase === "submitting"}
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Brand name — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Brand Name{" "}
            <span className="text-[var(--text-3)] font-normal normal-case">(optional — auto-derived from URL if blank)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Corp"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={phase === "submitting"}
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50"
          />
        </div>

        {/* Industry / category — optional */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
            Industry{" "}
            <span className="text-[var(--text-3)] font-normal normal-case">(optional — helps tailor analysis)</span>
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            disabled={phase === "submitting"}
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] text-[var(--text-1)] text-sm focus:outline-none focus:border-[var(--accent-amber)] transition-colors disabled:opacity-50 appearance-none"
          >
            <option value="">Select industry (optional)</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Cost note */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border text-xs"
          style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)", color: "var(--text-3)" }}
        >
          <AlertCircle size={13} className="shrink-0 text-[var(--accent-amber)]" />
          <span>
            Brand analysis costs <strong className="text-[var(--text-2)]">75 credits</strong>. The pipeline
            runs in the background — you can navigate away and come back.
          </span>
        </div>

        {/* Generic error */}
        {phase === "error" && errorMsg && !creditError && (
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={14} />
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={phase === "submitting" || !brandUrl.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {phase === "submitting" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Starting analysis…
            </>
          ) : (
            <>
              Start Brand Analysis
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
