"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Loader2,
  Zap,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─── Pre-built audiences ────────────────────────────────────── */
const PREBUILT_AUDIENCES: AudienceCard[] = [
  {
    id: "prebuilt:genz",
    name: "Gen Z",
    description: "Digital natives aged 18–26 — trend-aware, social-first, value-driven consumers.",
    geography: "Global",
    age_band: "18 – 24",
    role: "Digital Natives",
  },
  {
    id: "prebuilt:millennial",
    name: "Millennials",
    description: "Career-established 28–42 year-olds — pragmatic, research-heavy, brand-conscious.",
    geography: "Global",
    age_band: "25 – 34",
    role: "Working Professionals",
  },
];

/* ─── Types ─────────────────────────────────────────────────── */
interface AudienceCard {
  id: string;
  name: string;
  description?: string;
  geography?: string;
  age_band?: string;
  role?: string;
  generated_personas?: unknown[];
}

interface Reaction {
  name: string;
  role: string;
  message: string;
  comprehension?: number;
  engagement?: number;
  confusion?: string;
  would_share?: boolean;
}

interface DebateMsg {
  from_name: string;
  to_names: string[];
  message: string;
  role: string;
}

interface Verdict {
  summary: string;
  overall_sentiment?: string;
  key_themes?: string[];
  recommendation?: string;
}

interface PastSimVerdict {
  summary: string;
  overall_sentiment?: string;
  risk_flags?: string[];
  what_worked?: string[];
  recommendations?: string[];
  avg_comprehension?: number;
  avg_engagement?: number;
  share_rate?: number;
}

interface PastSim {
  id: string;
  title: string;
  createdAt: string | null;
  audienceId: string | null;
  panelSize: number | null;
  status?: string;
  verdict: PastSimVerdict;
  reactionCount: number;
}

interface Props {
  reviewId: string;
  reviewIdea: string;
  reviewTitle: string;
  researchPack?: string;
  analyses?: Record<string, { text?: string } | string>;
  onBack: () => void;
  getToken: () => Promise<string | null>;
}

