"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  Check,
  Loader2,
  ChevronRight,
  Users,
  Megaphone,
  MessageSquare,
  Rocket,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import { useSimulationPoller, type SimPollEvent } from "@/hooks/useSimulationPoller";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */
type SimUseCase = "test-ad" | "test-messaging" | "stress-test-launch";

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type: "textarea" | "text";
  required?: boolean;
  rows?: number;
}

interface SimUseCaseConfig {
  id: SimUseCase;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  tagline: string;
  bestFor: string;
  whatWeAnalyze: string;
  whatToProvide: string;
  outputs: string[];
  fields: FieldConfig[];
  exampleInput?: string;
  comingSoon?: boolean;
}

interface AudienceLibraryItem {
  id: string;
  name: string;
  description: string;
  geography: string;
  age_band: string;
  role: string;
  channels: string[];
  generated_personas_count?: number;
}

type SimulationEvent =
  | { type: "panel_ready"; members: { name: string; role: string }[] }
  | { type: "persona_start"; name: string; role: string }
  | { type: "reaction"; name: string; role: string; message: string; comprehension: number; engagement: number; confusion: string; would_share: boolean }
  | { type: "debate_start" }
  | { type: "debate_message"; from_name: string; to_names: string[]; message: string; role: string }
  | { type: "verdict_start" }
  | { type: "verdict"; verdict: string; avg_comprehension: number; avg_engagement: number; share_rate: number; risk_flags: string[]; recommendations: string[] }
  | { type: "done"; review_id: string }
  | { type: "error"; message: string };

type SimDisplayEvent = Extract<SimulationEvent, { type: "panel_ready" | "persona_start" | "reaction" | "debate_start" | "debate_message" | "verdict_start" | "verdict" }>;

const SIM_USE_CASES: SimUseCaseConfig[] = [
  {
    id: "test-ad",
    label: "Test an Ad",
    icon: Megaphone,
    tagline: "Simulate how a target audience may interpret, discuss, and react to an ad before launch.",
    bestFor: "Campaign concepts, ad scripts, social creatives with copy",
    whatWeAnalyze: "Audience interpretation, emotional reaction, confusion risks, misread potential, and likely discussion patterns.",
    whatToProvide: "The ad copy, script, or transcript. Include the channel and intended audience for accurate simulation.",
    outputs: ["Reaction analysis by audience segment", "Confusion and misread risks", "Emotional response patterns", "Risk flags", "Recommendation"],
    fields: [
      { key: "main", label: "Ad copy, script, or transcript", type: "textarea", rows: 8, required: true, placeholder: "Paste the ad copy, video script, or creative concept you want tested." },
      { key: "channel", label: "Channel and format", type: "text", placeholder: "e.g. Instagram feed video, LinkedIn sponsored post, YouTube pre-roll, podcast ad" },
      { key: "audience", label: "Intended audience", type: "text", placeholder: "e.g. US millennial professionals, small business owners, parents with kids under 10" },
      { key: "takeaway", label: "Intended takeaway", type: "text", placeholder: "What should the audience think, feel, or do after seeing this ad?" },
      { key: "misreadRisks", label: "Potential misread risks", type: "text", placeholder: "e.g. Could come across as too aggressive, tone might not land with older audience" },
    ],
    exampleInput: "Tired of writing your own weekly status updates?\n\nAutoStandup reads your GitHub commits and Jira tickets — and writes your engineering update for you. In your voice. In 30 seconds.\n\nTry it free → autostandup.io\n\n[Visual: split screen — left shows a stressed dev staring at a blank doc, right shows the bot auto-generating a clean status update while the dev sips coffee]",
  },
  {
    id: "test-messaging",
    label: "Test Messaging",
    comingSoon: true,
    icon: MessageSquare,
    tagline: "Review copy, headlines, and positioning from audience and expert perspectives before you publish.",
    bestFor: "Landing page copy, launch copy, ad copy, brand messaging, social posts",
    whatWeAnalyze: "Message clarity, audience resonance, trust signals, differentiation, and conversion risk.",
    whatToProvide: "The copy or messaging you want reviewed. Include the type of content and intended audience.",
    outputs: ["Clarity and confusion analysis", "Trust and credibility gaps", "Audience reaction patterns", "Differentiation assessment", "Rewrite direction"],
    fields: [
      { key: "main", label: "Paste copy or messaging", type: "textarea", rows: 8, required: true, placeholder: "Paste the copy, headline, or messaging you want reviewed." },
      { key: "messageType", label: "Message type", type: "text", placeholder: "e.g. Landing page headline, launch email, ad copy, social post, product description" },
      { key: "audience", label: "Intended audience", type: "text", placeholder: "e.g. Technical buyers at mid-market companies, first-time SaaS buyers" },
      { key: "takeaway", label: "Intended takeaway", type: "text", placeholder: "What should the reader think, feel, or do after reading this?" },
      { key: "claims", label: "Key brand or product claims", type: "text", placeholder: "e.g. Fastest setup, no code required, enterprise-grade security" },
    ],
    exampleInput: "Headline: Your engineering team ships. Your status updates write themselves.\n\nSubheadline: AutoStandup connects to GitHub and Jira, then generates weekly progress reports in your team's voice — automatically.\n\nHero CTA: Start free — no credit card\n\nBelow fold: \"Works with the tools you already use\" → GitHub, Jira, Linear, Slack logos\n\nSocial proof: \"We cut 2 hours of status-writing per sprint.\" — Alex T., Eng Manager at Lattice",
  },
  {
    id: "stress-test-launch",
    label: "Stress-Test a Launch",
    comingSoon: true,
    icon: Rocket,
    tagline: "Pressure-test a launch narrative and go-to-market story against audience and expert reactions.",
    bestFor: "Launch messaging, announcement strategy, campaign framing",
    whatWeAnalyze: "Narrative coherence, audience fit, competitive positioning, likely failure modes, and launch sequencing risks.",
    whatToProvide: "The launch narrative or go-to-market story. Include the product, audience, channels, and what you are trying to achieve.",
    outputs: ["Likely failure points", "Narrative alignment risks", "Audience reaction simulation", "Competitive positioning gaps", "Stronger launch direction"],
    fields: [
      { key: "main", label: "Launch narrative", type: "textarea", rows: 8, required: true, placeholder: "Describe your launch plan: the product or feature being launched, the story you are telling, and how you plan to go to market." },
      { key: "product", label: "Product or feature being launched", type: "text", placeholder: "e.g. New pricing model, mobile app v2, enterprise tier, AI feature" },
      { key: "audience", label: "Target audience", type: "text", placeholder: "e.g. Existing customers, SMB market, developer community" },
      { key: "channels", label: "Launch channels", type: "text", placeholder: "e.g. Product Hunt, email list, paid social, press, partner announcements" },
      { key: "mainRisk", label: "Main launch risk", type: "text", placeholder: "e.g. Existing customers may react negatively to pricing change, announcement may feel rushed" },
    ],
    exampleInput: "We're launching AutoStandup publicly on Product Hunt next Tuesday. We have 47 people on our waitlist and 3 paying design partners.\n\nOur launch story: 'Engineering managers spend 2+ hours per sprint writing status updates. AutoStandup does it in 30 seconds.'\n\nWe'll launch on Product Hunt, send our waitlist email, post on r/ExperiencedDevs and r/startups, and have our design partners comment. We have no press lined up.\n\nMain concern: We don't know if our landing page converts outside our warm network. We also haven't tested whether the 'saves 2 hours' claim resonates or feels exaggerated.",
  },
];

