"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, AlertTriangle, Share2, Activity, FileText } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SharedReview {
  id: string;
  type: string;
  useCase: string | null;
  title: string;
  createdAt: string | null;
  idea: string;
  personas: Array<{ id: string; name: string; archetype: string; emoji: string; color: string }>;
  analyses: Record<string, unknown>;
  researchPackData: Record<string, unknown> | null;
  artifacts: Array<{ id: string; type: string; title: string; content: string; created_at: string }>;
  simulationVerdict?: {
    verdict: string;
    what_worked?: string[];
    avg_comprehension: number;
    avg_engagement: number;
    share_rate: number;
    risk_flags: string[];
    recommendations: string[];
  };
  simulationReactions?: Array<{
    name: string;
    role: string;
    reaction: string;
    comprehension: number;
    engagement: number;
    confusion: string;
    would_share: boolean;
  }>;
  simulationDebateMessages?: Array<{
    from_name: string;
    to_names: string[];
    message: string;
    role: string;
  }>;
  simulationMode?: string | null;
  panelSize?: number | null;
  iterationLabel?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const USE_CASE_LABELS: Record<string, string> = {
  "validate-idea": "Validate Idea",
  "review-feature": "Review Feature",
  "review-pitch": "Review Pitch",
  "test-ad": "Ad Test",
  "test-messaging": "Messaging Test",
  "stress-test-launch": "Launch Stress Test",
  "analyze-competitor": "Competitor Analysis",
};

