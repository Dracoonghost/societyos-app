"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Loader2, Activity, AlertTriangle, CheckCircle, Users, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SimMetricsDecor } from "@/components/ui/DecorativeViz";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimReaction {
  name: string;
  role: string;
  reaction: string;
  comprehension: number;
  engagement: number;
  confusion: string;
  would_share: boolean;
}

interface SimDebateMessage {
  from_name: string;
  to_names: string[];
  message: string;
  role: string;
}

interface SimVerdict {
  verdict: string;
  what_worked?: string[];
  avg_comprehension: number;
  avg_engagement: number;
  share_rate: number;
  risk_flags: string[];
  recommendations: string[];
}

interface SimulationData {
  id: string;
  title: string;
  useCase: string;
  createdAt: string;
  idea: string;
  simulationVerdict: SimVerdict | null;
  simulationReactions: SimReaction[];
  simulationDebateMessages: SimDebateMessage[];
  panelSize: number | null;
  audienceId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USE_CASE_LABELS: Record<string, string> = {
  "test-ad": "Ad Test",
  "test-messaging": "Messaging Test",
  "stress-test-launch": "Launch Stress Test",
  "analyze-competitor": "Competitor Analysis",
};

const AVATAR_COLORS = ["#4a7a5e", "#4a6b9e", "#9e7a4a", "#7a4a9e", "#9e4a5e", "#4a8a7a", "#7a5a4a", "#4a9e7a"];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function scoreColor(pct: number) {
  if (pct >= 0.7) return "var(--accent-emerald)";
  if (pct >= 0.5) return "var(--accent-amber)";
  return "var(--accent-coral)";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, max, unit }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = max ? value / max : value / 100;
  const color = scoreColor(pct);
  const displayValue = max
    ? (typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : String(value))
    : String(value);

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
    >
      <span className="section-label">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>
          {displayValue}
        </span>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>
          {unit ?? (max ? `/ ${max}` : "%")}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((Math.min(value, max) / max) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs w-28 flex-shrink-0" style={{ color: "var(--text-3)" }}>{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.06)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: scoreColor(pct / 100) }}
        />
      </div>
      <span className="text-xs tabular-nums w-6 text-right" style={{ color: "var(--text-3)" }}>
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SimulationResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getIdToken, loading: authLoading } = useAuth();

  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        const token = await getIdToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/reviews/${id}`, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to load simulation.");
        }
        const json = await res.json();
        const r = json.review;
        setData({
          id: r.id,
          title: r.title || "Audience Simulation",
          useCase: r.useCase || "simulation",
          createdAt: r.createdAt,
          idea: r.idea || "",
          simulationVerdict: r.simulationVerdict ?? null,
          simulationReactions: r.simulationReactions ?? [],
          simulationDebateMessages: r.simulationDebateMessages ?? [],
          panelSize: r.panelSize ?? null,
          audienceId: r.audienceId ?? null,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not load simulation.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--text-3)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading simulation results...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)" }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>{error || "Simulation not found."}</p>
          <Link href="/dashboard" className="text-sm text-[var(--accent-amber)]">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const verdict = data.simulationVerdict;
  const reactions = data.simulationReactions;
  const debate = data.simulationDebateMessages;

  const confusionPoints = reactions
    .filter((r) => r.confusion && r.confusion.trim().length > 3)
    .map((r) => ({ name: r.name, text: r.confusion }));

  const strongReactions = reactions.filter((r) => r.comprehension >= 3 && r.engagement >= 3);
  const wouldShareCount = reactions.filter((r) => r.would_share).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* ── Simulation header ── */}
      <header
        className="flex-shrink-0 flex flex-col"
        style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--panel)" }}
      >
        {/* Row 1: meta + actions */}
        <div className="max-w-4xl mx-auto px-6 w-full h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs transition-colors flex-shrink-0"
              style={{ color: "var(--text-3)" }}
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="w-px h-4 hidden sm:block flex-shrink-0" style={{ backgroundColor: "var(--border-subtle)" }} />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold truncate max-w-[180px]" style={{ color: "var(--text-1)" }}>
                {data.title}
              </span>
              <span
                className="accent-chip flex-shrink-0"
                style={{ backgroundColor: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}
              >
                {USE_CASE_LABELS[data.useCase] ?? "Simulation"}
              </span>
              {data.panelSize && (
                <span className="accent-chip flex-shrink-0" style={{ color: "var(--text-3)" }}>
                  {data.panelSize} members
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                sessionStorage.setItem("sim_rerun", JSON.stringify({ idea: data.idea, useCase: data.useCase }));
                router.push(`/simulations/new?use_case=${data.useCase}&step=3`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-2)", color: "var(--text-2)" }}
            >
              <Users size={11} />
              Run with Different Audience
            </button>
          </div>
        </div>

      </header>


      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

          {/* Page title + badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Activity size={18} className="text-[var(--accent-emerald)]" />
              <h1 className="font-bold" style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}>
                Simulation Results
              </h1>
              {reactions.length > 0 && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                >
                  {reactions.length} panel members
                </span>
              )}
              {((data as any).simulationMode) && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                >
                  {(data as any).simulationMode === "discussion" ? "Panel Discussion"
                    : (data as any).simulationMode === "quick_pulse" ? "Quick Pulse"
                    : (data as any).simulationMode === "compare_variants" ? "Compare Variants"
                    : (data as any).simulationMode === "rank_options" ? "Rank Options"
                    : (data as any).simulationMode}
                </span>
              )}
              {data.panelSize && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                >
                  {data.panelSize} respondents
                </span>
              )}
              {data.audienceId && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(242,169,59,0.08)", color: "var(--accent-amber)", border: "1px solid rgba(242,169,59,0.25)" }}
                >
                  Custom audience
                </span>
              )}
            </div>
            {/* Content tested */}
            <div
              className="rounded-xl p-5 mt-4"
              style={{ background: "var(--panel)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="section-label mb-2">Content Tested</p>
              <p className="text-sm leading-relaxed line-clamp-4" style={{ color: "var(--text-2)" }}>
                {data.idea}
              </p>
            </div>
          </motion.div>

          {/* Metrics row */}
          {verdict && (
            <motion.section
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <SimMetricsDecor />
              <div className="grid grid-cols-3 gap-4 relative z-[1]">
                <MetricCard label="Comprehension" value={verdict.avg_comprehension} max={5} />
                <MetricCard label="Engagement" value={verdict.avg_engagement} max={5} />
                <MetricCard label="Would Share" value={verdict.share_rate} unit={`% (${wouldShareCount}/${reactions.length})`} />
              </div>
            </motion.section>
          )}

          {/* Verdict */}
          {verdict && (
            <section>
              <p className="section-label mb-3">Jury Verdict</p>
              <div
                className="rounded-xl p-6"
                style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(242, 169, 59, 0.18)" }}
              >
                <p className="leading-relaxed text-base" style={{ color: "var(--text-1)", lineHeight: "1.8" }}>
                  {verdict.verdict}
                </p>
              </div>
            </section>
          )}

          {/* Breakdown */}
          {verdict && ((verdict.what_worked && verdict.what_worked.length > 0) || verdict.risk_flags.length > 0) && (
            <section>
              <p className="section-label mb-3">Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {verdict.what_worked && verdict.what_worked.length > 0 && (
                  <div
                    className="rounded-xl p-5"
                    style={{ background: "var(--bg-1)", border: "1px solid rgba(56, 178, 125, 0.18)" }}
                  >
                    <p className="section-label mb-4" style={{ color: "var(--accent-emerald)" }}>What Landed</p>
                    <ul className="space-y-3">
                      {verdict.what_worked.map((w, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle size={14} className="text-[var(--accent-emerald)] flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {verdict.risk_flags.length > 0 && (
                  <div
                    className="rounded-xl p-5"
                    style={{ background: "var(--bg-1)", border: "1px solid rgba(223, 107, 87, 0.18)" }}
                  >
                    <p className="section-label mb-4" style={{ color: "var(--accent-coral)" }}>What Didn&apos;t Land</p>
                    <ul className="space-y-3">
                      {verdict.risk_flags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <AlertTriangle size={14} className="text-[var(--accent-coral)] flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Confusion points */}
          {confusionPoints.length > 0 && (
            <section>
              <p className="section-label mb-3">What Confused the Panel</p>
              <div
                className="rounded-xl divide-y overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--panel)" }}
              >
                {confusionPoints.map((cp, i) => (
                  <div
                    key={i}
                    className="px-5 py-3.5 flex items-start gap-3"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: avatarColor(cp.name), color: "rgba(0,0,0,0.8)" }}
                    >
                      {initials(cp.name)}
                    </div>
                    <div>
                      <span className="text-xs font-medium mr-2" style={{ color: "var(--text-3)" }}>
                        {cp.name}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-2)" }}>
                        {cp.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {verdict && verdict.recommendations.length > 0 && (
            <section>
              <p className="section-label mb-3">Recommendations</p>
              <div className="space-y-2.5">
                {verdict.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 rounded-xl px-5 py-4"
                    style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                      style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{r}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Panel voices */}
          {reactions.length > 0 && (
            <section>
              <div className="flex items-baseline gap-3 mb-5">
                <p className="section-label">Panel Voices</p>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {strongReactions.length} of {reactions.length} had strong comprehension + engagement
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reactions.map((r) => {
                  const ac = avatarColor(r.name);
                  const isStrong = r.comprehension >= 3 && r.engagement >= 3;
                  return (
                    <motion.div
                      key={r.name}
                      className="rounded-xl p-5"
                      style={{
                        background: "var(--bg-1)",
                        border: isStrong
                          ? "1px solid rgba(56, 178, 125, 0.15)"
                          : "1px solid var(--border-subtle)",
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ background: ac, color: "rgba(0,0,0,0.85)" }}
                        >
                          {initials(r.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                              {r.name}
                            </span>
                            {r.would_share && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}
                              >
                                <Share2 size={9} />
                                Would share
                              </span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>{r.role}</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>
                        &ldquo;{r.reaction}&rdquo;
                      </p>
                      <div className="space-y-1.5">
                        <ScoreBar label="Comprehension" value={r.comprehension} />
                        <ScoreBar label="Engagement" value={r.engagement} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Group debate */}
          {debate.length > 0 && (
            <section>
              <p className="section-label mb-3">Group Debate</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="px-5 py-3.5"
                  style={{ background: "var(--panel)", borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Panel members responding to each other — unfiltered
                  </p>
                </div>
                <div className="p-5 space-y-5" style={{ background: "var(--bg-1)" }}>
                  {debate.map((dm, i) => {
                    const ac = avatarColor(dm.from_name);
                    return (
                      <div key={i} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ background: ac, color: "rgba(0,0,0,0.85)" }}
                        >
                          {initials(dm.from_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2 mb-1.5">
                            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                              {dm.from_name}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-3)" }}>{dm.role}</span>
                            <span className="text-xs" style={{ color: "var(--text-3)", opacity: 0.6 }}>
                              ↩ {dm.to_names.join(", ")}
                            </span>
                          </div>
                          <div
                            className="rounded-lg p-3.5"
                            style={{ background: "var(--panel)", border: "1px solid rgba(242, 169, 59, 0.08)" }}
                          >
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                              {dm.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {!verdict && (
            <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-1)" }}>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Simulation data is still processing or unavailable.
              </p>
            </div>
          )}

          {/* ─── What's Next? ─── */}
          {verdict && (
            <section className="pt-10 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--text-3)" }}>
                What&apos;s Next?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/simulations/new"
                  className="card-cyan rounded-xl p-5 flex flex-col gap-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="icon-box icon-box-cyan">
                      <Activity size={14} className="text-[var(--accent-cyan)]" />
                    </div>
                    <ArrowLeft size={13} className="text-[var(--text-3)] rotate-180 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-1)] mb-1">Re-test with a different audience</p>
                    <p className="text-xs text-[var(--text-3)] leading-relaxed">Try different demographics or messaging variants to compare reactions.</p>
                  </div>
                </Link>
                <Link
                  href="/reviews/new?mode=review"
                  className="card-amber rounded-xl p-5 flex flex-col gap-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="icon-box icon-box-amber">
                      <CheckCircle size={14} className="text-[var(--accent-amber)]" />
                    </div>
                    <ArrowLeft size={13} className="text-[var(--text-3)] rotate-180 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-1)] mb-1">Run a strategic review</p>
                    <p className="text-xs text-[var(--text-3)] leading-relaxed">Get expert panel analysis of the underlying idea informed by these audience insights.</p>
                  </div>
                </Link>
                <Link
                  href="/competitor-analysis/new"
                  className="card rounded-xl p-5 flex flex-col gap-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="icon-box" style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}>
                      <Users size={14} style={{ color: "var(--text-2)" }} />
                    </div>
                    <ArrowLeft size={13} className="text-[var(--text-3)] rotate-180 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-1)] mb-1">Analyze a competitor</p>
                    <p className="text-xs text-[var(--text-3)] leading-relaxed">Deep-dive a competitor&apos;s pricing, positioning, and GTM strategy.</p>
                  </div>
                </Link>
              </div>
            </section>
          )}
        </div>

    </div>
  );
}