const SIMULATION_AUDIENCE = [
  { id: "genz", name: "Gen Z", description: "Ages 18–27. Digital-native, brand-skeptical, value-driven." },
  { id: "millennial", name: "Millennials", description: "Ages 28–43. Research-oriented, ROI-focused, experience-driven." },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// All possible panel sizes in ascending order
const ALL_PANEL_OPTIONS: { n: number; label: string; desc: string }[] = [
  { n: 5,   label: "5 respondents",   desc: "Small directional panel" },
  { n: 10,  label: "10 respondents",  desc: "Standard panel" },
  { n: 20,  label: "20 respondents",  desc: "Broad panel" },
  { n: 50,  label: "50 respondents",  desc: "Large sample" },
  { n: 100, label: "100 respondents", desc: "Full research panel" },
];

/* ------------------------------------------------------------------ */
/*  ScoreBar                                                           */
/* ------------------------------------------------------------------ */
function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--text-3)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 60 ? "var(--accent-emerald)" : pct >= 40 ? "var(--accent-amber)" : "var(--accent-coral)",
          }}
        />
      </div>
      <span className="text-xs tabular-nums w-8 text-right" style={{ color: "var(--text-3)" }}>{value}/{max}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  eventDelay — how long to wait before revealing each event type    */
/* ------------------------------------------------------------------ */
function eventDelay(e: SimDisplayEvent): number {
  switch (e.type) {
    case "panel_ready":    return 0;
    case "persona_start":  return 300;
    case "debate_start":   return 600;
    case "verdict_start":  return 400;
    case "reaction":       return Math.min(900 + e.message.length * 20, 3200);
    case "debate_message": return Math.min(700 + e.message.length * 16, 2600);
    case "verdict":        return 900;
    default:               return 300;
  }
}