const AVATAR_COLORS = ["#4a7a5e", "#4a6b9e", "#9e7a4a", "#7a4a9e", "#9e4a5e", "#4a8a7a"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
function scoreColor(pct: number) {
  if (pct >= 0.7) return "var(--accent-emerald)";
  if (pct >= 0.5) return "var(--accent-amber)";
  return "var(--accent-coral)";
}

function MetricCard({ label, value, max, unit }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = max ? value / max : value / 100;
  const color = scoreColor(pct);
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
      <span className="section-label">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>
          {max ? value.toFixed(1) : String(value)}
        </span>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>{unit ?? (max ? `/ ${max}` : "%")}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, background: color }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((Math.min(value, max) / max) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs w-28 flex-shrink-0" style={{ color: "var(--text-3)" }}>{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor(pct / 100) }} />
      </div>
      <span className="text-xs tabular-nums w-8 text-right" style={{ color: "var(--text-3)" }}>{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<SharedReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/share/${token}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string };
          throw new Error(err.detail || "Shared link not found.");
        }
        const json = await res.json();
        setData(json.review);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not load shared review.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)" }}>
        <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-3)" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)" }}>
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {error || "This link has expired or is invalid."}
          </p>
          <Link href="/" className="text-sm" style={{ color: "var(--accent-amber)" }}>
            Learn about SocietyOS →
          </Link>
        </div>
      </div>
    );
  }

  const isSimulation = data.type === "simulation";
  const verdict = data.simulationVerdict;
  const reactions = data.simulationReactions ?? [];
  const debate = data.simulationDebateMessages ?? [];
  const wouldShareCount = reactions.filter((r) => r.would_share).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Shared-from banner */}
      <div
        className="py-2.5 px-6 flex items-center justify-between gap-4 text-xs"
        style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2" style={{ color: "var(--text-3)" }}>
          <span
            className="font-semibold"
            style={{ color: "var(--accent-amber)" }}
          >
            Society<span style={{ color: "var(--text-2)" }}>OS</span>
          </span>
          <span>· Shared analysis</span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
          style={{ color: "var(--accent-amber)" }}
        >
          Run your own review →
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          {isSimulation
            ? <Activity size={16} style={{ color: "var(--accent-emerald)" }} />
            : <FileText size={16} style={{ color: "var(--accent-amber)" }} />
          }
          {data.useCase && (
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={
                isSimulation
                  ? { background: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }
                  : { background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }
              }
            >
              {USE_CASE_LABELS[data.useCase] ?? data.useCase}
            </span>
          )}
          <span className="text-sm truncate max-w-sm" style={{ color: "var(--text-2)" }}>{data.title}</span>
          <span className="ml-auto text-xs hidden sm:inline" style={{ color: "var(--text-3)" }}>
            {data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Content/idea */}
        <div className="rounded-xl p-5" style={{ background: "var(--panel)", border: "1px solid var(--border-subtle)" }}>
          <p className="section-label mb-2">{isSimulation ? "Content Tested" : "Idea Reviewed"}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-2)" }}>{data.idea}</p>
        </div>

        {/* ── SIMULATION VIEW ──────────────────────────────────────────────── */}
        {isSimulation && verdict && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard label="Comprehension" value={verdict.avg_comprehension} max={5} />
              <MetricCard label="Engagement" value={verdict.avg_engagement} max={5} />
              <MetricCard label="Would Share" value={verdict.share_rate} unit={`% (${wouldShareCount}/${reactions.length})`} />
            </div>

            <section>
              <p className="section-label mb-3">Jury Verdict</p>
              <div className="rounded-xl p-6" style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(242,169,59,0.18)" }}>
                <p className="leading-relaxed" style={{ color: "var(--text-1)", lineHeight: "1.8" }}>{verdict.verdict}</p>
              </div>
            </section>

            {((verdict.what_worked && verdict.what_worked.length > 0) || verdict.risk_flags.length > 0) && (
              <section>
                <p className="section-label mb-3">Breakdown</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {verdict.what_worked && verdict.what_worked.length > 0 && (
                    <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(56,178,125,0.18)" }}>
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
                    <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(223,107,87,0.18)" }}>
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

            {reactions.length > 0 && (
              <section>
                <p className="section-label mb-4">Panel Voices</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reactions.map((r) => {
                    const ac = avatarColor(r.name);
                    const isStrong = r.comprehension >= 3 && r.engagement >= 3;
                    return (
                      <div key={r.name} className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: isStrong ? "1px solid rgba(56,178,125,0.15)" : "1px solid var(--border-subtle)" }}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: ac, color: "rgba(0,0,0,0.85)" }}>
                            {initials(r.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold">{r.name}</span>
                              {r.would_share && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}>
                                  <Share2 size={9} />Would share
                                </span>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: "var(--text-3)" }}>{r.role}</span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>&ldquo;{r.reaction}&rdquo;</p>
                        <div className="space-y-1.5">
                          <ScoreBar label="Comprehension" value={r.comprehension} />
                          <ScoreBar label="Engagement" value={r.engagement} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {debate.length > 0 && (
              <section>
                <p className="section-label mb-3">Group Debate</p>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  <div className="p-5 space-y-5" style={{ background: "var(--bg-1)" }}>
                    {debate.map((dm, i) => {
                      const ac = avatarColor(dm.from_name);
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: ac, color: "rgba(0,0,0,0.85)" }}>
                            {initials(dm.from_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 mb-1.5">
                              <span className="text-sm font-semibold">{dm.from_name}</span>
                              <span className="text-xs" style={{ color: "var(--text-3)" }}>{dm.role}</span>
                            </div>
                            <div className="rounded-lg p-3.5" style={{ background: "var(--panel)", border: "1px solid rgba(242,169,59,0.08)" }}>
                              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{dm.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── REVIEW VIEW ──────────────────────────────────────────────────── */}
        {!isSimulation && (
          <>
            {data.personas.length > 0 && (
              <section>
                <p className="section-label mb-4">Expert Panel ({data.personas.length} advisors)</p>
                <div className="space-y-3">
                  {data.personas.slice(0, 4).map((p) => {
                    const analysisRaw = (data.analyses as Record<string, unknown>)[p.id];
                    const analysisText = typeof analysisRaw === "string"
                      ? analysisRaw
                      : typeof analysisRaw === "object" && analysisRaw !== null && "text" in analysisRaw
                        ? String((analysisRaw as { text: unknown }).text)
                        : null;
                    return (
                      <div key={p.id} className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: p.color || "#4a7a5e", color: "rgba(0,0,0,0.85)" }}>
                            {p.emoji || initials(p.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs" style={{ color: "var(--text-3)" }}>{p.archetype}</p>
                          </div>
                        </div>
                        {analysisText && (
                          <p className="text-sm leading-relaxed line-clamp-5" style={{ color: "var(--text-2)" }}>
                            {analysisText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {data.personas.length > 4 && (
                    <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
                      + {data.personas.length - 4} more advisors
                    </p>
                  )}
                </div>
              </section>
            )}

            {data.artifacts.length > 0 && (
              <section>
                <p className="section-label mb-4">Generated Artifacts ({data.artifacts.length})</p>
                <div className="space-y-3">
                  {data.artifacts.map((a) => (
                    <div key={a.id} className="rounded-xl p-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                      <p className="font-semibold text-sm mb-1">{a.title}</p>
                      <p className="text-sm leading-relaxed line-clamp-4 whitespace-pre-line" style={{ color: "var(--text-2)" }}>{a.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(242,169,59,0.22)" }}
        >
          <p className="font-bold mb-1" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            Run your own {isSimulation ? "audience simulation" : "strategic review"}
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
            50 free credits to start. No card required. Results in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="btn-primary"
            >
              Get started free →
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary"
            >
              View Pricing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