/* ─── Small sub-components ───────────────────────────────────── */
function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;
  const pct = Math.round(value * 20); // 1-5 scale → 0-100%
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{value}/5</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-0)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "var(--accent-amber)" }}
        />
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function AudienceSimView({ reviewId, reviewIdea, reviewTitle, researchPack, analyses, onBack, getToken }: Props) {
  const [audiences, setAudiences] = useState<AudienceCard[]>([]);
  const [loadingAudiences, setLoadingAudiences] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pastSims, setPastSims] = useState<PastSim[]>([]);
  const [expandedPastSim, setExpandedPastSim] = useState<string | null>(null);

  // Stream state
  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [panelMembers, setPanelMembers] = useState<{ name: string; role: string }[]>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [debate, setDebate] = useState<DebateMsg[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [doneReviewId, setDoneReviewId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [expandedReaction, setExpandedReaction] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchPastSims = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/simulations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { simulations: PastSim[] };
      setPastSims(data.simulations);
    } catch { /* silent */ }
  };

  // Fetch audience library + past simulations on mount
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoadingAudiences(false); return; }
      try {
        const [audRes, simRes] = await Promise.all([
          fetch(`${API_URL}/api/audience-library`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/reviews/${reviewId}/simulations`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (audRes.ok) {
          const data = await audRes.json() as { audiences: AudienceCard[] };
          setAudiences(data.audiences);
        }
        if (simRes.ok) {
          const data = await simRes.json() as { simulations: PastSim[] };
          setPastSims(data.simulations);
        }
      } catch {
        toast.error("Could not load audience library.");
      } finally {
        setLoadingAudiences(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runSimulation = async () => {
    if (!selectedId) return;
    const token = await getToken();
    if (!token) { toast.error("Not authenticated."); return; }

    // Build enriched context from research pack + expert analyses
    const contextParts: string[] = [];
    if (researchPack) {
      contextParts.push(`RESEARCH CONTEXT:\n${researchPack.slice(0, 4000)}`);
    }
    if (analyses && Object.keys(analyses).length > 0) {
      const expertLines = Object.entries(analyses)
        .map(([name, val]) => {
          const text = typeof val === "string" ? val : (val?.text ?? "");
          return `${name}:\n${text.slice(0, 600)}`;
        })
        .join("\n\n");
      contextParts.push(`EXPERT LENS ANALYSES:\n${expertLines}`);
    }
    const context = contextParts.length > 0 ? contextParts.join("\n\n") : undefined;

    setPhase("running");
    setReactions([]);
    setDebate([]);
    setVerdict(null);
    setDoneReviewId(null);
    setStatusMsg("Connecting to audience…");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_URL}/api/founder/simulate/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          idea: reviewIdea,
          title: reviewTitle,
          ...(selectedId.startsWith("prebuilt:")
            ? { persona_ids: [selectedId.replace("prebuilt:", "")] }
            : { audience_id: selectedId }),
          workflow_type: "simulation",
          depth: "quick",
          panel_size: 5,
          parent_review_id: reviewId,
          ...(context ? { context } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(raw); } catch { continue; }

          switch (evt.type) {
            case "panel_ready":
              setPanelMembers(evt.members as { name: string; role: string }[]);
              if (evt.review_id) setDoneReviewId(evt.review_id as string);
              setStatusMsg("Panel assembled — collecting reactions…");
              break;
            case "persona_start":
              setActivePersona(evt.name as string);
              setStatusMsg(`${evt.name} is reacting…`);
              break;
            case "reaction":
              setReactions((prev) => [
                ...prev,
                {
                  name: evt.name as string,
                  role: evt.role as string,
                  message: evt.message as string,
                  comprehension: evt.comprehension as number | undefined,
                  engagement: evt.engagement as number | undefined,
                  confusion: evt.confusion as string | undefined,
                  would_share: evt.would_share as boolean | undefined,
                },
              ]);
              setActivePersona(null);
              break;
            case "debate_start":
              setStatusMsg("Audience members are discussing…");
              break;
            case "debate_message":
              setDebate((prev) => [
                ...prev,
                {
                  from_name: evt.from_name as string,
                  to_names: (evt.to_names as string[]) ?? [],
                  message: evt.message as string,
                  role: evt.role as string,
                },
              ]);
              break;
            case "verdict_start":
              setStatusMsg("Generating verdict…");
              break;
            case "verdict":
              setVerdict({
                summary: evt.summary as string,
                overall_sentiment: evt.overall_sentiment as string | undefined,
                key_themes: evt.key_themes as string[] | undefined,
                recommendation: evt.recommendation as string | undefined,
              });
              break;
            case "done":
              setDoneReviewId(evt.review_id as string);
              setPhase("done");
              setStatusMsg("Simulation complete.");
              setActivePersona(null);
              fetchPastSims(); // refresh history
              break;
            case "error":
              toast.error((evt.message as string) || "Simulation failed.");
              setPhase("setup");
              break;
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Simulation stream failed.");
        setPhase("setup");
      }
    }
  };

  const runResume = async (simId: string) => {
    const token = await getToken();
    if (!token) { toast.error("Not authenticated."); return; }

    setPhase("running");
    setReactions([]);
    setDebate([]);
    setVerdict(null);
    setDoneReviewId(simId);
    setStatusMsg("Resuming simulation…");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_URL}/api/founder/simulate/resume/${simId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(raw); } catch { continue; }

          switch (evt.type) {
            case "panel_ready":
              setPanelMembers(evt.members as { name: string; role: string }[]);
              if (evt.review_id) setDoneReviewId(evt.review_id as string);
              setStatusMsg("Panel assembled — collecting reactions…");
              break;
            case "persona_start":
              setActivePersona(evt.name as string);
              setStatusMsg(`${evt.name} is reacting…`);
              break;
            case "reaction":
              setReactions((prev) => [
                ...prev,
                {
                  name: evt.name as string, role: evt.role as string,
                  message: evt.message as string, comprehension: evt.comprehension as number | undefined,
                  engagement: evt.engagement as number | undefined, confusion: evt.confusion as string | undefined,
                  would_share: evt.would_share as boolean | undefined,
                },
              ]);
              setActivePersona(null);
              break;
            case "debate_start":
              setStatusMsg("Audience members are discussing…");
              break;
            case "debate_message":
              setDebate((prev) => [
                ...prev,
                { from_name: evt.from_name as string, to_names: (evt.to_names as string[]) ?? [],
                  message: evt.message as string, role: evt.role as string },
              ]);
              break;
            case "verdict_start":
              setStatusMsg("Generating verdict…");
              break;
            case "verdict":
              setVerdict({
                summary: evt.summary as string, overall_sentiment: evt.overall_sentiment as string | undefined,
                key_themes: evt.key_themes as string[] | undefined, recommendation: evt.recommendation as string | undefined,
              });
              break;
            case "done":
              setDoneReviewId(evt.review_id as string);
              setPhase("done");
              setStatusMsg("Simulation complete.");
              setActivePersona(null);
              fetchPastSims();
              break;
            case "error":
              toast.error((evt.message as string) || "Resume failed.");
              setPhase("setup");
              break;
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Resume stream failed.");
        setPhase("setup");
      }
    }
  };

  const sentimentCfg = (s?: string) => {
    if (!s) return { color: "var(--text-3)", label: "—" };
    const lower = s.toLowerCase();
    if (lower.includes("positive") || lower.includes("enthusiastic")) return { color: "#38b27d", label: "Positive" };
    if (lower.includes("negative") || lower.includes("skeptic")) return { color: "#df6b57", label: "Negative" };
    return { color: "#f2a93b", label: "Mixed" };
  };

  const selectedAud = [...PREBUILT_AUDIENCES, ...audiences].find((a) => a.id === selectedId);
  const sc = sentimentCfg(verdict?.overall_sentiment);

  return (
    <div className="px-6 sm:px-10 py-8 w-full max-w-5xl mx-auto space-y-6">
      {/* ── Setup phase ── */}
      {phase === "setup" && (
        <>
          {loadingAudiences ? (
            <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-3)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading audiences…</span>
            </div>
          ) : (
            <>
              {/* ── Pre-built audiences ── */}
              <div>
                <p className="text-xs font-medium mb-3" style={{ color: "var(--text-3)" }}>
                  Pre-built audiences
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PREBUILT_AUDIENCES.map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => setSelectedId(aud.id === selectedId ? null : aud.id)}
                      className="rounded-xl p-4 text-left transition-all"
                      style={{
                        border: `1px solid ${aud.id === selectedId ? "var(--accent-amber)" : "var(--border-subtle)"}`,
                        backgroundColor: aud.id === selectedId ? "rgba(242,169,59,0.06)" : "var(--bg-1)",
                        outline: aud.id === selectedId ? "1px solid var(--accent-amber)" : "none",
                      }}
                    >
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>{aud.name}</p>
                      {aud.description && (
                        <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--text-3)" }}>
                          {aud.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {[aud.geography, aud.age_band, aud.role]
                          .filter(Boolean)
                          .map((t) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Custom audiences from library ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                    Your audiences
                  </p>
                  <Link
                    href="/audiences"
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    Manage in Library →
                  </Link>
                </div>
                {audiences.length === 0 ? (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ border: "1px dashed var(--border-default)", backgroundColor: "var(--bg-1)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      No custom audiences yet — build one in the{" "}
                      <Link href="/audiences" className="underline" style={{ color: "var(--accent-amber)" }}>
                        Audience Library
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {audiences.map((aud) => (
                      <button
                        key={aud.id}
                        onClick={() => setSelectedId(aud.id === selectedId ? null : aud.id)}
                        className="rounded-xl p-4 text-left transition-all"
                        style={{
                          border: `1px solid ${aud.id === selectedId ? "var(--accent-amber)" : "var(--border-subtle)"}`,
                          backgroundColor: aud.id === selectedId ? "rgba(242,169,59,0.06)" : "var(--bg-1)",
                          outline: aud.id === selectedId ? "1px solid var(--accent-amber)" : "none",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{aud.name}</p>
                          {(aud.generated_personas?.length ?? 0) > 0 && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                            >
                              {aud.generated_personas!.length} personas
                            </span>
                          )}
                        </div>
                        {aud.description && (
                          <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--text-3)" }}>
                            {aud.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {[aud.geography, aud.age_band, aud.role]
                            .filter(Boolean)
                            .map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={runSimulation}
                  disabled={!selectedId}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--accent-amber)",
                    color: "#000",
                  }}
                >
                  <Zap size={14} />
                  Run Simulation
                  {selectedAud && (
                    <span className="opacity-75">— {selectedAud.name}</span>
                  )}
                </button>
                {selectedId && (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Will simulate 5 personas reacting to your idea
                  </p>
                )}
              </div>

              {/* ── Past simulations ── */}
              {pastSims.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                    Previous Simulations
                  </p>
                  <div className="space-y-2">
                    {pastSims.map((sim) => {
                      const sc = sentimentCfg(sim.verdict?.overall_sentiment);
                      const isOpen = expandedPastSim === sim.id;
                      return (
                        <div
                          key={sim.id}
                          className="rounded-xl overflow-hidden"
                          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
                        >
                          <button
                            className="w-full flex items-center justify-between gap-3 p-4 text-left"
                            onClick={() => setExpandedPastSim(isOpen ? null : sim.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium" style={{ color: "var(--text-1)" }}>
                                  {sim.createdAt ? new Date(sim.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </span>
                                {sim.status && sim.status !== "ready" && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#f2a93b22", color: "#f2a93b" }}>
                                    Incomplete
                                  </span>
                                )}
                                {sim.verdict?.overall_sentiment && sim.status === "ready" && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: `${sc.color}22`, color: sc.color }}
                                  >
                                    {sim.verdict.overall_sentiment}
                                  </span>
                                )}
                                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                                  {sim.reactionCount} reactions
                                </span>
                              </div>
                              {!isOpen && sim.verdict?.summary && (
                                <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-3)" }}>
                                  {sim.verdict.summary}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {sim.status && sim.status !== "ready" ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); runResume(sim.id); }}
                                  className="text-xs px-2.5 py-1 rounded-md font-medium"
                                  style={{ backgroundColor: "var(--accent-amber)", color: "#000", border: "none" }}
                                >
                                  Resume
                                </button>
                              ) : (
                                <Link
                                  href={`/simulations/${sim.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs px-2.5 py-1 rounded-md"
                                  style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                                >
                                  Full report
                                </Link>
                              )}
                              {isOpen ? <ChevronUp size={13} style={{ color: "var(--text-3)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-3)" }} />}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                              {sim.verdict.summary && (
                                <p className="text-sm leading-relaxed pt-3" style={{ color: "var(--text-2)" }}>
                                  {sim.verdict.summary}
                                </p>
                              )}
                              {/* Scores */}
                              {(sim.verdict.avg_comprehension != null || sim.verdict.avg_engagement != null) && (
                                <div className="grid grid-cols-3 gap-3">
                                  {sim.verdict.avg_comprehension != null && (
                                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: "var(--bg-2)" }}>
                                      <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{sim.verdict.avg_comprehension.toFixed(1)}<span className="text-xs font-normal" style={{ color: "var(--text-3)" }}>/5</span></p>
                                      <p className="text-xs" style={{ color: "var(--text-3)" }}>Comprehension</p>
                                    </div>
                                  )}
                                  {sim.verdict.avg_engagement != null && (
                                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: "var(--bg-2)" }}>
                                      <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{sim.verdict.avg_engagement.toFixed(1)}<span className="text-xs font-normal" style={{ color: "var(--text-3)" }}>/5</span></p>
                                      <p className="text-xs" style={{ color: "var(--text-3)" }}>Engagement</p>
                                    </div>
                                  )}
                                  {sim.verdict.share_rate != null && (
                                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: "var(--bg-2)" }}>
                                      <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{sim.verdict.share_rate}<span className="text-xs font-normal" style={{ color: "var(--text-3)" }}>%</span></p>
                                      <p className="text-xs" style={{ color: "var(--text-3)" }}>Would share</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* What worked */}
                              {sim.verdict.what_worked && sim.verdict.what_worked.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1.5" style={{ color: "#38b27d" }}>What worked</p>
                                  <ul className="space-y-1">
                                    {sim.verdict.what_worked.map((t, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "#38b27d" }} />
                                        <span className="text-xs" style={{ color: "var(--text-2)" }}>{t}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {/* Risk flags */}
                              {sim.verdict.risk_flags && sim.verdict.risk_flags.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1.5" style={{ color: "#df6b57" }}>Risk flags</p>
                                  <ul className="space-y-1">
                                    {sim.verdict.risk_flags.map((t, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "#df6b57" }} />
                                        <span className="text-xs" style={{ color: "var(--text-2)" }}>{t}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {/* Recommendations */}
                              {sim.verdict.recommendations && sim.verdict.recommendations.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1.5" style={{ color: "var(--accent-amber)" }}>Recommendations</p>
                                  <ul className="space-y-1">
                                    {sim.verdict.recommendations.map((t, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                                        <span className="text-xs" style={{ color: "var(--text-2)" }}>{t}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Running phase ── */}
      {(phase === "running" || (phase === "done" && !verdict)) && (
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{statusMsg}</span>
          </div>
          {panelMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {panelMembers.map((m) => (
                <span
                  key={m.name}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    backgroundColor: activePersona === m.name ? "rgba(242,169,59,0.15)" : "var(--bg-2)",
                    border: `1px solid ${activePersona === m.name ? "var(--accent-amber)" : "var(--border-subtle)"}`,
                    color: activePersona === m.name ? "var(--accent-amber)" : "var(--text-3)",
                  }}
                >
                  {activePersona === m.name && <Loader2 size={10} className="animate-spin" />}
                  {m.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reactions ── */}
      {reactions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Reactions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reactions.map((r) => (
              <div
                key={r.name}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
              >
                <button
                  className="w-full flex items-start justify-between gap-3 p-4 text-left"
                  onClick={() => setExpandedReaction(expandedReaction === r.name ? null : r.name)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: "var(--bg-2)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }}
                      >
                        {r.name[0]}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{r.name}</p>
                      <p className="text-xs opacity-60 truncate" style={{ color: "var(--text-3)" }}>{r.role}</p>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${expandedReaction !== r.name ? "line-clamp-3" : ""}`}
                      style={{ color: "var(--text-2)" }}
                    >
                      {r.message}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    {r.would_share !== undefined && (
                      r.would_share
                        ? <ThumbsUp size={12} style={{ color: "#38b27d" }} />
                        : <ThumbsDown size={12} style={{ color: "#df6b57" }} />
                    )}
                    {expandedReaction === r.name ? <ChevronUp size={12} style={{ color: "var(--text-3)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-3)" }} />}
                  </div>
                </button>
                {expandedReaction === r.name && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="pt-3 space-y-2">
                      <ScoreBar label="Comprehension" value={r.comprehension} />
                      <ScoreBar label="Engagement" value={r.engagement} />
                    </div>
                    {r.confusion && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                        <strong style={{ color: "var(--text-2)" }}>Confusion:</strong> {r.confusion}
                      </p>
                    )}
                    {r.would_share !== undefined && (
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        Would share: <strong style={{ color: r.would_share ? "#38b27d" : "#df6b57" }}>{r.would_share ? "Yes" : "No"}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Debate ── */}
      {debate.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Discussion
          </p>
          <div
            className="rounded-xl divide-y"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)", "--tw-divide-color": "var(--border-subtle)" } as React.CSSProperties}
          >
            {debate.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--bg-2)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }}
                >
                  {d.from_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{d.from_name}</span>
                    {d.to_names.length > 0 && (
                      <>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>→</span>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{d.to_names.join(", ")}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{d.message}</p>
                </div>
              </div>
            ))}
            {phase === "running" && (
              <div className="flex items-center gap-2 p-3.5" style={{ color: "var(--text-3)" }}>
                <Loader2 size={12} className="animate-spin" />
                <span className="text-xs">Continuing discussion…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Verdict ── */}
      {verdict && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-1)",
          }}
        >
          <div className="flex items-center gap-2">
            {sc.label === "Positive" && <CheckCircle size={15} style={{ color: sc.color }} />}
            {sc.label === "Negative" && <XCircle size={15} style={{ color: sc.color }} />}
            {sc.label === "Mixed" && <AlertTriangle size={15} style={{ color: sc.color }} />}
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Audience Verdict
            </p>
            {verdict.overall_sentiment && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${sc.color}22`, color: sc.color }}
              >
                {verdict.overall_sentiment}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            {verdict.summary}
          </p>

          {verdict.key_themes && verdict.key_themes.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>Key themes</p>
              <div className="flex flex-wrap gap-1.5">
                {verdict.key_themes.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--bg-2)", color: "var(--text-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {verdict.recommendation && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              <strong style={{ color: "var(--text-2)" }}>Recommendation:</strong>{" "}
              {verdict.recommendation}
            </p>
          )}
        </div>
      )}

      {/* ── Done — link to full report ── */}
      {phase === "done" && doneReviewId && (
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/simulations/${doneReviewId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
          >
            <MessageSquare size={14} />
            View Full Simulation Report
          </Link>
          <button
            onClick={() => {
              setPhase("setup");
              setReactions([]);
              setDebate([]);
              setVerdict(null);
              setDoneReviewId(null);
              setPanelMembers([]);
            }}
            className="text-xs px-3 py-2 rounded-lg"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-3)", backgroundColor: "var(--bg-2)" }}
          >
            Run another simulation
          </button>
        </div>
      )}
    </div>
  );
}