/* ------------------------------------------------------------------ */
/*  SimulationProgressState — live node graph + chat feed             */
/* ------------------------------------------------------------------ */
function SimulationProgressState({
  label,
  events,
  pendingRedirectId,
}: {
  label: string;
  events: SimDisplayEvent[];
  pendingRedirectId: string | null;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Drip queue: reveal one event at a time with natural delays ────────────
  const [visibleCount, setVisibleCount] = useState(0);
  const scheduledUpToRef = useRef(0);
  const nextRevealAtRef = useRef<number>(Date.now());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const redirectScheduledRef = useRef(false);

  // Schedule reveal timers whenever new events arrive from the backend
  useEffect(() => {
    if (events.length <= scheduledUpToRef.current) return;
    const now = Date.now();
    if (nextRevealAtRef.current < now) nextRevealAtRef.current = now;
    for (let i = scheduledUpToRef.current; i < events.length; i++) {
      const d = eventDelay(events[i]);
      nextRevealAtRef.current += d;
      const count = i + 1;
      const delay = Math.max(0, nextRevealAtRef.current - Date.now());
      const tid = setTimeout(() => setVisibleCount((c) => Math.max(c, count)), delay);
      timersRef.current.push(tid);
    }
    scheduledUpToRef.current = events.length;
  }, [events.length]);

  // Redirect 2 s after the verdict card becomes visible
  useEffect(() => {
    if (!pendingRedirectId) return;
    if (!events.slice(0, visibleCount).some((e) => e.type === "verdict")) return;
    if (redirectScheduledRef.current) return;
    redirectScheduledRef.current = true;
    const tid = setTimeout(() => router.push(`/simulations/${pendingRedirectId}`), 2000);
    timersRef.current.push(tid);
  }, [pendingRedirectId, visibleCount, events, router]);

  // Clean up all pending timers on unmount
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  // The slice of events the user can currently see
  const visibleEvents = events.slice(0, visibleCount);
  // ─────────────────────────────────────────────────────────────────────────

  const panelEvent = visibleEvents.find(
    (e): e is Extract<SimDisplayEvent, { type: "panel_ready" }> => e.type === "panel_ready"
  );
  const reactions = visibleEvents.filter(
    (e): e is Extract<SimDisplayEvent, { type: "reaction" }> => e.type === "reaction"
  );
  const debateStartIdx = visibleEvents.findIndex((e) => e.type === "debate_start");
  const debateStarted = debateStartIdx >= 0;
  const preDebateEvents = debateStarted ? visibleEvents.slice(0, debateStartIdx) : visibleEvents;
  const postDebateEvents = debateStarted ? visibleEvents.slice(debateStartIdx + 1) : [];

  const debateMessages = visibleEvents.filter(
    (e): e is Extract<SimDisplayEvent, { type: "debate_message" }> => e.type === "debate_message"
  );
  const verdictEvent = visibleEvents.find(
    (e): e is Extract<SimDisplayEvent, { type: "verdict" }> => e.type === "verdict"
  );
  const verdictLoading = visibleEvents.some((e) => e.type === "verdict_start") && !verdictEvent;

  const r1PersonaStarts = preDebateEvents.filter(
    (e): e is Extract<SimDisplayEvent, { type: "persona_start" }> => e.type === "persona_start"
  );
  const r2PersonaStarts = postDebateEvents.filter(
    (e): e is Extract<SimDisplayEvent, { type: "persona_start" }> => e.type === "persona_start"
  );
  const activePersona = !debateStarted
    ? r1PersonaStarts.find((ps) => !reactions.some((r) => r.name === ps.name))
    : r2PersonaStarts.find((ps) => !debateMessages.some((dm) => dm.from_name === ps.name));

  const members = panelEvent?.members ?? [];
  const N = members.length;

  const totalSteps = N * 2 + 1;
  const completedSteps = reactions.length + debateMessages.length + (verdictEvent ? 1 : 0);
  const progressPct = totalSteps > 1 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const phase = !debateStarted ? "reactions" : verdictEvent ? "verdict" : "debate";

  // Graph layout
  const CX = 180, CY = 175, ARRANGE_R = 115, NODE_R = 22;
  const nodePositions = members.map((_, i) => {
    const angle = (2 * Math.PI / Math.max(N, 1)) * i - Math.PI / 2;
    return { x: CX + ARRANGE_R * Math.cos(angle), y: CY + ARRANGE_R * Math.sin(angle) };
  });

  const debateEdges = debateMessages.flatMap((dm) => {
    const fromIdx = members.findIndex((m) => m.name === dm.from_name);
    return dm.to_names.map((toName, ti) => {
      const toIdx = members.findIndex((m) => m.name === toName);
      return { fromIdx, toIdx, key: `${dm.from_name}-${toName}-${ti}` };
    });
  });

  const nodeInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const nodeColor = (name: string) => {
    const colors = ["#4a7a5e", "#4a6b9e", "#9e7a4a", "#7a4a9e", "#9e4a5e", "#4a8a7a"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Build ordered chat feed
  const chatFeed: Array<{
    key: string;
    name: string;
    role: string;
    msgType: "reaction" | "debate";
    message: string;
    comprehension?: number;
    engagement?: number;
    confusion?: string;
    would_share?: boolean;
    to_names?: string[];
  }> = [];
  let rIdx = 0, dIdx = 0;
  for (const e of visibleEvents) {
    if (e.type === "reaction") {
      chatFeed.push({ key: `r-${rIdx++}`, name: e.name, role: e.role, msgType: "reaction", message: e.message, comprehension: e.comprehension, engagement: e.engagement, confusion: e.confusion, would_share: e.would_share });
    } else if (e.type === "debate_message") {
      chatFeed.push({ key: `d-${dIdx++}`, name: e.from_name, role: e.role, msgType: "debate", message: e.message, to_names: e.to_names });
    }
  }

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatFeed.length]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center px-6 gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span className="text-sm font-semibold">SocietyOS</span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}
        >
          {label}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs hidden sm:inline" style={{ color: "var(--text-3)" }}>
            {phase === "reactions"
              ? "Round 1 — Initial reactions"
              : phase === "debate"
              ? "Round 2 — Group debate"
              : "Final verdict"}
          </span>
          <div
            className="h-1 w-28 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: "var(--accent-amber)" }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>

        {/* Left: Network graph */}
        <div
          className="h-[340px] lg:h-auto lg:w-[400px] flex-shrink-0 flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="section-label mb-5">Agent Network</p>

          {!panelEvent ? (
            <div className="flex items-center gap-2" style={{ color: "var(--text-3)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Assembling panel...</span>
            </div>
          ) : (
            <>
              <svg
                width="360"
                height="360"
                viewBox="0 0 360 360"
                style={{ overflow: "visible" }}
              >
                {/* Dashed arrangement ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={ARRANGE_R}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Debate edges */}
                {debateEdges.map((edge) => {
                  if (edge.fromIdx < 0 || edge.toIdx < 0) return null;
                  const from = nodePositions[edge.fromIdx];
                  const to = nodePositions[edge.toIdx];
                  return (
                    <line
                      key={edge.key}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="rgba(242, 169, 59, 0.30)"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />
                  );
                })}

                {/* Center phase label */}
                <text x={CX} y={CY - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7a8d">
                  {phase === "reactions" ? "Reacting" : phase === "debate" ? "Debating" : "Verdict"}
                </text>
                <text x={CX} y={CY + 9} textAnchor="middle" fontSize="9" fill="#4a5568">
                  {phase === "reactions"
                    ? `${reactions.length} / ${N}`
                    : phase === "debate"
                    ? `${debateMessages.length} / ${N}`
                    : "✓"}
                </text>

                {/* Nodes */}
                {members.map((m, i) => {
                  const pos = nodePositions[i];
                  const reacted = reactions.some((r) => r.name === m.name);
                  const debated = debateMessages.some((dm) => dm.from_name === m.name);
                  const isActive = activePersona?.name === m.name;
                  const isDone = debateStarted ? debated : reacted;
                  const nc = nodeColor(m.name);

                  return (
                    <g key={m.name} transform={`translate(${pos.x},${pos.y})`}>
                      {isActive && (
                        <circle r={NODE_R + 9} fill="none" stroke="rgba(242, 169, 59, 0.20)" strokeWidth="2" />
                      )}
                      <circle
                        r={NODE_R}
                        fill={isDone ? `${nc}2a` : isActive ? "rgba(242, 169, 59, 0.10)" : "#121922"}
                        stroke={isActive ? "#f2a93b" : isDone ? `${nc}88` : "rgba(255, 255, 255, 0.11)"}
                        strokeWidth={isActive ? "1.5" : "1"}
                      />
                      <text textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill={isDone ? nc : isActive ? "#f2a93b" : "#6b7a8d"}>
                        {nodeInitials(m.name)}
                      </text>
                      {isDone && (
                        <circle r={7} cx={NODE_R - 4} cy={-NODE_R + 4} fill="#38b27d" stroke="#0b0f14" strokeWidth="1.5" />
                      )}
                      <text y={NODE_R + 14} textAnchor="middle" fontSize="9" fontWeight={isActive ? "600" : "400"} fill={isActive ? "#edf2f7" : "#6b7a8d"}>
                        {m.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex items-center gap-2">
                {phase !== "verdict" && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                )}
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {phase === "reactions"
                    ? `Round 1 — ${reactions.length} of ${N} reactions`
                    : phase === "debate"
                    ? `Round 2 — ${debateMessages.length} of ${N} responses`
                    : "Simulation complete"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Chat feed */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          <div
            className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", backgroundColor: "var(--bg-0)" }}
          >
            <span className="section-label">Discussion</span>
            {activePersona && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {activePersona.name} is typing...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {!panelEvent && (
              <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-3)" }}>
                <Loader2 size={13} className="animate-spin" />
                <span className="text-sm">Assembling audience panel...</span>
              </div>
            )}

            {chatFeed.map((msg, idx) => {
              const nc = nodeColor(msg.name);
              const showDebateDivider = msg.msgType === "debate" && (idx === 0 || chatFeed[idx - 1].msgType === "reaction");
              return (
                <React.Fragment key={msg.key}>
                  {showDebateDivider && (
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}>
                        Round 2 — Debate
                      </span>
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ backgroundColor: nc, color: "rgba(0,0,0,0.85)" }}
                    >
                      {nodeInitials(msg.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{msg.name}</span>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{msg.role}</span>
                        {msg.msgType === "reaction" && msg.would_share && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}>
                            Would share
                          </span>
                        )}
                        {msg.msgType === "debate" && msg.to_names && (
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>
                            ↩ {msg.to_names.join(", ")}
                          </span>
                        )}
                      </div>
                      <div
                        className="rounded-lg p-3 mb-2"
                        style={{
                          backgroundColor: msg.msgType === "debate" ? "var(--panel)" : "var(--bg-1)",
                          border: msg.msgType === "debate" ? "1px solid rgba(242, 169, 59, 0.10)" : "1px solid var(--border-subtle)",
                        }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{msg.message}</p>
                        {msg.msgType === "reaction" && msg.confusion && (
                          <p className="text-xs mt-2 pt-2" style={{ color: "var(--text-3)", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                            Unclear: {msg.confusion}
                          </p>
                        )}
                      </div>
                      {msg.msgType === "reaction" && (
                        <div className="space-y-1">
                          <ScoreBar label="Comprehension" value={msg.comprehension ?? 0} />
                          <ScoreBar label="Engagement" value={msg.engagement ?? 0} />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Typing indicator */}
            {activePersona && !verdictLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: nodeColor(activePersona.name), color: "rgba(0,0,0,0.85)" }}>
                  {nodeInitials(activePersona.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{activePersona.name}</span>
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>{activePersona.role}</span>
                  </div>
                  <div className="rounded-lg px-4 py-3 inline-flex items-center gap-1.5" style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-3)", animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-3)", animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-3)", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Verdict loading */}
            {verdictLoading && (
              <div className="rounded-lg p-4 flex items-center gap-3" style={{ border: "1px solid rgba(242, 169, 59, 0.18)", backgroundColor: "rgba(242, 169, 59, 0.03)" }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                <span className="text-sm" style={{ color: "var(--accent-amber)" }}>Synthesizing final verdict...</span>
              </div>
            )}

            {/* Verdict card */}
            {verdictEvent && (
              <div className="rounded-lg p-5" style={{ border: "1px solid rgba(242, 169, 59, 0.25)", backgroundColor: "rgba(242, 169, 59, 0.05)" }}>
                <p className="section-label mb-3" style={{ color: "var(--accent-amber)" }}>Panel Verdict</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-1)" }}>{verdictEvent.verdict}</p>
                <div className="space-y-2 mb-4">
                  <ScoreBar label="Comprehension" value={verdictEvent.avg_comprehension} />
                  <ScoreBar label="Engagement" value={verdictEvent.avg_engagement} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--text-3)" }}>Would share</span>
                    <span className="text-sm font-semibold" style={{ color: verdictEvent.share_rate >= 50 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>
                      {verdictEvent.share_rate}%
                    </span>
                  </div>
                </div>
                {verdictEvent.risk_flags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-3)" }}>Risk flags</p>
                    <ul className="space-y-1">
                      {verdictEvent.risk_flags.map((f, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-2)" }}>
                          <span style={{ color: "var(--accent-coral)" }}>↑</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {verdictEvent.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-3)" }}>Recommendations</p>
                    <ul className="space-y-1">
                      {verdictEvent.recommendations.map((r, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-2)" }}>
                          <span style={{ color: "var(--accent-emerald)" }}>→</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StepperHeader                                                      */
/* ------------------------------------------------------------------ */
function StepperHeader({
  step,
  canAdvance,
  onBack,
  onNext,
  onSubmit,
  submitting,
}: {
  step: 1 | 2 | 3;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const steps = ["Choose", "Content", "Configure"];
  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-2">
        {steps.map((label, idx) => {
          const num = idx + 1;
          const active = num === step;
          const done = num < step;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: done ? "var(--accent-emerald)" : active ? "var(--accent-amber)" : "var(--panel-elevated)",
                    color: done || active ? "var(--bg-0)" : "var(--text-3)",
                  }}
                >
                  {done ? <Check size={10} /> : num}
                </div>
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{ color: active ? "var(--text-1)" : "var(--text-3)" }}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight size={12} style={{ color: "var(--text-3)" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {step > 1 && (
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all"
            style={{
              backgroundColor: canAdvance ? "var(--accent-amber)" : "var(--panel-elevated)",
              color: canAdvance ? "var(--bg-0)" : "var(--text-3)",
              cursor: canAdvance ? "pointer" : "not-allowed",
            }}
          >
            Continue
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!canAdvance || submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-semibold transition-all"
            style={{
              backgroundColor: canAdvance && !submitting ? "var(--accent-amber)" : "var(--panel-elevated)",
              color: canAdvance && !submitting ? "var(--bg-0)" : "var(--text-3)",
              cursor: canAdvance && !submitting ? "pointer" : "not-allowed",
            }}
          >
            Run Simulation
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Choose simulation type                                     */
/* ------------------------------------------------------------------ */
function StepChoose({
  selected,
  onSelect,
}: {
  selected: SimUseCase | null;
  onSelect: (id: SimUseCase) => void;
}) {
  const selectedConfig = selected ? SIM_USE_CASES.find((u) => u.id === selected) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
      <div>
        <div className="mb-8">
          <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Choose a simulation type
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Select the type of audience simulation you want to run.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SIM_USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const isSelected = selected === uc.id;
            const disabled = !!uc.comingSoon;
            return (
              <button
                key={uc.id}
                onClick={() => !disabled && onSelect(uc.id)}
                disabled={disabled}
                className="text-left p-5 rounded-lg transition-all duration-150"
                style={{
                  border: isSelected ? "1px solid rgba(242, 169, 59, 0.40)" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "rgba(242, 169, 59, 0.05)" : "var(--bg-1)",
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon
                    size={18}
                    style={{ color: isSelected ? "var(--accent-amber)" : "var(--text-3)", flexShrink: 0, marginTop: "2px" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm" style={{ color: isSelected ? "var(--text-1)" : "var(--text-2)" }}>
                        {uc.label}
                      </p>
                      {disabled && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}>
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                      {uc.tagline}
                    </p>
                  </div>
                  {!disabled && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{
                        backgroundColor: isSelected ? "var(--accent-amber)" : "transparent",
                        border: isSelected ? "none" : "1px solid var(--border-strong)",
                      }}
                    >
                      {isSelected && <Check size={9} style={{ color: "var(--bg-0)" }} />}
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Best for: {uc.bestFor}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: How this works */}
      <div className="lg:sticky lg:top-24">
        {selectedConfig ? (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="section-label mb-1">How this works</p>
              <p className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{selectedConfig.label}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>What we analyze</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{selectedConfig.whatWeAnalyze}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>What to provide</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{selectedConfig.whatToProvide}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>Outputs</p>
                <div className="space-y-1.5">
                  {selectedConfig.outputs.map((o) => (
                    <div key={o} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}
                >
                  Audience Simulation
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg p-5" style={{ border: "1px solid rgba(255, 255, 255, 0.06)", backgroundColor: "var(--panel)" }}>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Select a simulation type to see how it works and what you will receive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Content — simple direct form, no AI question flow         */
/* ------------------------------------------------------------------ */
function StepContent({
  config,
  fieldValues,
  setFieldValue,
}: {
  config: SimUseCaseConfig;
  fieldValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
}) {
  const [showExample, setShowExample] = useState(false);
  const mainValue = fieldValues["main"] ?? "";
  const maxChars = 5000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 items-start">
      <div className="space-y-6">
        <div>
          <div className="accent-chip mb-4">{config.label}</div>
          <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Add your content
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{config.tagline}</p>
        </div>

        {/* Main textarea */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="section-label">{config.fields[0].label}</label>
            <span className="text-xs tabular-nums" style={{ color: mainValue.length > maxChars * 0.9 ? "var(--accent-coral)" : "var(--text-3)" }}>
              {mainValue.length} / {maxChars}
            </span>
          </div>
          <textarea
            value={mainValue}
            onChange={(e) => setFieldValue("main", e.target.value)}
            rows={config.fields[0].rows ?? 8}
            maxLength={maxChars}
            placeholder={config.fields[0].placeholder}
            className="w-full rounded-lg px-4 py-3 text-sm leading-relaxed resize-none transition-colors"
            style={{
              backgroundColor: "var(--bg-1)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-1)",
              outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(242, 169, 59, 0.40)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
          />
        </div>

        {/* Supporting fields */}
        {config.fields.slice(1).map((field) => (
          <div key={field.key}>
            <label className="section-label mb-2 block">{field.label}</label>
            <input
              type="text"
              value={fieldValues[field.key] ?? ""}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg px-4 py-3 text-sm transition-colors"
              style={{
                backgroundColor: "var(--bg-1)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-1)",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(242, 169, 59, 0.40)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
            />
          </div>
        ))}

        {/* Load example */}
        {config.exampleInput && (
          <div>
            <button
              onClick={() => {
                if (showExample) {
                  setShowExample(false);
                } else {
                  setShowExample(true);
                  setFieldValue("main", config.exampleInput ?? "");
                }
              }}
              className="text-xs transition-colors"
              style={{ color: "var(--accent-amber)" }}
            >
              {showExample ? "Clear example" : "Load example →"}
            </button>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:sticky lg:top-24 space-y-4">
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="section-label">What we analyze</p>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{config.whatWeAnalyze}</p>
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>Outputs</p>
              <div className="space-y-1.5">
                {config.outputs.map((o) => (
                  <div key={o} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                    <span className="text-xs" style={{ color: "var(--text-2)" }}>{o}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Configure audience & panel                                 */
/* ------------------------------------------------------------------ */
function StepConfigureAudience({
  config,
  selectedAudience,
  setSelectedAudience,
  panelSize,
  audienceLibrary,
  savedAudienceId,
  setSavedAudienceId,
}: {
  config: SimUseCaseConfig;
  selectedAudience: string;
  setSelectedAudience: (id: string) => void;
  panelSize: number;
  audienceLibrary: AudienceLibraryItem[];
  savedAudienceId: string | null;
  setSavedAudienceId: (id: string | null) => void;
}) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
      <div className="space-y-8">
        <div>
          <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Configure your simulation
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Set up the audience panel for your simulation.
          </p>
        </div>

        {/* Audience Panel */}
        <section>
          <label className="section-label mb-1 block">Audience Panel</label>
          <div className="space-y-2">
            {SIMULATION_AUDIENCE.map((aud) => {
              const active = selectedAudience === aud.id;
              return (
                <button
                  key={aud.id}
                  onClick={() => { setSelectedAudience(aud.id); setSavedAudienceId(null); }}
                  className="w-full text-left p-4 rounded-lg transition-all duration-150"
                  style={{
                    border: active ? "1px solid rgba(242, 169, 59, 0.35)" : "1px solid var(--border-subtle)",
                    backgroundColor: active ? "rgba(242, 169, 59, 0.06)" : "var(--bg-1)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-0.5" style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}>
                        {aud.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>{aud.description}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{
                        backgroundColor: active ? "var(--accent-amber)" : "var(--panel-elevated)",
                        border: active ? "none" : "1px solid var(--border-default)",
                      }}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-0)" }} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Saved audience library */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="section-label">Your Audiences</label>
            <a href="/audiences" className="text-xs" style={{ color: "var(--accent-amber)" }}>
              Manage library →
            </a>
          </div>
          {audienceLibrary.length === 0 ? (
            <p className="text-xs py-3" style={{ color: "var(--text-3)" }}>
              No custom audiences yet.{" "}
              <a href="/audiences" className="underline" style={{ color: "var(--accent-amber)" }}>Build one in the Audience Library.</a>
            </p>
          ) : (
            <div className="space-y-2">
              {audienceLibrary.map((aud) => (
                <button
                  key={aud.id}
                  onClick={() => { setSavedAudienceId(aud.id === savedAudienceId ? null : aud.id); if (aud.id !== savedAudienceId) setSelectedAudience(""); }}
                  className="w-full text-left p-3.5 rounded-lg transition-all flex items-center gap-3"
                  style={{
                    border: savedAudienceId === aud.id ? "1px solid rgba(242, 169, 59, 0.35)" : "1px solid var(--border-subtle)",
                    backgroundColor: savedAudienceId === aud.id ? "rgba(242, 169, 59, 0.06)" : "var(--bg-1)",
                  }}
                >
                  <Users size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: savedAudienceId === aud.id ? "var(--text-1)" : "var(--text-2)" }}>
                      {aud.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                      {[aud.geography, aud.age_band, aud.role].filter(Boolean).join(" · ") || aud.description || "Custom audience"}
                    </p>
                  </div>
                  {savedAudienceId === aud.id && <Check size={13} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right: Run summary */}
      <div className="lg:sticky lg:top-24">
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="section-label">Run summary</p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Type</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{config.label}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Mode</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Audience Simulation</p>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>Audience</p>
              <div className="flex flex-wrap gap-1.5">
                {savedAudienceId ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}>
                    {audienceLibrary.find((a) => a.id === savedAudienceId)?.name ?? "Custom"}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}>
                    {SIMULATION_AUDIENCE.find((a) => a.id === selectedAudience)?.name ?? selectedAudience}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main intake component                                              */
/* ------------------------------------------------------------------ */
function SimulationIntakeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, getIdToken } = useAuth();

  const initialUseCase = (searchParams.get("use_case") as SimUseCase | null) ?? null;
  const jumpToStep = searchParams.get("step") === "3" ? 3 : initialUseCase ? 2 : 1;

  // Read pre-filled content from sessionStorage (set by "Run with Different Audience")
  const rerunData = (() => {
    try {
      const raw = sessionStorage.getItem("sim_rerun");
      if (!raw) return null;
      sessionStorage.removeItem("sim_rerun");
      return JSON.parse(raw) as { idea: string; useCase: string };
    } catch { return null; }
  })();

  const [step, setStep] = useState<1 | 2 | 3>(jumpToStep as 1 | 2 | 3);
  const [useCase, setUseCase] = useState<SimUseCase | null>(initialUseCase);
  const [fieldValues, setFieldValuesState] = useState<Record<string, string>>(
    rerunData ? { main: rerunData.idea } : {}
  );
  const [selectedAudience, setSelectedAudience] = useState<string>("genz");
  const [panelSize, setPanelSize] = useState<number>(5);
  const [savedAudienceId, setSavedAudienceId] = useState<string | null>(null);
  const [audienceLibrary, setAudienceLibrary] = useState<AudienceLibraryItem[]>([]);
  const [personaCounts, setPersonaCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [simEvents, setSimEvents] = useState<SimDisplayEvent[]>([]);
  const [pendingRedirectId, setPendingRedirectId] = useState<string | null>(null);
  const [simReviewId, setSimReviewId] = useState<string | null>(null);
  const [pollerEnabled, setPollerEnabled] = useState(false);

  // Reshape polled events (wrapped in data field) into flat SimDisplayEvent union
  const handlePolledEvents = useCallback((events: SimPollEvent[]) => {
    const SIM_TYPES = new Set(["panel_ready", "persona_start", "reaction", "debate_start", "debate_message", "verdict_start", "verdict"]);
    const mapped: SimDisplayEvent[] = [];
    for (const e of events) {
      if (e.type === "done") {
        const doneParsed = e.data as { review_id?: string };
        if (doneParsed.review_id) setPendingRedirectId(doneParsed.review_id);
        setPollerEnabled(false);
        continue;
      }
      if (e.type === "error") {
        const errParsed = e.data as { message?: string };
        toast.error(errParsed.message || "Simulation failed.");
        setSubmitting(false);
        setPollerEnabled(false);
        setSimEvents([]);
        continue;
      }
      if (SIM_TYPES.has(e.type)) {
        mapped.push({ type: e.type, ...e.data } as unknown as SimDisplayEvent);
      }
    }
    if (mapped.length > 0) {
      setSimEvents((prev) => [...prev, ...mapped]);
    }
  }, []);

  useSimulationPoller({
    reviewId: simReviewId,
    enabled: pollerEnabled,
    onEvents: handlePolledEvents,
    getToken: getIdToken,
  });

  const config = useCase ? SIM_USE_CASES.find((u) => u.id === useCase) ?? null : null;

  const setFieldValue = (key: string, value: string) => {
    setFieldValuesState((prev) => ({ ...prev, [key]: value }));
  };


  // Load audience library and persona counts
  useEffect(() => {
    // Persona counts don't require auth
    fetch(`${API_URL}/api/founder/personas/counts`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setPersonaCounts(data);
      })
      .catch(() => {});

    getIdToken().then((token) => {
      if (!token) return;
      fetch(`${API_URL}/api/audience-library`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.audiences;
          if (Array.isArray(list)) setAudienceLibrary(list);
        })
        .catch(() => {});
    });
  }, [getIdToken]);

  // Derive max available personas for the selected segments
  const maxAvailable = savedAudienceId
    ? (audienceLibrary.find((a) => a.id === savedAudienceId)?.generated_personas_count ?? 5)
    : Math.max(personaCounts[selectedAudience] ?? 10, 5);

  const availablePanelOptions = ALL_PANEL_OPTIONS.filter((p) => p.n <= maxAvailable);

  // Auto-set panelSize to max available whenever the audience changes
  useEffect(() => {
    if (maxAvailable > 0) setPanelSize(maxAvailable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxAvailable]);

  const mainInput = fieldValues["main"] ?? "";
  const canAdvanceStep1 = useCase !== null;
  const canAdvanceStep2 = mainInput.trim().length >= 20;
  const canAdvanceStep3 = selectedAudience !== "" || savedAudienceId !== null;
  const canAdvance = step === 1 ? canAdvanceStep1 : step === 2 ? canAdvanceStep2 : canAdvanceStep3;

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleNext = () => {
    if (canAdvance && step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleSubmit = async () => {
    if (!config || !canAdvanceStep3) return;
    setSubmitting(true);
    setSimEvents([]);

    const contextParts = config.fields
      .filter((f) => f.key !== "main" && fieldValues[f.key])
      .map((f) => `${f.label}: ${fieldValues[f.key]}`)
      .filter(Boolean);

    const ideaPayload = contextParts.length
      ? `${mainInput.trim()}\n\n---\n${contextParts.join("\n")}`
      : mainInput.trim();

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = {
        idea: ideaPayload,
        persona_ids: savedAudienceId ? [] : [selectedAudience],
        audience_id: savedAudienceId ?? undefined,
        panel_size: maxAvailable,
        use_case: useCase,
        workflow_type: "simulation",
        title: mainInput.trim().slice(0, 100),
        depth: "quick",
      };

      const res = await fetch(`${API_URL}/api/founder/simulate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Simulation failed. Please try again.");
      }

      const { review_id } = (await res.json()) as { review_id: string };

      // Persist review_id so re-connecting after a tab close is possible
      try { sessionStorage.setItem("sim_review_id", review_id); } catch { /* ignored */ }

      setSimReviewId(review_id);
      setPollerEnabled(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setSubmitting(false);
      setSimEvents([]);
    }
  };

  // Show live simulation state while running
  if (submitting && config) {
    return <SimulationProgressState label={config.label} events={simEvents} pendingRedirectId={pendingRedirectId} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}>
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <StepperHeader
          step={step}
          canAdvance={canAdvance}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          submitting={submitting}
        />

        {step === 1 && (
          <StepChoose
            selected={useCase}
            onSelect={(id) => {
              setUseCase(id);
              setFieldValuesState({});
            }}
          />
        )}

        {step === 2 && config && (
          <StepContent
            config={config}
            fieldValues={fieldValues}
            setFieldValue={setFieldValue}
          />
        )}

        {step === 3 && config && (
          <StepConfigureAudience
            config={config}
            selectedAudience={selectedAudience}
            setSelectedAudience={setSelectedAudience}
            panelSize={panelSize}
            audienceLibrary={audienceLibrary}
            savedAudienceId={savedAudienceId}
            setSavedAudienceId={setSavedAudienceId}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */
export default function SimulationsNewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-0)" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
        </div>
      }
    >
      <SimulationIntakeInner />
    </Suspense>
  );
}
