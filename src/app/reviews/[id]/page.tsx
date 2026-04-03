"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Play,
  FileText,
  Sparkles,
  AtSign,
  X,
  BookOpen,
  ExternalLink,
  Download,
  UserPlus,
  MessageSquare,
  Clock,
  RotateCcw,
  Target,
  Calendar,
  Plus,
  Map,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Info,
  Share2,
  Layers,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import AudienceSimView from "@/components/AudienceSimView";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Persona {
  id: string;
  name: string;
  archetype?: string;
  emoji?: string;
  color?: string;
  tagline?: string;
  expertise?: string[];
  approach?: string;
}

interface ConversationEntry {
  role: string;
  persona_id: string | null;
  content: string;
}

interface ReviewSession {
  id: string;
  type: "founder";
  useCase: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  status: "ready";
  founderSessionId: string;
  personas: Persona[];
  analyses: Record<string, PersonaAnalysis | string>;
  researchPack: string;
  researchPackData?: ResearchPackData | null;
  conversationHistory?: ConversationEntry[];
  // Workspace extensions
  artifacts?: Artifact[];
  runs?: Run[];
  currentRunId?: string;
  idea?: string;
  industry?: string;
  stage?: string;
  targetMarket?: string;
  iterationLabel?: string;
  methodology?: MethodologyMeta;
  shareToken?: string | null;
  // Feature Review fields
  contextPackId?: string | null;
  featureName?: string | null;
  affectedUsers?: string | null;
  successMetric?: string | null;
  featureConstraints?: string | null;
  featureProblem?: string | null;
  alternativesConsidered?: string | null;
  contextPackData?: {
    product_summary: string;
    primary_user: string;
    product_stage: string;
    core_workflow: string;
    business_model: string;
    constraints: string;
    file_count: number;
    pack_name: string;
  } | null;
  // Pitch Review fields
  pitchAudience?: string | null;
  pitchSections?: string[] | null;
  targetCheckSize?: string | null;
  // Simulation fields
  workflowType?: string | null;
  simulationVerdict?: {
    verdict: string;
    avg_comprehension: number;
    avg_engagement: number;
    share_rate: number;
    risk_flags: string[];
    recommendations: string[];
  } | null;
  simulationReactions?: Array<{
    name: string;
    role: string;
    reaction: string;
    comprehension: number;
    engagement: number;
    confusion: string;
    would_share: boolean;
  }> | null;
  simulationDebateMessages?: Array<{
    from_name: string;
    to_names: string[];
    message: string;
    role: string;
  }> | null;
}

interface Competitor {
  name: string;
  domain?: string;
  description: string;
  strength: string;
  weakness: string;
}

interface ResearchPackData {
  market_overview: string;
  competitors: Competitor[];
  target_customer: string;
  business_model: string;
  top_risks: string[];
  top_opportunities: string[];
  strategic_questions: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "advisor";
  personaId?: string;
  personaName?: string;
  personaArchetype?: string;
  content: string;
  timestamp: Date;
}

interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
  source_run_id?: string;
}

interface Run {
  id: string;
  created_at: string;
  label: string;
  idea: string;
  input_snapshot?: {
    idea: string;
    industry?: string;
    stage?: string;
    target_market?: string;
  };
}

/* Phase 1: Evidence + Methodology */
interface PersonaAnalysis {
  text: string;
  confidence: "high" | "moderate" | "directional";
  evidence_items: string[];
  assumptions: string[];
  recommendation?: "BUILD" | "DEFER" | "RECONSIDER";  // Feature Review
  pitch_verdict?: "READY" | "REVISE" | "NOT_READY";   // Pitch Review
}

interface MethodologyMeta {
  inputs_used: string[];
  models_used: string[];
  run_mode: string;
  is_synthetic: boolean;
  validation_guidance: string;
}

type AppView = "tabs" | "panel-select" | "panel-chat" | "final-report" | "audience-sim" | "artifact-view";
type TabId = "overview" | "research-pack" | "expert-reviews" | "panel" | "artifacts" | "history";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function USE_CASE_LABEL(id: string): string {
  const map: Record<string, string> = {
    "validate-idea": "Idea Review",
    "review-feature": "Feature Review",
    "review-pitch": "Pitch Review",
    "test-ad": "Ad Testing",
    "test-messaging": "Messaging Test",
    "stress-test-launch": "Launch Stress Test",
    founder: "Founder Analysis",
  };
  return map[id] || id;
}

function renderAnalysis(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const headerMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (headerMatch) {
      return (
        <h3
          key={i}
          className="text-xs font-semibold tracking-widest uppercase mt-6 mb-2 first:mt-0"
          style={{ color: "var(--accent-amber)" }}
        >
          {headerMatch[1]}
        </h3>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--text-2)" }}>
        {parts.map((part, j) => {
          const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
          return boldMatch ? (
            <strong key={j} style={{ color: "var(--text-1)", fontWeight: 600 }}>
              {boldMatch[1]}
            </strong>
          ) : (
            part
          );
        })}
      </p>
    );
  });
}

/* Confidence / severity tag pill */
function TagPill({ tag }: { tag: string }) {
  const styles: Record<string, React.CSSProperties> = {
    "GROUNDED":    { backgroundColor: "rgba(56,178,125,0.14)", color: "rgb(56,178,125)",   border: "1px solid rgba(56,178,125,0.3)" },
    "INFERENCE":   { backgroundColor: "rgba(242,169,59,0.14)", color: "var(--accent-amber)", border: "1px solid rgba(242,169,59,0.3)" },
    "ASSUMPTION":  { backgroundColor: "rgba(223,107,87,0.14)", color: "rgb(223,107,87)",   border: "1px solid rgba(223,107,87,0.3)" },
    "HIGH-RISK":   { backgroundColor: "rgba(223,107,87,0.14)", color: "rgb(223,107,87)",   border: "1px solid rgba(223,107,87,0.3)" },
    "MEDIUM-RISK": { backgroundColor: "rgba(242,169,59,0.14)", color: "var(--accent-amber)", border: "1px solid rgba(242,169,59,0.3)" },
    "LOW-RISK":    { backgroundColor: "rgba(56,178,125,0.14)", color: "rgb(56,178,125)",   border: "1px solid rgba(56,178,125,0.3)" },
  };
  const s = styles[tag] ?? { backgroundColor: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" };
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5" style={s}>
      {tag}
    </span>
  );
}

/** Renders rich artifact markdown: ##/### headers, bullets, numbered lists, bold, tag pills. */
function renderRichMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: React.ReactNode[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    if (listBuffer.ordered) {
      nodes.push(
        <ol key={key} className="space-y-2 my-3 pl-1">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(242,169,59,0.14)", color: "var(--accent-amber)" }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{item}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={key} className="space-y-1.5 my-3 pl-1">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "rgba(242,169,59,0.6)" }} />
              <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    listBuffer = null;
  };

  const renderInline = (str: string, keyBase: string): React.ReactNode => {
    // Replace [TAG] patterns then split on **bold**
    const tagPattern = /\[(GROUNDED|INFERENCE|ASSUMPTION|HIGH-RISK|MEDIUM-RISK|LOW-RISK)\]/g;
    const parts = str.split(/(\*\*[^*]+\*\*|\[(?:GROUNDED|INFERENCE|ASSUMPTION|HIGH-RISK|MEDIUM-RISK|LOW-RISK)\])/g);
    return (
      <>
        {parts.map((part, j) => {
          const boldM = part.match(/^\*\*(.+?)\*\*$/);
          if (boldM) return <strong key={`${keyBase}-${j}`} style={{ color: "var(--text-1)", fontWeight: 600 }}>{boldM[1]}</strong>;
          const tagM = part.match(/^\[(GROUNDED|INFERENCE|ASSUMPTION|HIGH-RISK|MEDIUM-RISK|LOW-RISK)\]$/);
          if (tagM) return <TagPill key={`${keyBase}-${j}`} tag={tagM[1]} />;
          return part;
        })}
      </>
    );
  };

  lines.forEach((line, i) => {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const bullet = line.match(/^[-*]\s+(.+)/);
    const numbered = line.match(/^\d+\.\s+(.+)/);
    const empty = !line.trim();

    if (h2) {
      flushList(`flush-${i}`);
      nodes.push(
        <h2
          key={i}
          className="text-xs font-semibold tracking-widest uppercase mt-7 mb-3 first:mt-0 pb-2"
          style={{ color: "var(--accent-amber)", borderBottom: "1px solid rgba(242,169,59,0.18)" }}
        >
          {h2[1]}
        </h2>
      );
    } else if (h3) {
      flushList(`flush-${i}`);
      nodes.push(
        <h3 key={i} className="text-sm font-semibold mt-5 mb-2" style={{ color: "var(--text-1)" }}>
          {h3[1]}
        </h3>
      );
    } else if (bullet) {
      if (listBuffer && listBuffer.ordered) flushList(`flush-${i}`);
      if (!listBuffer) listBuffer = { ordered: false, items: [] };
      listBuffer.items.push(renderInline(bullet[1], `b-${i}`));
    } else if (numbered) {
      if (listBuffer && !listBuffer.ordered) flushList(`flush-${i}`);
      if (!listBuffer) listBuffer = { ordered: true, items: [] };
      listBuffer.items.push(renderInline(numbered[1], `n-${i}`));
    } else if (empty) {
      flushList(`flush-${i}`);
      nodes.push(<div key={i} className="h-2" />);
    } else {
      flushList(`flush-${i}`);
      nodes.push(
        <p key={i} className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--text-2)" }}>
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  });
  flushList("flush-end");
  return <>{nodes}</>;
}

function deriveOverview(analyses: Record<string, PersonaAnalysis | string>) {
  const allText = Object.values(analyses).map((a) => toPersonaAnalysis(a).text).join(" ").toLowerCase();

  const positiveSignals = (
    allText.match(/\b(opportunity|strong|viable|promising|recommend|proceed|worth|potential)\b/g) || []
  ).length;
  const negativeSignals = (
    allText.match(/\b(risk|concern|challenge|problem|fail|avoid|difficult|competitive|saturated)\b/g) || []
  ).length;

  let verdict: "proceed" | "revise" | "stop" = "revise";
  if (positiveSignals > negativeSignals * 1.5) verdict = "proceed";
  else if (negativeSignals > positiveSignals * 2) verdict = "stop";

  const sentences = Object.values(analyses)
    .flatMap((a) => toPersonaAnalysis(a).text.split(/[.!?]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 500);

  const riskSentences = sentences.filter((s) =>
    /risk|challenge|concern|problem|fail|difficult/i.test(s)
  );
  const oppSentences = sentences.filter((s) =>
    /opportunity|potential|strong|viable|promising|worth/i.test(s)
  );

  return {
    verdict,
    risks: riskSentences.slice(0, 3),
    opportunities: oppSentences.slice(0, 3),
    majorRisk: riskSentences[0] || "Multiple risk factors identified across lenses.",
    majorOpportunity: oppSentences[0] || "Opportunity identified — further validation recommended.",
    agreementPoints: ["Core problem is clearly defined", "Target customer is identifiable"],
    disagreementPoints: ["Timing and market readiness", "Resource requirements and timeline"],
  };
}

/** Normalize a legacy string analysis or new PersonaAnalysis object into a typed shape. */
function toPersonaAnalysis(v: PersonaAnalysis | string | undefined): PersonaAnalysis {
  if (!v) return { text: "", confidence: "directional", evidence_items: [], assumptions: [] };
  if (typeof v === "string") return { text: v, confidence: "directional", evidence_items: [], assumptions: [] };
  return v;
}

/** Derive Feature Review BUILD/DEFER/RECONSIDER verdict from per-persona recommendations. */
function deriveFeatureVerdict(analyses: Record<string, PersonaAnalysis | string>) {
  const recommendations = Object.values(analyses)
    .map((a) => toPersonaAnalysis(a).recommendation)
    .filter(Boolean) as Array<"BUILD" | "DEFER" | "RECONSIDER">;

  const buildCount = recommendations.filter((r) => r === "BUILD").length;
  const deferCount = recommendations.filter((r) => r === "DEFER").length;
  const reconsiderCount = recommendations.filter((r) => r === "RECONSIDER").length;

  // Fallback to keyword counting if no machine-readable tags
  if (recommendations.length === 0) {
    const allText = Object.values(analyses).map((a) => toPersonaAnalysis(a).text).join(" ").toLowerCase();
    const buildSignals = (allText.match(/\b(ship|build|proceed|launch|ready|worth)\b/g) || []).length;
    const stopSignals = (allText.match(/\b(risk|concern|problem|defer|reconsider|difficult)\b/g) || []).length;
    const verdict = buildSignals > stopSignals * 1.3 ? "BUILD" : stopSignals > buildSignals * 1.5 ? "RECONSIDER" : "DEFER";
    return { verdict, buildCount: 0, deferCount: 0, reconsiderCount: 0, total: 0, fromKeywords: true };
  }

  let verdict: "BUILD" | "DEFER" | "RECONSIDER" = "DEFER";
  if (buildCount > deferCount && buildCount > reconsiderCount) verdict = "BUILD";
  else if (reconsiderCount > buildCount && reconsiderCount >= deferCount) verdict = "RECONSIDER";

  return { verdict, buildCount, deferCount, reconsiderCount, total: recommendations.length, fromKeywords: false };
}

/** Derive Pitch Review READY/REVISE/NOT_READY verdict + confidence score. */
function derivePitchOverview(analyses: Record<string, PersonaAnalysis | string>) {
  const allAnalyses = Object.values(analyses).map((a) => toPersonaAnalysis(a));
  const verdicts = allAnalyses.map((a) => a.pitch_verdict).filter(Boolean) as Array<"READY" | "REVISE" | "NOT_READY">;

  const readyCount = verdicts.filter((v) => v === "READY").length;
  const reviseCount = verdicts.filter((v) => v === "REVISE").length;
  const notReadyCount = verdicts.filter((v) => v === "NOT_READY").length;

  let verdict: "READY" | "REVISE" | "NOT_READY" = "REVISE";
  if (readyCount > reviseCount && readyCount > notReadyCount) verdict = "READY";
  else if (notReadyCount > readyCount && notReadyCount >= reviseCount) verdict = "NOT_READY";

  const confScores = allAnalyses.map((a) =>
    a.confidence === "high" ? 100 : a.confidence === "moderate" ? 65 : 35
  );
  const avgConfidence = confScores.length > 0
    ? Math.round(confScores.reduce((s, v) => s + v, 0) / confScores.length)
    : 50;

  // Derive sub-scores from keyword analysis on combined prose
  const allText = allAnalyses.map((a) => a.text).join(" ").toLowerCase();
  const score = (pos: RegExp, neg: RegExp): number => {
    const p = (allText.match(pos) || []).length;
    const n = (allText.match(neg) || []).length;
    const total = p + n;
    return total === 0 ? 50 : Math.round((p / total) * 100);
  };

  return {
    verdict,
    readyCount,
    reviseCount,
    notReadyCount,
    total: verdicts.length,
    avgConfidence,
    narrativeClarity: score(/\b(clear|coherent|logical|flow|structured|concise)\b/g, /\b(confusing|unclear|disjointed|jumbled|hard to follow)\b/g),
    claimCredibility: score(/\b(credible|evidence|traction|data|proven|specific|grounded)\b/g, /\b(vague|unsupported|generic|unsubstantiated|unclear claim)\b/g),
    audienceFit: score(/\b(resonates?|fit|appropriate|aligned|calibrated|right audience)\b/g, /\b(misaligned|wrong audience|doesn.t fit|off-target|irrelevant)\b/g),
  };
}

/** Return conditionalized section labels for the Research Pack tab. */
function getResearchPackLabels(useCase: string | null | undefined): Record<string, string> {
  if (useCase === "review-feature") {
    return {
      market_overview: "Product Context & Strategic Fit",
      competitors: "Comparable Feature Implementations",
      target_customer: "Affected User Profile",
      business_model: "Feature Business Case",
      top_risks: "Feature Risks",
      top_opportunities: "Why Build Now",
      strategic_questions: "Open Questions Before Ship",
    };
  }
  if (useCase === "review-pitch") {
    return {
      market_overview: "Market & Problem Credibility",
      competitors: "Competitive Landscape (Investor View)",
      target_customer: "Ideal Investor Profile",
      business_model: "Business Model Credibility",
      top_risks: "Weakest Claims",
      top_opportunities: "Strongest Signals",
      strategic_questions: "Hardest Investor Questions",
    };
  }
  return {
    market_overview: "Market Overview",
    competitors: "Key Competitors",
    target_customer: "Target Customer",
    business_model: "Business Model",
    top_risks: "Top Risks",
    top_opportunities: "Top Opportunities",
    strategic_questions: "Strategic Questions",
  };
}

function extractPersonaSummary(analysis: string): string {
  const lines = analysis
    .replace(/\*\*/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 30 && !/^[A-Z\s]{4,30}$/.test(l));
  return lines.slice(0, 2).join(" ").slice(0, 280);
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */
function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl flex flex-col"
        style={{
          backgroundColor: "var(--bg-1)",
          border: "1px solid var(--border-default)",
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h3 className="font-semibold text-base" style={{ color: "var(--text-1)" }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 transition-colors ml-4 flex-shrink-0"
            style={{ color: "var(--text-3)" }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Modal body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Overview Content                                           */
/* ------------------------------------------------------------------ */
function FeatureOverviewContent({
  review,
  onContinuePanel,
  onOpenArtifacts,
  onNewIteration,
}: {
  review: ReviewSession;
  onContinuePanel: () => void;
  onOpenArtifacts: () => void;
  onNewIteration: () => void;
}) {
  const { verdict, buildCount, deferCount, reconsiderCount, total, fromKeywords } = deriveFeatureVerdict(review.analyses);

  const verdictCfg = {
    BUILD: { label: "Build It", color: "#38b27d", bg: "#38b27d12", border: "#38b27d35", icon: CheckCircle },
    DEFER: { label: "Defer", color: "#f2a93b", bg: "#f2a93b12", border: "#f2a93b35", icon: AlertTriangle },
    RECONSIDER: { label: "Reconsider Approach", color: "#df6b57", bg: "#df6b5712", border: "#df6b5735", icon: XCircle },
  }[verdict] || { label: "Unknown", color: "#888", bg: "#88812", border: "#88835", icon: AlertTriangle };
  const VerdictIcon = verdictCfg.icon;

  // Extract top concerns from persona prose
  const concerns: { text: string; persona: string }[] = [];
  for (const persona of review.personas) {
    const analysis = toPersonaAnalysis(review.analyses[persona.id]);
    const sentences = analysis.text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 40);
    const concern = sentences.find((s) => /\b(risk|concern|adoption|scope|complex|challenge|problem|break)\b/i.test(s));
    if (concern && concerns.length < 3) {
      concerns.push({ text: concern, persona: persona.name });
    }
  }

  // Quadrant placement
  const quadrant = verdict === "BUILD"
    ? { label: "Strategic Bet", q: "top-right", desc: "High impact, focused effort" }
    : verdict === "DEFER"
    ? { label: "Fill-In", q: "bottom-left", desc: "Consider as quick win or backlog" }
    : { label: "Reconsider", q: "bottom-right", desc: "Effort may not justify return" };

  return (
    <div className="space-y-5">
      {/* Verdict card */}
      <div className="rounded-xl p-6" style={{ border: `1px solid ${verdictCfg.border}`, backgroundColor: verdictCfg.bg }}>
        <div className="flex items-center gap-3 mb-3">
          <VerdictIcon size={17} style={{ color: verdictCfg.color }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: verdictCfg.color }}>
            {verdictCfg.label}
          </span>
          {!fromKeywords && total > 0 && (
            <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>
              {buildCount} build · {deferCount} defer · {reconsiderCount} reconsider
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          {!fromKeywords && total > 0
            ? `${total > 0 ? Math.round((buildCount / total) * 100) : 0}% of expert lenses recommend building this feature${verdict === "BUILD" ? " now" : " — but conditions apply"}.`
            : "Based on expert analysis of feature value, strategic fit, and implementation risk."}{" "}
          See Expert Reviews for individual reasoning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ContextPak card */}
        {review.contextPackData && (
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
              Product Context Used
            </p>
            <p className="text-sm font-medium mb-3" style={{ color: "var(--text-1)" }}>
              {review.contextPackData.pack_name || "Saved Context Pack"}
            </p>
            <div className="space-y-2">
              {review.contextPackData.product_stage && (
                <div className="flex gap-2 items-start">
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>Stage</span>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{review.contextPackData.product_stage}</span>
                </div>
              )}
              {review.contextPackData.primary_user && (
                <div className="flex gap-2 items-start">
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>User</span>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{review.contextPackData.primary_user}</span>
                </div>
              )}
              {review.contextPackData.constraints && (
                <div className="flex gap-2 items-start">
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>Constraints</span>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{review.contextPackData.constraints}</span>
                </div>
              )}
            </div>
            {review.contextPackData.file_count > 0 && (
              <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>
                {review.contextPackData.file_count} uploaded file{review.contextPackData.file_count !== 1 ? "s" : ""} included
              </p>
            )}
          </div>
        )}

        {/* Impact-Effort quadrant */}
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
            Impact vs Effort
          </p>
          <div className="grid grid-cols-2 gap-1 text-center" style={{ fontSize: "11px" }}>
            {[
              { pos: "top-left", label: "Quick Win", sub: "Low effort, high impact" },
              { pos: "top-right", label: "Strategic Bet", sub: "High effort, high impact" },
              { pos: "bottom-left", label: "Fill-In", sub: "Low effort, lower impact" },
              { pos: "bottom-right", label: "Reconsider", sub: "High effort, lower impact" },
            ].map(({ pos, label, sub }) => {
              const isActive = quadrant.q === pos;
              return (
                <div
                  key={pos}
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: isActive ? "#f2a93b18" : "var(--bg-2)",
                    border: isActive ? "1px solid #f2a93b55" : "1px solid var(--border-subtle)",
                  }}
                >
                  <p className="font-semibold" style={{ color: isActive ? "var(--text-1)" : "var(--text-3)" }}>{label}</p>
                  <p style={{ color: "var(--text-3)" }}>{sub}</p>
                  {isActive && review.featureName && (
                    <p className="mt-1 font-medium" style={{ color: "#f2a93b", fontSize: "10px" }}>
                      ← {review.featureName.slice(0, 20)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top concerns */}
      {concerns.length > 0 && (
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
            Key Concerns from Advisors
          </p>
          <div className="space-y-3">
            {concerns.map((c, i) => (
              <div key={i} className="flex gap-3">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#f2a93b" }} />
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{c.text}.</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>— {c.persona}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { label: "Continue Panel", action: onContinuePanel, primary: true },
          { label: "Generate Decision Memo", action: onOpenArtifacts, primary: false },
          { label: "New Iteration", action: onNewIteration, primary: false },
        ].map(({ label, action, primary }) => (
          <button
            key={label}
            onClick={action}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={primary
              ? { backgroundColor: "var(--accent-amber)", color: "#0a0a08" }
              : { border: "1px solid var(--border-default)", color: "var(--text-2)", backgroundColor: "transparent" }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pitch Overview Content                                             */
/* ------------------------------------------------------------------ */
function PitchOverviewContent({
  review,
  onContinuePanel,
  onOpenArtifacts,
  onNewIteration,
}: {
  review: ReviewSession;
  onContinuePanel: () => void;
  onOpenArtifacts: () => void;
  onNewIteration: () => void;
}) {
  const { verdict, readyCount, reviseCount, notReadyCount, total, avgConfidence, narrativeClarity, claimCredibility, audienceFit } = derivePitchOverview(review.analyses);

  const verdictCfg = {
    READY: { label: "Ready to Present", color: "#38b27d", bg: "#38b27d12", border: "#38b27d35", icon: CheckCircle },
    REVISE: { label: "Needs Revision", color: "#f2a93b", bg: "#f2a93b12", border: "#f2a93b35", icon: AlertTriangle },
    NOT_READY: { label: "Not Ready", color: "#df6b57", bg: "#df6b5712", border: "#df6b5735", icon: XCircle },
  }[verdict];
  const VerdictIcon = verdictCfg.icon;

  // Extract top objections from persona prose
  const objections: { text: string; persona: string; emoji?: string }[] = [];
  for (const persona of review.personas) {
    const analysis = toPersonaAnalysis(review.analyses[persona.id]);
    const sentences = analysis.text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 30);
    const objection = sentences.find((s) =>
      /\b(will ask|concern about|challenge|biggest risk|weakest|doesn.t answer|missing|gap|why would|how does)\b/i.test(s)
    );
    if (objection && objections.length < 3) {
      objections.push({ text: objection, persona: persona.name, emoji: persona.emoji });
    }
  }

  // Extract strongest and weakest claims
  let strongestClaim = "";
  let weakestClaim = "";
  for (const persona of review.personas) {
    const analysis = toPersonaAnalysis(review.analyses[persona.id]);
    const sentences = analysis.text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 40);
    if (!strongestClaim) {
      const s = sentences.find((s) => /\b(strongest|compelling|best part|most convincing|clear advantage|standout)\b/i.test(s));
      if (s) strongestClaim = s;
    }
    if (!weakestClaim) {
      const s = sentences.find((s) => /\b(weakest|gap|missing|needs work|less convincing|unclear|biggest concern)\b/i.test(s));
      if (s) weakestClaim = s;
    }
    if (strongestClaim && weakestClaim) break;
  }

  const ScoreBar = ({ label, value }: { label: string; value: number }) => {
    const color = value >= 70 ? "#38b27d" : value >= 45 ? "#f2a93b" : "#df6b57";
    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
          <span className="text-xs font-medium" style={{ color }}>{value}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-2)" }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Score card */}
      <div className="rounded-xl p-6" style={{ border: `1px solid ${verdictCfg.border}`, backgroundColor: verdictCfg.bg }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <VerdictIcon size={17} style={{ color: verdictCfg.color }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: verdictCfg.color }}>
                {verdictCfg.label}
              </span>
            </div>
            {total > 0 && (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {readyCount} ready · {reviseCount} revise · {notReadyCount} not ready
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: verdictCfg.color }}>{avgConfidence}%</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Panel confidence</p>
          </div>
        </div>
        <div className="space-y-2.5">
          <ScoreBar label="Narrative Clarity" value={narrativeClarity} />
          <ScoreBar label="Claim Credibility" value={claimCredibility} />
          <ScoreBar label="Audience Fit" value={audienceFit} />
          <ScoreBar label="Panel Confidence" value={avgConfidence} />
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>
          Scores are derived from advisory panel assessments — directional, not precise measurements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top objections */}
        {objections.length > 0 && (
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
              Top Investor Objections
            </p>
            <div className="space-y-3">
              {objections.map((obj, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-base shrink-0">{obj.emoji || "💭"}</span>
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{obj.text}.</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>— {obj.persona}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strongest / Weakest */}
        <div className="space-y-3">
          {strongestClaim && (
            <div className="rounded-xl p-4" style={{ border: "1px solid #38b27d35", backgroundColor: "#38b27d09" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#38b27d" }}>
                Strongest Claim
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{strongestClaim}.</p>
            </div>
          )}
          {weakestClaim && (
            <div className="rounded-xl p-4" style={{ border: "1px solid #df6b5735", backgroundColor: "#df6b5709" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#df6b57" }}>
                Weakest Point
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{weakestClaim}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { label: "Continue Panel", action: onContinuePanel, primary: true },
          { label: "Generate Refined Pitch", action: onOpenArtifacts, primary: false },
          { label: "New Iteration", action: onNewIteration, primary: false },
        ].map(({ label, action, primary }) => (
          <button
            key={label}
            onClick={action}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={primary
              ? { backgroundColor: "var(--accent-amber)", color: "#0a0a08" }
              : { border: "1px solid var(--border-default)", color: "var(--text-2)", backgroundColor: "transparent" }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview: Simulation results                                       */
/* ------------------------------------------------------------------ */
function SimulationOverviewContent({
  review,
  onContinuePanel,
  onNewIteration,
}: {
  review: ReviewSession;
  onContinuePanel: () => void;
  onNewIteration: () => void;
}) {
  const v = review.simulationVerdict;
  const reactions = review.simulationReactions ?? [];
  const debate = review.simulationDebateMessages ?? [];

  const USE_CASE_LABEL_MAP: Record<string, string> = {
    "test-ad": "Ad Test",
    "test-messaging": "Messaging Test",
    "stress-test-launch": "Launch Stress-Test",
    "analyze-competitor": "Competitor Analysis",
  };
  const useCaseLabel = USE_CASE_LABEL_MAP[review.useCase ?? ""] ?? "Simulation";

  const avgComp = v?.avg_comprehension ?? (reactions.length ? reactions.reduce((s, r) => s + r.comprehension, 0) / reactions.length : 0);
  const avgEng = v?.avg_engagement ?? (reactions.length ? reactions.reduce((s, r) => s + r.engagement, 0) / reactions.length : 0);
  const shareRate = v?.share_rate ?? (reactions.length ? Math.round(reactions.filter((r) => r.would_share).length * 100 / reactions.length) : 0);

  const scoreColor = (val: number, max = 5) => {
    const pct = val / max;
    if (pct >= 0.7) return "rgb(56, 178, 125)";
    if (pct >= 0.4) return "var(--accent-amber)";
    return "rgb(223, 107, 87)";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>
          {useCaseLabel} Results
        </p>
        <h2 className="font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
          {review.title}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          {reactions.length} audience members · {debate.length > 0 ? "Discussion mode" : "Quick pulse"}
        </p>
      </div>

      {/* Scores row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Comprehension", value: avgComp, max: 5, format: (v: number) => `${v.toFixed(1)} / 5` },
          { label: "Engagement", value: avgEng, max: 5, format: (v: number) => `${v.toFixed(1)} / 5` },
          { label: "Would Share", value: shareRate, max: 100, format: (v: number) => `${Math.round(v)}%` },
        ].map(({ label, value, max, format }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: scoreColor(value, max) }}>
              {format(value)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Verdict prose */}
      {v?.verdict && (
        <div
          className="rounded-xl p-5"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent-amber)" }}>
            Verdict
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{v.verdict}</p>
        </div>
      )}

      {/* Risk flags + Recommendations side by side */}
      {((v?.risk_flags?.length ?? 0) > 0 || (v?.recommendations?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(v?.risk_flags?.length ?? 0) > 0 && (
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgb(223, 107, 87)" }}>
                Risk Flags
              </p>
              <ul className="space-y-2">
                {v!.risk_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "rgba(223, 107, 87, 0.6)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{flag}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(v?.recommendations?.length ?? 0) > 0 && (
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgb(56, 178, 125)" }}>
                Recommendations
              </p>
              <ul className="space-y-2">
                {v!.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "rgba(56, 178, 125, 0.6)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Audience reactions */}
      {reactions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Audience Reactions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reactions.map((r, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{r.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{r.role}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${scoreColor(r.comprehension, 5)}18`, color: scoreColor(r.comprehension, 5) }}>
                      C:{r.comprehension}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${scoreColor(r.engagement, 5)}18`, color: scoreColor(r.engagement, 5) }}>
                      E:{r.engagement}
                    </span>
                    {r.would_share && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(56,178,125,0.12)", color: "rgb(56,178,125)" }}>
                        ↗ Share
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-2)" }}>{r.reaction}</p>
                {r.confusion && (
                  <p className="text-xs mt-1.5 italic" style={{ color: "var(--text-3)" }}>Confusion: {r.confusion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate thread */}
      {debate.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Discussion Thread
          </p>
          <div className="space-y-2">
            {debate.map((msg, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                  {msg.from_name}
                  {msg.to_names?.length > 0 && (
                    <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                      {" → "}{msg.to_names.join(", ")}
                    </span>
                  )}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={onNewIteration}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-2)", color: "var(--text-2)" }}
        >
          <RotateCcw size={11} /> Run Again
        </button>
        <button
          onClick={onContinuePanel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-2)", color: "var(--text-2)" }}
        >
          <MessageSquare size={11} /> Discuss with Panel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Overview                                                      */
/* ------------------------------------------------------------------ */
function OverviewTab({
  review,
  onContinuePanel,
  onOpenArtifacts,
  onNewIteration,
  onEngageAudience,
}: {
  review: ReviewSession;
  onContinuePanel: () => void;
  onOpenArtifacts: () => void;
  onNewIteration: () => void;
  onEngageAudience: () => void;
}) {
  const [researchOpen, setResearchOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  // Branch on workflow type and use case — each has dedicated overview content
  if (review.workflowType === "simulation") {
    return (
      <SimulationOverviewContent
        review={review}
        onContinuePanel={onContinuePanel}
        onNewIteration={onNewIteration}
      />
    );
  }
  if (review.useCase === "review-feature") {
    return (
      <FeatureOverviewContent
        review={review}
        onContinuePanel={onContinuePanel}
        onOpenArtifacts={onOpenArtifacts}
        onNewIteration={onNewIteration}
      />
    );
  }
  if (review.useCase === "review-pitch") {
    return (
      <PitchOverviewContent
        review={review}
        onContinuePanel={onContinuePanel}
        onOpenArtifacts={onOpenArtifacts}
        onNewIteration={onNewIteration}
      />
    );
  }

  const overview = deriveOverview(review.analyses);

  const verdictConfig = {
    proceed: { label: "Proceed", icon: CheckCircle, color: "#38b27d" },
    revise: { label: "Revise & Validate", icon: AlertTriangle, color: "#f2a93b" },
    stop: { label: "Do Not Proceed", icon: XCircle, color: "#df6b57" },
  }[overview.verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <>
      <div className="space-y-6">
        {/* Verdict */}
        <div
          className="rounded-xl p-6"
          style={{
            border: `1px solid ${verdictConfig.color}35`,
            backgroundColor: `${verdictConfig.color}09`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <VerdictIcon size={17} style={{ color: verdictConfig.color }} />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: verdictConfig.color }}
            >
              {verdictConfig.label}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Based on independent assessments from{" "}
            <strong style={{ color: "var(--text-1)" }}>
              {review.personas.length} expert lenses
            </strong>
            , the preliminary signal is{" "}
            <strong style={{ color: verdictConfig.color }}>
              {verdictConfig.label.toLowerCase()}
            </strong>
            . Review Expert Reviews for individual reasoning, then start a panel to go deeper.
          </p>
        </div>

        {/* Risk + Opportunities — full width 2-col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risks */}
          <div
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(223, 107, 87, 0.18)",
              backgroundColor: "var(--bg-1)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(223, 107, 87, 0.8)" }}
            >
              Key Risks
            </p>
            <ul className="space-y-3">
              {(overview.risks.length > 0 ? overview.risks : [overview.majorRisk]).map(
                (risk, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: "rgba(223, 107, 87, 0.6)" }}
                    />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {risk}.
                    </p>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Opportunities */}
          <div
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(56, 178, 125, 0.18)",
              backgroundColor: "var(--bg-1)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(56, 178, 125, 0.8)" }}
            >
              Key Opportunities
            </p>
            <ul className="space-y-3">
              {(overview.opportunities.length > 0
                ? overview.opportunities
                : [overview.majorOpportunity]
              ).map((opp, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: "rgba(56, 178, 125, 0.6)" }}
                  />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {opp}.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel alignment — full width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              label: "What experts agree on",
              items: overview.agreementPoints,
              accent: "var(--accent-amber)",
            },
            {
              label: "Points of debate",
              items: overview.disagreementPoints,
              accent: "rgba(223, 107, 87, 0.7)",
            },
          ].map(({ label, items, accent }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-1)",
              }}
            >
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: "var(--text-3)" }}
              >
                {label}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

          {/* Quick actions */}
        <div
          className="rounded-xl p-5"
          style={{
            border: "1px solid rgba(242, 169, 59, 0.15)",
            backgroundColor: "rgba(242, 169, 59, 0.04)",
          }}
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--text-3)" }}
          >
            Continue working
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onContinuePanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--accent-amber)",
                color: "var(--bg-0)",
              }}
            >
              <MessageSquare size={11} />
              Continue Panel
            </button>
            <button
              onClick={onOpenArtifacts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              <Zap size={11} />
              Generate Artifact
            </button>
            <button
              onClick={onEngageAudience}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              <Users size={11} />
              Engage Audience
            </button>
            {review.useCase === "review-feature" && (
              <Link
                href={`/reviews/new?use_case=validate-idea&parent_review_id=${review.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-2)",
                  color: "var(--text-2)",
                }}
              >
                <UserPlus size={11} />
                Run Audience Validation
              </Link>
            )}
            <button
              onClick={onNewIteration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              <RotateCcw size={11} />
              New Iteration
            </button>
          </div>
        </div>

        {/* Research context — teaser + open modal */}
        {review.researchPack && (
          <div
            className="rounded-xl p-5"
            style={{
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-1)",
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={13} style={{ color: "var(--text-3)" }} />
                <p
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "var(--text-3)" }}
                >
                  Research Context
                </p>
              </div>
              <button
                onClick={() => setResearchOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: "var(--accent-amber)" }}
              >
                <ExternalLink size={11} />
                View full research
              </button>
            </div>
            <p
              className="text-sm leading-relaxed line-clamp-3"
              style={{ color: "var(--text-3)" }}
            >
              {review.researchPack
                .replace(/^#{1,3}\s/gm, "")
                .replace(/\*\*/g, "")
                .replace(/^---.*$/gm, "")
                .trim()
                .slice(0, 320)}
              …
            </p>
            <button
              onClick={() => setResearchOpen(true)}
              className="mt-3 text-xs transition-colors"
              style={{ color: "var(--text-3)" }}
            >
              Read more →
            </button>
          </div>
        )}
      </div>

      {/* Methodology disclosure */}
      {review.methodology && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          <button
            onClick={() => setMethodologyOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ backgroundColor: "transparent" }}
          >
            <div className="flex items-center gap-2">
              <Info size={13} style={{ color: "var(--text-3)" }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
                How this was generated
              </span>
            </div>
            {methodologyOpen ? (
              <ChevronUp size={13} style={{ color: "var(--text-3)" }} />
            ) : (
              <ChevronDown size={13} style={{ color: "var(--text-3)" }} />
            )}
          </button>
          {methodologyOpen && (
            <div
              className="px-5 pb-5 space-y-3"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Inputs</p>
                  <ul className="space-y-0.5">
                    {review.methodology.inputs_used.map((item, i) => (
                      <li key={i} className="text-xs" style={{ color: "var(--text-2)" }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Model</p>
                  <ul className="space-y-0.5">
                    {review.methodology.models_used.map((m, i) => (
                      <li key={i} className="text-xs" style={{ color: "var(--text-2)" }}>{m.split("/").pop()}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Mode</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-2)" }}>{review.methodology.run_mode}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                {review.methodology.validation_guidance}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Suggested next steps */}
      <div className="pt-2">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "var(--text-3)" }}
        >
          Suggested next steps
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/simulations/new"
            className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:border-[var(--accent-cyan)]"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <div className="flex items-center gap-2">
              <Users size={13} style={{ color: "var(--accent-cyan)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
                Test with an audience
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              Simulate how your target audience reacts to your positioning before you spend.
            </p>
          </Link>
          <Link
            href="/competitor-analysis/new"
            className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:border-[var(--border-strong)]"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <div className="flex items-center gap-2">
              <Target size={13} style={{ color: "var(--text-2)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Analyze a competitor
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              Map competitor positioning and find gaps you can exploit.
            </p>
          </Link>
          <button
            onClick={onOpenArtifacts}
            className="flex flex-col gap-2 rounded-xl p-4 text-left transition-colors hover:border-[var(--accent-amber)]"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: "var(--accent-amber)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--accent-amber)" }}>
                Generate GTM strategy
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              Turn these insights into a go-to-market strategy, pitch draft, or 30-day plan.
            </p>
          </button>
        </div>
      </div>

      {/* Research modal */}
      {researchOpen && (
        <Modal
          title="Research Context"
          subtitle="Full background research compiled before expert review"
          onClose={() => setResearchOpen(false)}
        >
          {renderAnalysis(review.researchPack)}
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Expert Reviews                                                */
/* ------------------------------------------------------------------ */
function ExpertReviewsTab({ review, onAskPanel }: { review: ReviewSession; onAskPanel?: (text: string) => void }) {
  const [openPersonaId, setOpenPersonaId] = useState<string | null>(null);
  const openPersona = openPersonaId
    ? review.personas.find((p) => p.id === openPersonaId)
    : null;

  // For simulation reviews, use rich reaction data if available
  if (review.workflowType === "simulation") {
    const reactions = review.simulationReactions ?? [];
    const scoreColor = (val: number) => val >= 4 ? "rgb(56, 178, 125)" : val >= 3 ? "var(--accent-amber)" : "rgb(223, 107, 87)";
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Individual audience reactions from the simulation panel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reactions.map((r, i) => (
            <div key={i} className="rounded-xl p-5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{r.role}</p>
                </div>
                {r.would_share && (
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "rgba(56,178,125,0.12)", color: "rgb(56,178,125)" }}>
                    ↗ Share
                  </span>
                )}
              </div>
              <div className="flex gap-3 mb-3">
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: scoreColor(r.comprehension) }}>{r.comprehension}/5</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Comprehension</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: scoreColor(r.engagement) }}>{r.engagement}/5</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Engagement</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{r.reaction}</p>
              {r.confusion && (
                <p className="text-xs mt-2 italic" style={{ color: "var(--text-3)" }}>Confusion: {r.confusion}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Click any expert to read their full assessment.
        </p>

        {/* Expert cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {review.personas.map((persona) => {
            const pa = toPersonaAnalysis(review.analyses[persona.id]);
            const summary = extractPersonaSummary(pa.text);
            const confidenceBadge: Record<string, { label: string; style: React.CSSProperties }> = {
              high: { label: "High confidence", style: { backgroundColor: "rgba(242, 169, 59, 0.15)", color: "var(--accent-amber)", border: "1px solid rgba(242, 169, 59, 0.3)" } },
              moderate: { label: "Moderate", style: { backgroundColor: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" } },
              directional: { label: "Directional", style: { backgroundColor: "rgba(100,100,100,0.1)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" } },
            };
            const badge = confidenceBadge[pa.confidence] ?? confidenceBadge.directional;
            return (
              <button
                key={persona.id}
                onClick={() => setOpenPersonaId(persona.id)}
                className="text-left rounded-xl p-5 transition-all group"
                style={{
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.3)";
                  e.currentTarget.style.backgroundColor = "rgba(242, 169, 59, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--bg-1)";
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {persona.emoji && (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{
                          backgroundColor: "var(--panel-elevated)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {persona.emoji}
                      </div>
                    )}
                    <div>
                      <p
                        className="text-sm font-semibold leading-tight"
                        style={{ color: "var(--text-1)" }}
                      >
                        {persona.name}
                      </p>
                      {persona.archetype && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                          {persona.archetype}
                        </p>
                      )}
                    </div>
                  </div>
                  <ExternalLink
                    size={12}
                    className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-3)" }}
                  />
                </div>

                {/* Confidence badge + verdict pill */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                    style={badge.style}
                  >
                    {badge.label}
                  </span>
                  {review.useCase === "review-feature" && pa.recommendation && (() => {
                    const recStyles: Record<string, React.CSSProperties> = {
                      BUILD: { backgroundColor: "rgba(56, 178, 125, 0.15)", color: "rgb(56, 178, 125)", border: "1px solid rgba(56, 178, 125, 0.3)" },
                      DEFER: { backgroundColor: "rgba(242, 169, 59, 0.15)", color: "var(--accent-amber)", border: "1px solid rgba(242, 169, 59, 0.3)" },
                      RECONSIDER: { backgroundColor: "rgba(223, 107, 87, 0.15)", color: "rgb(223, 107, 87)", border: "1px solid rgba(223, 107, 87, 0.3)" },
                    };
                    return (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold" style={recStyles[pa.recommendation] ?? {}}>
                        {pa.recommendation}
                      </span>
                    );
                  })()}
                  {review.useCase === "review-pitch" && pa.pitch_verdict && (() => {
                    const pvStyles: Record<string, React.CSSProperties> = {
                      READY: { backgroundColor: "rgba(56, 178, 125, 0.15)", color: "rgb(56, 178, 125)", border: "1px solid rgba(56, 178, 125, 0.3)" },
                      REVISE: { backgroundColor: "rgba(242, 169, 59, 0.15)", color: "var(--accent-amber)", border: "1px solid rgba(242, 169, 59, 0.3)" },
                      NOT_READY: { backgroundColor: "rgba(223, 107, 87, 0.15)", color: "rgb(223, 107, 87)", border: "1px solid rgba(223, 107, 87, 0.3)" },
                    };
                    const pvLabel: Record<string, string> = { READY: "Ready", REVISE: "Revise", NOT_READY: "Not Ready" };
                    return (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold" style={pvStyles[pa.pitch_verdict] ?? {}}>
                        {pvLabel[pa.pitch_verdict] ?? pa.pitch_verdict}
                      </span>
                    );
                  })()}
                </div>

                {/* Summary */}
                <p
                  className="text-xs leading-relaxed line-clamp-3"
                  style={{ color: "var(--text-3)" }}
                >
                  {summary || "Click to read this expert's full assessment."}
                </p>

                {/* Read more */}
                <p
                  className="text-xs mt-3 font-medium"
                  style={{ color: "var(--accent-amber)" }}
                >
                  Read full review →
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expert analysis modal */}
      {openPersona && (() => {
        const pa = toPersonaAnalysis(review.analyses[openPersona.id]);
        return (
          <Modal
            title={openPersona.name}
            subtitle={openPersona.archetype}
            onClose={() => setOpenPersonaId(null)}
          >
            {pa.text ? (
              <>
                {/* Verdict badge in modal */}
                {review.useCase === "review-feature" && pa.recommendation && (() => {
                  const recMeta: Record<string, { style: React.CSSProperties; label: string }> = {
                    BUILD: { label: "Recommendation: BUILD", style: { backgroundColor: "rgba(56, 178, 125, 0.12)", color: "rgb(56, 178, 125)", border: "1px solid rgba(56, 178, 125, 0.35)" } },
                    DEFER: { label: "Recommendation: DEFER", style: { backgroundColor: "rgba(242, 169, 59, 0.12)", color: "var(--accent-amber)", border: "1px solid rgba(242, 169, 59, 0.35)" } },
                    RECONSIDER: { label: "Recommendation: RECONSIDER", style: { backgroundColor: "rgba(223, 107, 87, 0.12)", color: "rgb(223, 107, 87)", border: "1px solid rgba(223, 107, 87, 0.35)" } },
                  };
                  const m = recMeta[pa.recommendation];
                  return m ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4" style={m.style}>
                      {m.label}
                    </div>
                  ) : null;
                })()}
                {review.useCase === "review-pitch" && pa.pitch_verdict && (() => {
                  const pvMeta: Record<string, { style: React.CSSProperties; label: string }> = {
                    READY: { label: "Verdict: READY FOR THE ROOM", style: { backgroundColor: "rgba(56, 178, 125, 0.12)", color: "rgb(56, 178, 125)", border: "1px solid rgba(56, 178, 125, 0.35)" } },
                    REVISE: { label: "Verdict: REVISE BEFORE PITCHING", style: { backgroundColor: "rgba(242, 169, 59, 0.12)", color: "var(--accent-amber)", border: "1px solid rgba(242, 169, 59, 0.35)" } },
                    NOT_READY: { label: "Verdict: NOT READY", style: { backgroundColor: "rgba(223, 107, 87, 0.12)", color: "rgb(223, 107, 87)", border: "1px solid rgba(223, 107, 87, 0.35)" } },
                  };
                  const m = pvMeta[pa.pitch_verdict];
                  return m ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4" style={m.style}>
                      {m.label}
                    </div>
                  ) : null;
                })()}
                {renderAnalysis(pa.text)}
                {pa.evidence_items.length > 0 && (
                  <div
                    className="mt-5 rounded-lg p-4"
                    style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent-amber)" }}>
                      Evidence
                    </p>
                    <ul className="space-y-1">
                      {pa.evidence_items.map((item, i) => (
                        <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-2)" }}>
                          <span className="opacity-40 flex-shrink-0">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pa.assumptions.length > 0 && (
                  <div
                    className="mt-3 rounded-lg p-4"
                    style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                      Assumptions
                    </p>
                    <ul className="space-y-1">
                      {pa.assumptions.map((item, i) => (
                        <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-3)" }}>
                          <span className="opacity-40 flex-shrink-0">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No analysis available for this expert.
              </p>
            )}
          </Modal>
        );
      })()}

      {/* Pitch-only: Section Analysis + Objections merged in */}
      {review.useCase === "review-pitch" && (
        <>
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <SectionAnalysisTab review={review} />
          </div>
          {onAskPanel && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <ObjectionsPanelTab review={review} onAskPanel={onAskPanel} />
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  View: Panel Select                                                 */
/* ------------------------------------------------------------------ */
function PanelSelectView({
  review,
  onStart,
  onCancel,
}: {
  review: ReviewSession;
  onStart: (selected: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(review.personas.map((p) => p.id));

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold mb-1" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
            Start a Panel
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Select which experts to bring into the panel discussion.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-md transition-colors flex-shrink-0"
          style={{
            border: "1px solid var(--border-subtle)",
            color: "var(--text-3)",
            backgroundColor: "var(--bg-2)",
          }}
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {review.personas.map((persona) => {
          const isSelected = selected.includes(persona.id);
          const summary = extractPersonaSummary(toPersonaAnalysis(review.analyses[persona.id]).text);

          return (
            <button
              key={persona.id}
              onClick={() => toggle(persona.id)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                border: isSelected
                  ? "1px solid rgba(242, 169, 59, 0.4)"
                  : "1px solid var(--border-subtle)",
                backgroundColor: isSelected
                  ? "rgba(242, 169, 59, 0.07)"
                  : "var(--bg-1)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {persona.emoji && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {persona.emoji}
                    </div>
                  )}
                  <div>
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: "var(--text-1)" }}
                    >
                      {persona.name}
                    </p>
                    {persona.archetype && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                        {persona.archetype}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: isSelected ? "none" : "1.5px solid var(--border-strong)",
                    backgroundColor: isSelected ? "var(--accent-amber)" : "transparent",
                  }}
                >
                  {isSelected && <Check size={9} style={{ color: "var(--bg-0)" }} />}
                </div>
              </div>
              {summary && (
                <p
                  className="text-xs leading-relaxed line-clamp-3"
                  style={{ color: "var(--text-3)" }}
                >
                  {summary}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelected(review.personas.map((p) => p.id))}
          className="text-xs"
          style={{ color: "var(--accent-amber)" }}
        >
          Select all
        </button>
        <span style={{ color: "var(--text-3)" }}>·</span>
        <button
          onClick={() => setSelected([])}
          className="text-xs"
          style={{ color: "var(--text-3)" }}
        >
          Deselect all
        </button>
        <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>
          {selected.length} of {review.personas.length} selected
        </span>
      </div>

      <button
        onClick={() => onStart(selected)}
        disabled={selected.length === 0}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors"
        style={{
          backgroundColor:
            selected.length > 0 ? "var(--accent-amber)" : "var(--panel-elevated)",
          color: selected.length > 0 ? "var(--bg-0)" : "var(--text-3)",
          cursor: selected.length > 0 ? "pointer" : "not-allowed",
        }}
      >
        <Play size={13} />
        Start Panel Discussion
        {selected.length > 0 && (
          <span style={{ opacity: 0.7 }}>with {selected.length} experts</span>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View: Panel Chat                                                   */
/* ------------------------------------------------------------------ */
const PANEL_STARTERS = [
  "What is the single biggest risk I should address before moving forward?",
  "Where do you disagree with each other the most?",
  "What would make this a lot stronger?",
  "What should I validate or test first?",
];

/** Render a user message, highlighting @mentions in amber */
function renderUserMessage(text: string): React.ReactNode {
  const parts = text.split(/(@[\w][\w\s]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        key={i}
        className="font-semibold"
        style={{ color: "var(--accent-amber)" }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

function PanelChatView({
  review,
  selectedIds,
  onUpdateSelectedIds,
  onFinalize,
  finalizeTrigger,
  initialMessages = [],
  initialInput = "",
}: {
  review: ReviewSession;
  selectedIds: string[];
  onUpdateSelectedIds: (ids: string[]) => void;
  onFinalize: (messages: ChatMessage[]) => void;
  finalizeTrigger: number;
  initialMessages?: ChatMessage[];
  initialInput?: string;
}) {
  const { getIdToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState(initialInput);
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  // @mention autocomplete
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addPanelRef = useRef<HTMLDivElement>(null);
  const selectedPersonas = review.personas.filter((p) => selectedIds.includes(p.id));
  const availableToAdd = review.personas.filter((p) => !selectedIds.includes(p.id));

  // Close add-panelist dropdown on outside click
  useEffect(() => {
    if (!addPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target as Node)) {
        setAddPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addPanelOpen]);

  // Filtered suggestions while typing @...
  const mentionSuggestions = mentionActive
    ? selectedPersonas.filter((p) =>
        p.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (finalizeTrigger > 0) handleFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizeTrigger]);

  /** Detect @mention context on every keystroke */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;
    setInput(val);

    // Look for @word immediately before cursor (no space allowed inside)
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionActive(true);
      setMentionIndex(0);
    } else {
      setMentionActive(false);
      setMentionQuery("");
    }
  };

  /** Insert selected persona name, replacing the @query fragment */
  const selectMention = (persona: Persona) => {
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const textBeforeCursor = input.slice(0, cursor);
    const atIdx = textBeforeCursor.lastIndexOf("@");
    const before = input.slice(0, atIdx);
    const after = input.slice(cursor);
    const newVal = `${before}@${persona.name} ${after}`;
    setInput(newVal);
    setMentionActive(false);
    setMentionQuery("");
    // Restore focus and move cursor after inserted name
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = atIdx + persona.name.length + 2; // @Name<space>
        textareaRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  const parseTag = (text: string): string | null => {
    const match = text.match(/@([\w][\w\s]*)/);
    if (!match) return null;
    const name = match[1].trim().toLowerCase();
    return (
      selectedPersonas.find(
        (p) =>
          p.name.toLowerCase() === name ||
          p.name.toLowerCase().startsWith(name) ||
          name.startsWith(p.name.toLowerCase().split(" ")[0])
      )?.id ?? null
    );
  };

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setMentionActive(false);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    const taggedId = parseTag(text);

    try {
      const token = await getIdToken();
      const chatHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) chatHeaders["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/founder/chat`, {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          session_id: review.founderSessionId,
          message: text.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to get response.");
      const data = await res.json();

      const allReplies: {
        persona_id: string;
        name: string;
        archetype: string;
        emoji: string;
        color: string;
        text: string;
      }[] = data.replies || [];

      const filtered = taggedId
        ? allReplies.filter((r) => r.persona_id === taggedId)
        : allReplies.filter((r) => selectedIds.includes(r.persona_id));

      const toShow = filtered.length > 0 ? filtered : allReplies.slice(0, 1);

      toShow.forEach((reply, idx) => {
        setTimeout(() => {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: "advisor",
              personaId: reply.persona_id,
              personaName: reply.name,
              personaArchetype: reply.archetype,
              content: reply.text,
              timestamp: new Date(),
            },
          ]);
        }, idx * 700);
      });

      setTimeout(() => setSending(false), toShow.length * 700 + 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setSending(false);
    }
  };

  const handleFinalize = async () => {
    if (finalizing) return;
    setFinalizing(true);
    try {
      const token = await getIdToken();
      const finalHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/founder/chat`, {
        method: "POST",
        headers: finalHeaders,
        body: JSON.stringify({
          session_id: review.founderSessionId,
          message:
            "Please provide your comprehensive final assessment. Cover: (1) your strongest recommendation, (2) the top 2–3 risks to address, (3) the most promising opportunities, and (4) the 3 most important next steps. Be specific and actionable.",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report.");
      const data = await res.json();
      const finalReplies: {
        persona_id: string;
        name: string;
        archetype: string;
        emoji: string;
        text: string;
      }[] = data.replies || [];

      const finalMessages: ChatMessage[] = finalReplies.map((r) => ({
        id: crypto.randomUUID(),
        role: "advisor",
        personaId: r.persona_id,
        personaName: r.name,
        personaArchetype: r.archetype,
        content: r.text,
        timestamp: new Date(),
      }));

      onFinalize([...messages, ...finalMessages]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate report.";
      toast.error(msg);
      setFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 112px)" }}>
      {/* Panel header */}
      <div
        className="py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--panel)",
        }}
      >
        <div className="px-6 sm:px-10 max-w-5xl mx-auto w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {selectedPersonas.map((p) => (
              <div
                key={p.id}
                title={p.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  backgroundColor: "var(--panel-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {p.emoji || p.name[0]}
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            {selectedPersonas.map((p) => p.name.split(" ")[0]).join(", ")} are in the panel
          </span>
          <div className="ml-auto flex items-center gap-3 relative">
            {/* Add panelist button */}
            {availableToAdd.length > 0 && (
              <div className="relative" ref={addPanelRef}>
                <button
                  onClick={() => setAddPanelOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
                  style={{
                    border: "1px solid var(--border-default)",
                    backgroundColor: addPanelOpen ? "var(--panel-elevated)" : "transparent",
                    color: "var(--text-3)",
                  }}
                >
                  <UserPlus size={11} />
                  <span className="hidden sm:inline">Add</span>
                </button>
                {addPanelOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-xl overflow-hidden z-30"
                    style={{
                      border: "1px solid var(--border-strong)",
                      backgroundColor: "var(--bg-2)",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <div
                      className="px-3 py-2"
                      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
                    >
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        Add to panel
                      </p>
                    </div>
                    {availableToAdd.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => {
                          onUpdateSelectedIds([...selectedIds, persona.id]);
                          setAddPanelOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                        style={{ color: "var(--text-1)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(242, 169, 59, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                          style={{
                            backgroundColor: "#1c2633",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {persona.emoji || persona.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-1)" }}>
                            {persona.name}
                          </p>
                          {persona.archetype && (
                            <p className="text-xs" style={{ color: "var(--text-3)" }}>
                              {persona.archetype}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <AtSign size={11} style={{ color: "var(--text-3)" }} />
              <span className="text-xs hidden sm:inline" style={{ color: "var(--text-3)" }}>
                @name to direct a question
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="px-6 sm:px-10 py-6 max-w-5xl mx-auto w-full space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              The panel is ready. Ask anything — or use a starter prompt.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PANEL_STARTERS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left px-4 py-3 rounded-lg text-xs transition-colors"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-1)",
                    color: "var(--text-2)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "advisor" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5 text-sm"
                style={{
                  backgroundColor: "var(--panel-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {review.personas.find((p) => p.id === msg.personaId)?.emoji || "·"}
              </div>
            )}
            <div className="max-w-[72%]">
              {msg.role === "advisor" && (
                <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                  {msg.personaName}
                  {msg.personaArchetype && <span> · {msg.personaArchetype}</span>}
                </p>
              )}
              <div
                className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  backgroundColor:
                    msg.role === "user" ? "rgba(242, 169, 59, 0.14)" : "var(--bg-2)",
                  border:
                    msg.role === "user"
                      ? "1px solid rgba(242, 169, 59, 0.22)"
                      : "1px solid var(--border-subtle)",
                  color: "var(--text-1)",
                }}
              >
                {msg.role === "user"
                  ? renderUserMessage(msg.content)
                  : renderAnalysis(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Loader2
                size={12}
                className="animate-spin"
                style={{ color: "var(--text-3)" }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              Panel is responding…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      </div>

      {/* Input area */}
      <div
        className="py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="px-6 sm:px-10 max-w-5xl mx-auto w-full">
        {/* @mention dropdown — floats above the textarea */}
        <div className="relative">
          {mentionActive && mentionSuggestions.length > 0 && (
            <div
              className="absolute bottom-full mb-1.5 left-0 w-full rounded-xl overflow-hidden z-20"
              style={{
                border: "1px solid rgba(242, 169, 59, 0.25)",
                backgroundColor: "var(--bg-2)",
                boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                className="px-3 py-2"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Panel members
                </p>
              </div>
              {mentionSuggestions.map((persona, idx) => (
                <button
                  key={persona.id}
                  onMouseDown={(e) => {
                    // mousedown fires before blur — prevent losing focus
                    e.preventDefault();
                    selectMention(persona);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor:
                      idx === mentionIndex
                        ? "rgba(242, 169, 59, 0.1)"
                        : "transparent",
                  }}
                  onMouseEnter={() => setMentionIndex(idx)}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      backgroundColor: "#1c2633",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {persona.emoji || persona.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {persona.name}
                    </p>
                    {persona.archetype && (
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        {persona.archetype}
                      </p>
                    )}
                  </div>
                  {idx === mentionIndex && (
                    <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>
                      ↵
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Textarea + send button */}
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the panel… or type @ to mention an expert"
              rows={2}
              className="flex-1 rounded-lg text-sm resize-none transition-colors"
              style={{
                backgroundColor: "var(--bg-2)",
                border: "1px solid var(--border-default)",
                color: "var(--text-1)",
                padding: "0.625rem 0.75rem",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.4)")
              }
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid var(--border-default)";
                // Small delay so onMouseDown on suggestion fires first
                setTimeout(() => setMentionActive(false), 150);
              }}
              onKeyDown={(e) => {
                if (mentionActive && mentionSuggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionIndex((i) => (i + 1) % mentionSuggestions.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionIndex((i) =>
                      i === 0 ? mentionSuggestions.length - 1 : i - 1
                    );
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    selectMention(mentionSuggestions[mentionIndex]);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setMentionActive(false);
                    return;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="px-3 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor:
                  input.trim() && !sending ? "var(--accent-amber)" : "var(--panel-elevated)",
                color:
                  input.trim() && !sending ? "var(--bg-0)" : "var(--text-3)",
                cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          Enter to send · Shift+Enter for new line · @ to mention
        </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View: Final Report                                                 */
/* ------------------------------------------------------------------ */

/** Strip markdown syntax to plain text for PDF */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,3}\s/gm, "")
    .trim();
}

function buildPDFHTML(
  review: ReviewSession,
  verdictLabel: string,
  verdictColor: string,
  overview: ReturnType<typeof deriveOverview>,
  panelMessages: ChatMessage[]
): string {
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const expertRows = review.personas
    .map((p) => {
      const analysis = stripMarkdown(toPersonaAnalysis(review.analyses[p.id]).text || "No analysis available.");
      return `
        <div class="section">
          <div class="expert-header">
            <span class="emoji">${p.emoji || ""}</span>
            <div>
              <div class="expert-name">${p.name}</div>
              ${p.archetype ? `<div class="expert-role">${p.archetype}</div>` : ""}
            </div>
          </div>
          <div class="expert-body">${analysis.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</div>
        </div>`;
    })
    .join("");

  const panelRows = panelMessages
    .map((m) => {
      if (m.role === "user") {
        return `<div class="msg-user"><span class="msg-label">You</span><div class="msg-bubble-user">${m.content}</div></div>`;
      }
      return `<div class="msg-advisor"><span class="msg-label">${m.personaName}${m.personaArchetype ? ` · ${m.personaArchetype}` : ""}</span><div class="msg-bubble-advisor">${stripMarkdown(m.content).replace(/\n/g, "<br/>")}</div></div>`;
    })
    .join("");

  const risks = (overview.risks.length > 0 ? overview.risks : [overview.majorRisk])
    .map((r) => `<li>${r}.</li>`)
    .join("");
  const opps = (overview.opportunities.length > 0 ? overview.opportunities : [overview.majorOpportunity])
    .map((o) => `<li>${o}.</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${review.title} — SocietyOS Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0f0e0c;
    color: #e0dbd4;
    font-size: 13px;
    line-height: 1.65;
    padding: 0;
  }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 40px; }
  /* Header */
  .header { border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 28px; margin-bottom: 32px; }
  .brand { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c8a96a; margin-bottom: 12px; }
  .title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #f0ece6; margin-bottom: 6px; }
  .meta { font-size: 12px; color: #6b6560; }
  /* Verdict */
  .verdict-box { border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; border: 1px solid ${verdictColor}40; background: ${verdictColor}0d; }
  .verdict-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${verdictColor}; margin-bottom: 6px; }
  .verdict-title { font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: #f0ece6; margin-bottom: 8px; }
  .verdict-desc { font-size: 13px; color: #9e9890; }
  /* Section titles */
  .section-title { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6560; margin-bottom: 14px; margin-top: 32px; }
  /* 2-col grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
  .card { background: #181613; border-radius: 10px; padding: 16px 18px; border: 1px solid rgba(255,255,255,0.07); }
  .card-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
  .card-label.risk { color: rgba(200,80,60,0.8); }
  .card-label.opp { color: rgba(80,180,100,0.8); }
  ul.bullets { list-style: none; padding: 0; }
  ul.bullets li { padding-left: 14px; position: relative; color: #9e9890; margin-bottom: 6px; font-size: 12.5px; }
  ul.bullets li::before { content: '·'; position: absolute; left: 0; color: #555; }
  /* Expert */
  .section { background: #181613; border-radius: 10px; padding: 16px 18px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; }
  .expert-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .emoji { font-size: 18px; }
  .expert-name { font-size: 13px; font-weight: 600; color: #e0dbd4; }
  .expert-role { font-size: 11px; color: #6b6560; margin-top: 1px; }
  .expert-body { font-size: 12.5px; color: #9e9890; line-height: 1.65; }
  .expert-body p { margin-bottom: 8px; }
  /* Panel discussion */
  .msg-user { margin-bottom: 14px; }
  .msg-advisor { margin-bottom: 14px; }
  .msg-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6b6560; display: block; margin-bottom: 5px; }
  .msg-bubble-user { background: rgba(200,169,106,0.1); border: 1px solid rgba(200,169,106,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; color: #d4cfc8; }
  .msg-bubble-advisor { background: #181613; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; color: #9e9890; }
  /* Next steps */
  .steps { list-style: none; padding: 0; }
  .steps li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .step-num { background: rgba(200,169,106,0.15); color: #c8a96a; font-size: 11px; font-weight: 700; border-radius: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .steps li span { font-size: 12.5px; color: #9e9890; }
  /* Footer */
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.07); font-size: 11px; color: #3d3a36; display: flex; justify-content: space-between; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px 32px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">SocietyOS — Decision Lab</div>
    <div class="title">${review.title}</div>
    <div class="meta">${USE_CASE_LABEL(review.useCase)} &nbsp;·&nbsp; ${review.personas.length} expert lenses &nbsp;·&nbsp; ${date}</div>
  </div>

  <div class="verdict-box">
    <div class="verdict-label">Recommendation</div>
    <div class="verdict-title">${verdictLabel}</div>
    <div class="verdict-desc">Based on independent assessments from ${review.personas.length} expert lenses${panelMessages.length > 0 ? " and a live panel discussion" : ""}. This reflects the balance of evidence across all perspectives.</div>
  </div>

  <div class="section-title">Key Findings</div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label risk">Key Risks</div>
      <ul class="bullets">${risks}</ul>
    </div>
    <div class="card">
      <div class="card-label opp">Key Opportunities</div>
      <ul class="bullets">${opps}</ul>
    </div>
  </div>

  <div class="section-title">Expert Assessments</div>
  ${expertRows}

  ${panelMessages.length > 0 ? `
  <div class="section-title">Panel Discussion</div>
  ${panelRows}
  ` : ""}

  <div class="section-title">Suggested Next Steps</div>
  <ul class="steps">
    <li><div class="step-num">1</div><span>Pressure-test your key assumption with 5–10 real user conversations.</span></li>
    <li><div class="step-num">2</div><span>Define the one metric that would confirm product-market fit.</span></li>
    <li><div class="step-num">3</div><span>Identify your riskiest hypothesis and design a test to invalidate it.</span></li>
  </ul>

  <div class="footer">
    <span>Generated by SocietyOS</span>
    <span>${date}</span>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

function buildArtifactHTML(artifact: Artifact): string {
  const date = new Date(artifact.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function processInline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[GROUNDED\]/g, '<span class="tag tag-grounded">GROUNDED</span>')
      .replace(/\[INFERENCE\]/g, '<span class="tag tag-inference">INFERENCE</span>')
      .replace(/\[ASSUMPTION\]/g, '<span class="tag tag-assumption">ASSUMPTION</span>')
      .replace(/\[HIGH-RISK\]/g, '<span class="tag tag-high">HIGH-RISK</span>')
      .replace(/\[MEDIUM-RISK\]/g, '<span class="tag tag-medium">MEDIUM-RISK</span>')
      .replace(/\[LOW-RISK\]/g, '<span class="tag tag-low">LOW-RISK</span>');
  }

  const lines = artifact.content.split("\n");
  const parts: string[] = [];
  let ulBuf: string[] = [];
  let olBuf: string[] = [];

  function flushUL() {
    if (ulBuf.length > 0) { parts.push(`<ul class="alist">${ulBuf.join("")}</ul>`); ulBuf = []; }
  }
  function flushOL() {
    if (olBuf.length > 0) { parts.push(`<ol class="alist">${olBuf.join("")}</ol>`); olBuf = []; }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s/.test(line)) {
      flushUL(); flushOL();
      parts.push(`<h2 class="section-h2">${processInline(line.replace(/^##\s/, ""))}</h2>`);
    } else if (/^###\s/.test(line)) {
      flushUL(); flushOL();
      parts.push(`<h3 class="section-h3">${processInline(line.replace(/^###\s/, ""))}</h3>`);
    } else if (/^[-*]\s/.test(line)) {
      flushOL();
      ulBuf.push(`<li>${processInline(line.replace(/^[-*]\s/, ""))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      flushUL();
      olBuf.push(`<li>${processInline(line.replace(/^\d+\.\s/, ""))}</li>`);
    } else if (line === "") {
      flushUL(); flushOL();
      parts.push("<br/>");
    } else {
      flushUL(); flushOL();
      parts.push(`<p>${processInline(line)}</p>`);
    }
  }
  flushUL(); flushOL();

  const bodyHTML = parts.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${artifact.title} — SocietyOS</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0f0e0c; color: #e0dbd4; font-size: 13px; line-height: 1.65; }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 40px; }
  .header { border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 28px; }
  .brand { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c8a96a; margin-bottom: 10px; }
  .title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #f0ece6; margin-bottom: 6px; }
  .meta { font-size: 12px; color: #6b6560; }
  h2.section-h2 { font-size: 15px; font-weight: 700; color: #f0ece6; margin-top: 24px; margin-bottom: 10px; letter-spacing: -0.01em; border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 6px; }
  h3.section-h3 { font-size: 13px; font-weight: 600; color: #c8a96a; margin-top: 18px; margin-bottom: 7px; }
  p { font-size: 13px; color: #9e9890; margin-bottom: 8px; }
  ul.alist { list-style: none; padding: 0; margin-bottom: 12px; }
  ul.alist li { padding-left: 14px; position: relative; color: #9e9890; margin-bottom: 5px; font-size: 12.5px; }
  ul.alist li::before { content: '·'; position: absolute; left: 0; color: #555; }
  ol.alist { padding-left: 20px; margin-bottom: 12px; }
  ol.alist li { color: #9e9890; margin-bottom: 5px; font-size: 12.5px; }
  strong { color: #e0dbd4; font-weight: 600; }
  .tag { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 1px 5px; border-radius: 4px; vertical-align: middle; }
  .tag-grounded { background: rgba(56,178,125,0.15); color: #38b27d; border: 1px solid rgba(56,178,125,0.3); }
  .tag-inference { background: rgba(99,148,210,0.15); color: #6394d2; border: 1px solid rgba(99,148,210,0.3); }
  .tag-assumption { background: rgba(242,169,59,0.12); color: #c8a96a; border: 1px solid rgba(242,169,59,0.25); }
  .tag-high { background: rgba(223,107,87,0.15); color: #df6b57; border: 1px solid rgba(223,107,87,0.3); }
  .tag-medium { background: rgba(242,169,59,0.12); color: #f2a93b; border: 1px solid rgba(242,169,59,0.25); }
  .tag-low { background: rgba(56,178,125,0.12); color: #5bbf8c; border: 1px solid rgba(56,178,125,0.25); }
  .footer { margin-top: 48px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.07); font-size: 11px; color: #3d3a36; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 32px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">SocietyOS — Artifact</div>
    <div class="title">${artifact.title}</div>
    <div class="meta">Generated ${date}</div>
  </div>
  <div class="body">${bodyHTML}</div>
  <div class="footer">
    <span>Generated by SocietyOS</span>
    <span>${date}</span>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

function ArtifactFullView({
  artifact,
  onBack,
}: {
  artifact: Artifact;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = () => {
    const html = buildArtifactHTML(artifact);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.focus();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const date = new Date(artifact.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Sticky header */}
      <div
        className="flex items-center justify-between gap-4 mb-6 pb-5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-medium transition-colors flex-shrink-0 hover:opacity-80"
            style={{ color: "var(--text-3)" }}
          >
            <ChevronLeft size={14} />
            Artifacts
          </button>
          <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "var(--border-subtle)" }} />
          <div className="min-w-0">
            <p className="text-base font-semibold truncate" style={{ color: "var(--text-1)" }}>
              {artifact.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Generated {date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-2)",
              color: "var(--text-2)",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
          >
            <Download size={11} />
            Save PDF
          </button>
        </div>
      </div>

      {/* Rich content */}
      <div
        className="rounded-2xl p-7"
        style={{
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-1)",
        }}
      >
        {renderRichMarkdown(artifact.content)}
      </div>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-2)",
            color: "var(--text-2)",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
        >
          <Download size={11} />
          Save PDF
        </button>
      </div>
    </div>
  );
}

function FinalReportView({
  review,
  panelMessages,
}: {
  review: ReviewSession;
  panelMessages: ChatMessage[];
}) {
  const { getIdToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [openExpertId, setOpenExpertId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(review.shareToken ?? null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async () => {
    if (shareToken) { setShowShareModal(true); return; }
    setSharing(true);
    try {
      const token = await getIdToken();
      if (!token) { toast.error("Sign in to share."); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/reviews/${review.id}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json() as { share_token: string };
      setShareToken(json.share_token);
      setShowShareModal(true);
    } catch {
      toast.error("Failed to generate share link.");
    } finally {
      setSharing(false);
    }
  };
  const overview = deriveOverview(review.analyses);

  const verdictConfig = {
    proceed: { label: "Proceed", color: "#38b27d" },
    revise: { label: "Revise & Validate", color: "#f2a93b" },
    stop: { label: "Do Not Proceed", color: "#df6b57" },
  }[overview.verdict];

  const openExpert = openExpertId
    ? review.personas.find((p) => p.id === openExpertId)
    : null;

  const handleCopy = () => {
    const lines = [
      `Review: ${review.title}`,
      `Use case: ${USE_CASE_LABEL(review.useCase)}`,
      `Verdict: ${verdictConfig.label}`,
      "",
      "--- EXPERT ANALYSES ---",
      ...review.personas.map((p) => {
        const a = toPersonaAnalysis(review.analyses[p.id]).text;
        return `\n${p.name} (${p.archetype || ""}):\n${stripMarkdown(a)}`;
      }),
      ...(panelMessages.length > 0
        ? [
            "",
            "--- PANEL DISCUSSION ---",
            ...panelMessages.map((m) =>
              m.role === "user"
                ? `\nYou: ${m.content}`
                : `\n${m.personaName}: ${stripMarkdown(m.content)}`
            ),
          ]
        : []),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = () => {
    const html = buildPDFHTML(
      review,
      verdictConfig.label,
      verdictConfig.color,
      overview,
      panelMessages
    );
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("afterprint", () => URL.revokeObjectURL(url));
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} style={{ color: "var(--accent-amber)" }} />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--accent-amber)" }}
              >
                Final Report
              </span>
            </div>
            <h2 className="font-bold" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
              {review.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              {USE_CASE_LABEL(review.useCase)} · {review.personas.length} expert lenses ·{" "}
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--accent-amber)",
                color: "var(--bg-0)",
              }}
            >
              <Download size={12} />
              PDF
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Verdict — full width */}
        <div
          className="rounded-xl p-6"
          style={{
            border: `1px solid ${verdictConfig.color}30`,
            backgroundColor: `${verdictConfig.color}08`,
          }}
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: verdictConfig.color }}
          >
            Recommendation
          </p>
          <p
            className="text-2xl font-bold mb-3"
            style={{ letterSpacing: "-0.025em", color: "var(--text-1)" }}
          >
            {verdictConfig.label}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Based on independent assessments from {review.personas.length} expert lenses
            {panelMessages.length > 0 ? " and a live panel discussion" : ""}. This
            recommendation reflects the balance of evidence and expert debate.
          </p>
        </div>

        {/* Risk + Opportunity — 2-col full width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(223, 107, 87, 0.18)",
              backgroundColor: "var(--bg-1)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(223, 107, 87, 0.8)" }}
            >
              Key Risks
            </p>
            <ul className="space-y-2">
              {(overview.risks.length > 0 ? overview.risks : [overview.majorRisk]).map(
                (r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: "rgba(223, 107, 87, 0.6)" }}
                    />
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-2)" }}
                    >
                      {r}.
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(56, 178, 125, 0.18)",
              backgroundColor: "var(--bg-1)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(56, 178, 125, 0.8)" }}
            >
              Key Opportunities
            </p>
            <ul className="space-y-2">
              {(overview.opportunities.length > 0
                ? overview.opportunities
                : [overview.majorOpportunity]
              ).map((o, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: "rgba(56, 178, 125, 0.6)" }}
                  />
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-2)" }}
                  >
                    {o}.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Expert assessments — grid */}
        <div>
          <h3
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "var(--text-3)" }}
          >
            Expert assessments
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {review.personas.map((persona) => {
              const summary = extractPersonaSummary(toPersonaAnalysis(review.analyses[persona.id]).text);
              return (
                <div
                  key={persona.id}
                  className="rounded-xl p-4"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-1)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {persona.emoji && <span>{persona.emoji}</span>}
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-1)" }}
                      >
                        {persona.name}
                      </span>
                      {persona.archetype && (
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>
                          {persona.archetype}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setOpenExpertId(persona.id)}
                      className="flex items-center gap-1 text-xs flex-shrink-0 transition-colors"
                      style={{ color: "var(--accent-amber)" }}
                    >
                      <ExternalLink size={10} />
                      Full
                    </button>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-2)" }}
                  >
                    {summary || "Click Full to read this expert's assessment."}
                    {summary.length >= 280 ? "…" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel discussion — full conversation */}
        {panelMessages.length > 0 && (
          <div>
            <h3
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: "var(--text-3)" }}
            >
              Panel discussion
            </h3>
            <div className="space-y-3">
              {panelMessages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%]">
                        <p
                          className="text-xs mb-1 text-right"
                          style={{ color: "var(--text-3)" }}
                        >
                          You
                        </p>
                        <div
                          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                          style={{
                            backgroundColor: "rgba(242, 169, 59, 0.12)",
                            border: "1px solid rgba(242, 169, 59, 0.2)",
                            color: "var(--text-1)",
                          }}
                        >
                          {renderUserMessage(msg.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                        style={{
                          backgroundColor: "var(--panel-elevated)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {review.personas.find((p) => p.id === msg.personaId)?.emoji || "·"}
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                          {msg.personaName}
                          {msg.personaArchetype && (
                            <span> · {msg.personaArchetype}</span>
                          )}
                        </p>
                        <div
                          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                          style={{
                            backgroundColor: "var(--bg-2)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-2)",
                          }}
                        >
                          {renderAnalysis(msg.content)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div
          className="rounded-xl p-5"
          style={{
            border: "1px solid rgba(242, 169, 59, 0.2)",
            backgroundColor: "rgba(242, 169, 59, 0.05)",
          }}
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "var(--accent-amber)" }}
          >
            Suggested next steps
          </p>
          <ul className="space-y-3">
            {[
              "Pressure-test your key assumption with 5–10 real user conversations",
              "Define the one metric that would confirm product-market fit",
              "Identify your riskiest hypothesis and design a test to invalidate it",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: "rgba(242, 169, 59, 0.15)",
                    color: "var(--accent-amber)",
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-3 pt-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
          >
            <Download size={13} />
            Download PDF
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-2)",
              color: "var(--text-2)",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy text"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-2)",
              color: "var(--text-2)",
            }}
          >
            {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
            Share
          </button>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && shareToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6 space-y-4"
            style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-default)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Share this review</h3>
              <button onClick={() => setShowShareModal(false)} style={{ color: "var(--text-3)" }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Anyone with this link can view the review — no sign-in required.
            </p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="text-xs flex-1 truncate" style={{ color: "var(--text-2)" }}>
                {typeof window !== "undefined" ? `${window.location.origin}/share/${shareToken}` : `/share/${shareToken}`}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
                  toast.success("Link copied.");
                }}
                className="text-xs px-2.5 py-1 rounded flex-shrink-0"
                style={{ background: "var(--accent-amber)", color: "#000", fontWeight: 600 }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expert full analysis modal */}
      {openExpert && (
        <Modal
          title={openExpert.name}
          subtitle={openExpert.archetype}
          onClose={() => setOpenExpertId(null)}
        >
          {(() => {
            const pa = toPersonaAnalysis(review.analyses[openExpert.id]);
            return pa.text ? renderAnalysis(pa.text) : (
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No analysis available for this expert.
              </p>
            );
          })()}
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Research Pack                                                 */
/* ------------------------------------------------------------------ */

function Section({
  label,
  accent = "var(--text-2)",
  children,
}: {
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: accent, marginBottom: "10px" }}
      >
        {label}
      </p>
      <div style={{ height: "1px", backgroundColor: "var(--border-default)", marginBottom: "14px" }} />
      {children}
    </div>
  );
}

function ResearchPackTab({ review }: { review: ReviewSession }) {
  const data = review.researchPackData;
  const labels = getResearchPackLabels(review.useCase);

  // Rich structured view
  if (data) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>
            Research Pack
          </p>
          <h2 className="font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
            {review.title}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Background research compiled before expert review.
          </p>
        </div>

        {/* Market Overview */}
        {data.market_overview && (
          <Section label={labels.market_overview}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {data.market_overview}
            </p>
          </Section>
        )}

        {/* Competitors */}
        {data.competitors.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-2)", marginBottom: "10px" }}>
              {labels.competitors}
            </p>
            <div style={{ height: "1px", backgroundColor: "var(--border-default)", marginBottom: "14px" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {c.name}
                    </p>
                    {c.domain && (
                      <a
                        href={`https://${c.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs flex-shrink-0 transition-opacity hover:opacity-80"
                        style={{ color: "var(--text-3)" }}
                      >
                        <ExternalLink size={10} />
                        {c.domain}
                      </a>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {c.description}
                    </p>
                  )}
                  {(c.strength || c.weakness) && (
                    <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "10px 0" }} />
                  )}
                  <div className="space-y-1.5">
                    {c.strength && (
                      <div className="flex items-start gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: "rgba(56, 178, 125, 0.7)" }}
                        />
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                          <span style={{ color: "rgba(56, 178, 125, 0.9)" }}>Strength: </span>
                          {c.strength}
                        </p>
                      </div>
                    )}
                    {c.weakness && (
                      <div className="flex items-start gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: "rgba(223, 107, 87, 0.6)" }}
                        />
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                          <span style={{ color: "rgba(223, 107, 87, 0.8)" }}>Gap: </span>
                          {c.weakness}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Customer + Business Model side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.target_customer && (
            <Section label={labels.target_customer}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                {data.target_customer}
              </p>
            </Section>
          )}
          {data.business_model && (
            <Section label={labels.business_model}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                {data.business_model}
              </p>
            </Section>
          )}
        </div>

        {/* Risks + Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.top_risks.length > 0 && (
            <Section label={labels.top_risks} accent="rgba(223, 107, 87, 0.7)">
              <ul className="space-y-2">
                {data.top_risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "rgba(223, 107, 87, 0.55)" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{r}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {data.top_opportunities.length > 0 && (
            <Section label={labels.top_opportunities} accent="rgba(56, 178, 125, 0.8)">
              <ul className="space-y-2">
                {data.top_opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "rgba(56, 178, 125, 0.55)" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{o}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Strategic Questions */}
        {data.strategic_questions.length > 0 && (
          <Section label={labels.strategic_questions}>
            <ol className="space-y-2">
              {data.strategic_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(242, 169, 59, 0.12)", color: "var(--accent-amber)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{q}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    );
  }

  // Legacy fallback — plain markdown text
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>
          Research Pack
        </p>
        <h2 className="font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
          {review.title}
        </h2>
      </div>
      {review.researchPack ? (
        <div
          className="rounded-xl p-6"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          {renderAnalysis(review.researchPack)}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>No research pack available.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Artifacts                                                     */
/* ------------------------------------------------------------------ */
const ARTIFACT_DEFS = [
  {
    type: "gtm-strategy",
    title: "Go-to-Market Strategy",
    description: "ICP, positioning, channels, launch sequence, key assumptions, and success metrics.",
    icon: Target,
  },
  {
    type: "next-steps-30d",
    title: "30-Day Next Steps",
    description: "What to test first, what to build now, what to delay. Week-by-week action plan.",
    icon: Calendar,
  },
  {
    type: "pitch-draft",
    title: "Pitch Draft",
    description: "Problem, solution, market, differentiation, business model, risks, and ask.",
    icon: Map,
  },
  {
    type: "customer-validation-plan",
    title: "Customer Validation Plan",
    description: "Who to interview, assumptions to test, interview script, decision signals.",
    icon: Users,
  },
  {
    type: "messaging-strategy",
    title: "Messaging Strategy",
    description: "Value proposition, message pillars, objections, headlines, and narrative framing.",
    icon: MessageSquare,
  },
] as const;

const FEATURE_ARTIFACT_DEFS = [
  {
    type: "feature-decision-memo",
    title: "Feature Decision Memo",
    description: "Structured decision document covering user need, strategic fit, scope, risks, and recommendation.",
    icon: FileText,
  },
  {
    type: "scope-recommendation",
    title: "Scope Recommendation",
    description: "MVP vs. full scope analysis with phasing guidance, cut candidates, and success thresholds.",
    icon: Map,
  },
  {
    type: "experiment-plan",
    title: "Experiment Plan",
    description: "Hypothesis, metrics, test design, sample size, timeline, and pass/fail criteria.",
    icon: Zap,
  },
  {
    type: "rollout-plan",
    title: "Rollout Plan",
    description: "Phased release strategy, rollout gates, flag configuration, and communication plan.",
    icon: Calendar,
  },
  {
    type: "success-metrics-plan",
    title: "Success Metrics Plan",
    description: "North star metric, leading indicators, guardrail metrics, measurement approach, and review cadence.",
    icon: Target,
  },
  {
    type: "stakeholder-brief",
    title: "Stakeholder Brief",
    description: "Executive summary of the feature decision, rationale, expected impact, and next steps.",
    icon: Users,
  },
];

const PITCH_ARTIFACT_DEFS = [
  {
    type: "refined-pitch",
    title: "Refined Pitch",
    description: "Rewrites your pitch with stronger structure, cleaner narrative, and active voice. Same facts, better packaging.",
    icon: FileText,
  },
  {
    type: "investor-faq",
    title: "Investor FAQ",
    description: "The 12 hardest investor questions you'll face, with honest founder answers and flagged data gaps.",
    icon: MessageSquare,
  },
  {
    type: "one-pager",
    title: "One-Pager",
    description: "Single-page distribution summary for follow-up emails, warm intros, and pre-meeting context.",
    icon: Map,
  },
  {
    type: "exec-summary",
    title: "Executive Summary",
    description: "Concise executive summary covering the opportunity, why now, the team, and the ask.",
    icon: Target,
  },
];

/* ------------------------------------------------------------------ */
/*  Tab: Section Analysis (Pitch only)                                 */
/* ------------------------------------------------------------------ */
const DEFAULT_PITCH_SECTIONS = ["Problem", "Solution", "Market", "Traction", "Ask"];

function SectionAnalysisTab({ review }: { review: ReviewSession }) {
  const sections =
    review.pitchSections && review.pitchSections.length > 0
      ? review.pitchSections
      : DEFAULT_PITCH_SECTIONS;

  const allAnalyses = review.personas
    .map((p) => ({ personaName: p.name, text: toPersonaAnalysis(review.analyses[p.id]).text }))
    .filter((a) => a.text);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>
          Section Analysis
        </p>
        <h2 className="font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
          {review.title}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Per-section expert feedback derived from advisory panel assessments.
        </p>
      </div>

      {sections.map((section) => {
        const sectionLower = section.toLowerCase();
        const relevantSentences: { text: string; personaName: string; isPositive: boolean }[] = [];

        for (const { personaName, text } of allAnalyses) {
          const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(sectionLower)) {
              const isPositive = /strong|clear|compelling|solid|well|excellent|effective/i.test(sentence);
              relevantSentences.push({ text: sentence.trim(), personaName, isPositive });
            }
          }
        }

        const positiveCount = relevantSentences.filter((s) => s.isPositive).length;
        const totalCount = relevantSentences.length;
        const strengthScore = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 50;
        const strengthLabel = strengthScore >= 70 ? "Strong" : strengthScore >= 40 ? "Moderate" : "Needs Work";
        const strengthColor =
          strengthScore >= 70 ? "rgb(56, 178, 125)" : strengthScore >= 40 ? "var(--accent-amber)" : "rgb(223, 107, 87)";

        const displaySentences = relevantSentences.slice(0, 3);
        const critiqueSentence = relevantSentences.find((s) =>
          /improve|revise|strengthen|clarify|add|missing|weak|unclear|consider/i.test(s.text)
        );

        return (
          <div
            key={section}
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
                {section}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: `${strengthColor}20`,
                  color: strengthColor,
                  border: `1px solid ${strengthColor}40`,
                }}
              >
                {strengthLabel}
              </span>
            </div>

            {displaySentences.length > 0 ? (
              <div className="space-y-2 mb-3">
                {displaySentences.map((s, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--text-3)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {s.text}{" "}
                      <span style={{ color: "var(--text-3)" }}>— {s.personaName}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
                No specific feedback for this section found in the panel analysis.
              </p>
            )}

            {critiqueSentence && (
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: "rgba(242, 169, 59, 0.06)", border: "1px solid rgba(242, 169, 59, 0.2)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-amber)" }}>
                  Key Improvement
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {critiqueSentence.text}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Objections Panel (Pitch only)                                 */
/* ------------------------------------------------------------------ */
function ObjectionsPanelTab({
  review,
  onAskPanel,
}: {
  review: ReviewSession;
  onAskPanel: (text: string) => void;
}) {
  const allAnalyses = review.personas
    .map((p) => ({ personaName: p.name, text: toPersonaAnalysis(review.analyses[p.id]).text }))
    .filter((a) => a.text);

  const objections: { text: string; personaName: string; counter?: string }[] = [];
  for (const { personaName, text } of allAnalyses) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (
        sentence.length > 30 &&
        /will ask|concern|challenge|risk|weak|why|how will|what about|but |however|unclear/i.test(sentence)
      ) {
        const next = sentences[i + 1];
        objections.push({
          text: sentence.trim(),
          personaName,
          counter: next && next.length > 20 ? next.trim() : undefined,
        });
      }
    }
  }

  const unique = objections.slice(0, 8);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>
          Objections Panel
        </p>
        <h2 className="font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
          Anticipated Investor Questions
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Hard questions and objections your advisory panel expects in the room.
        </p>
      </div>

      {unique.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          No objections detected in the panel analysis.
        </p>
      )}

      <div className="space-y-3">
        {unique.map((obj, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <p className="text-sm leading-relaxed mb-1" style={{ color: "var(--text-1)" }}>
              {obj.text}
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
              — {obj.personaName}
            </p>
            {obj.counter && (
              <div
                className="rounded-lg p-3 mb-3"
                style={{ backgroundColor: "rgba(56, 178, 125, 0.06)", border: "1px solid rgba(56, 178, 125, 0.2)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "rgb(56, 178, 125)" }}>
                  Suggested Context
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {obj.counter}
                </p>
              </div>
            )}
            <button
              onClick={() => onAskPanel(`Help me address this objection: "${obj.text}"`)}
              className="text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--accent-amber)" }}
            >
              Ask the panel about this →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactsTab({
  reviewId,
  review,
  artifacts,
  onArtifactGenerated,
  onViewFinalReport,
  hasFinalReport,
  onViewArtifact,
}: {
  reviewId: string;
  review: ReviewSession;
  artifacts: Artifact[];
  onArtifactGenerated: (artifact: Artifact) => void;
  onViewFinalReport: () => void;
  hasFinalReport: boolean;
  onViewArtifact: (artifact: Artifact) => void;
}) {
  const { getIdToken } = useAuth();
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const artifactDefs =
    review.useCase === "review-feature" ? FEATURE_ARTIFACT_DEFS :
    review.useCase === "review-pitch" ? PITCH_ARTIFACT_DEFS :
    ARTIFACT_DEFS;

  // Keyed by type → latest artifact of that type
  const latestByType: Record<string, Artifact> = {};
  for (const a of artifacts) {
    const existing = latestByType[a.type];
    if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
      latestByType[a.type] = a;
    }
  }

  const generate = async (artifactType: string) => {
    setGeneratingType(artifactType);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/artifacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ artifact_type: artifactType }),
      });
      if (!res.ok) throw new Error("Generation failed.");
      const data = await res.json();
      onArtifactGenerated(data.artifact);
      toast.success(`${data.artifact.title} generated`);
    } catch {
      toast.error("Failed to generate artifact. Please try again.");
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Final Report special card */}
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--text-3)" }}
          >
            Final Report
          </p>
          <div
            className="rounded-xl p-5 flex items-center justify-between gap-4"
            style={{
              border: "1px solid rgba(242, 169, 59, 0.2)",
              backgroundColor: "rgba(242, 169, 59, 0.05)",
            }}
          >
            <div className="flex items-start gap-3">
              <Sparkles size={15} style={{ color: "var(--accent-amber)", marginTop: 2 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  Final Report
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  Expert assessments and panel discussion synthesized into a shareable report.
                </p>
              </div>
            </div>
            {hasFinalReport ? (
              <button
                onClick={onViewFinalReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
                style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
              >
                <ExternalLink size={11} />
                View
              </button>
            ) : (
              <button
                onClick={onViewFinalReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors"
                style={{
                  border: "1px solid rgba(242, 169, 59, 0.3)",
                  backgroundColor: "transparent",
                  color: "var(--accent-amber)",
                }}
              >
                <Play size={11} />
                Generate
              </button>
            )}
          </div>
        </div>

        {/* Generated artifacts */}
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--text-3)" }}
          >
            Generated from latest run
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {artifactDefs.map((def) => {
              const existing = latestByType[def.type];
              const isGenerating = generatingType === def.type;
              const Icon = def.icon;
              return (
                <div
                  key={def.type}
                  className="rounded-xl p-5 flex flex-col gap-3"
                  style={{
                    border: existing
                      ? "1px solid rgba(242, 169, 59, 0.2)"
                      : "1px solid var(--border-subtle)",
                    backgroundColor: existing
                      ? "rgba(242, 169, 59, 0.04)"
                      : "var(--bg-1)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--panel-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <Icon size={14} style={{ color: existing ? "var(--accent-amber)" : "var(--text-3)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                        {def.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-3)" }}>
                        {def.description}
                      </p>
                    </div>
                  </div>

                  {existing && (
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      Generated{" "}
                      {new Date(existing.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    {existing && (
                      <button
                        onClick={() => onViewArtifact(existing)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: "var(--accent-amber)",
                          color: "var(--bg-0)",
                        }}
                      >
                        <ExternalLink size={10} />
                        Open
                      </button>
                    )}
                    <button
                      onClick={() => generate(def.type)}
                      disabled={!!isGenerating || generatingType !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        border: "1px solid var(--border-default)",
                        backgroundColor: "var(--bg-2)",
                        color:
                          isGenerating || generatingType !== null
                            ? "var(--text-3)"
                            : "var(--text-2)",
                        cursor: generatingType !== null ? "not-allowed" : "pointer",
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={10} className="animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          {existing ? <RotateCcw size={10} /> : <Plus size={10} />}
                          {existing ? "Regenerate" : "Generate"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: History                                                       */
/* ------------------------------------------------------------------ */
function HistoryTab({
  review,
  runs,
  onStartIteration,
}: {
  review: ReviewSession;
  runs: Run[];
  onStartIteration: () => void;
}) {
  const hasRuns = runs.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-1"
            style={{ color: "var(--text-3)" }}
          >
            Run History
          </p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Each iteration creates a new run. Previous runs are preserved here for reference.
          </p>
        </div>
        <button
          onClick={onStartIteration}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
          style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
        >
          <Plus size={11} />
          New Iteration
        </button>
      </div>

      {/* Current run */}
      <div>
        <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
          Current run · #{runs.length + 1}
        </p>
        <div
          className="rounded-xl p-5"
          style={{
            border: "1px solid rgba(242, 169, 59, 0.25)",
            backgroundColor: "rgba(242, 169, 59, 0.05)",
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {review.iterationLabel || "Initial run"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {review.updatedAt
                  ? new Date(review.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })
                  : review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: "rgba(242, 169, 59, 0.15)",
                color: "var(--accent-amber)",
              }}
            >
              Active
            </span>
          </div>

          {review.idea && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {review.idea.slice(0, 200)}{review.idea.length > 200 ? "…" : ""}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-3">
            {review.industry && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                Industry: <strong style={{ color: "var(--text-2)" }}>{review.industry}</strong>
              </span>
            )}
            {review.stage && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                Stage: <strong style={{ color: "var(--text-2)" }}>{review.stage}</strong>
              </span>
            )}
            {review.targetMarket && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                Market: <strong style={{ color: "var(--text-2)" }}>{review.targetMarket}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Past runs */}
      {hasRuns && (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
            Previous iterations
          </p>
          <div className="space-y-2">
            {[...runs].reverse().map((run, i) => (
              <div
                key={run.id}
                className="rounded-xl p-4"
                style={{
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-1)",
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                    {run.label || `Run #${runs.length - i}`}
                  </p>
                  <p className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                    {run.created_at
                      ? new Date(run.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                {run.idea && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                    {run.idea.slice(0, 160)}{run.idea.length > 160 ? "…" : ""}
                  </p>
                )}
                {run.input_snapshot && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {run.input_snapshot.industry && (
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        {run.input_snapshot.industry}
                      </span>
                    )}
                    {run.input_snapshot.stage && (
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        {run.input_snapshot.stage}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasRuns && (
        <div
          className="rounded-xl p-6 text-center"
          style={{ border: "1px solid rgba(255, 255, 255, 0.06)", backgroundColor: "var(--bg-1)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text-3)" }}>
            No previous iterations yet.
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
            Start a new iteration to refine your idea without losing the current run.
          </p>
          <button
            onClick={onStartIteration}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold mx-auto transition-colors"
            style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
          >
            <RotateCcw size={13} />
            Start New Iteration
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New Iteration Modal                                                */
/* ------------------------------------------------------------------ */
function NewIterationModal({
  review,
  reviewId,
  onClose,
  onComplete,
}: {
  review: ReviewSession;
  reviewId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { getIdToken } = useAuth();
  const [idea, setIdea] = useState(review.idea || "");
  const [industry, setIndustry] = useState(review.industry || "");
  const [stage, setStage] = useState(review.stage || "idea");
  const [targetMarket, setTargetMarket] = useState(review.targetMarket || "");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldStyle = {
    backgroundColor: "var(--bg-2)",
    border: "1px solid var(--border-default)",
    color: "var(--text-1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.625rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
    marginBottom: "0.375rem",
    color: "var(--text-3)",
  };

  const submit = async () => {
    if (!idea.trim() || idea.trim().length < 20) {
      toast.error("Idea must be at least 20 characters.");
      return;
    }
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/iterations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          idea: idea.trim(),
          industry: industry.trim() || null,
          stage: stage || null,
          target_market: targetMarket.trim() || null,
          label: label.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Iteration failed.");
      toast.success("New iteration created. Workspace updated.");
      onComplete();
    } catch {
      toast.error("Failed to create iteration. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Modal
      title="New Iteration"
      subtitle="Refine your idea and rerun the full analysis. The current run will be preserved in History."
      onClose={loading ? () => {} : onClose}
    >
      <div className="space-y-4">
        <div
          className="rounded-lg px-4 py-3 text-xs"
          style={{
            backgroundColor: "rgba(242, 169, 59, 0.08)",
            border: "1px solid rgba(242, 169, 59, 0.15)",
            color: "var(--text-2)",
            lineHeight: 1.6,
          }}
        >
          Changing the idea or context will create a new run. Your previous analyses, panel discussion,
          and artifacts are preserved in History.
        </div>

        <div>
          <label style={labelStyle}>Updated idea *</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid var(--border-default)")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.4)")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid var(--border-default)")}
            />
          </div>
          <div>
            <label style={labelStyle}>Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Target market</label>
          <input
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid var(--border-default)")}
          />
        </div>

        <div>
          <label style={labelStyle}>Label for this run (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Revised ICP, New pricing model, Pivot to SMB…"
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(242, 169, 59, 0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid var(--border-default)")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-2)",
              color: "var(--text-3)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || idea.trim().length < 20}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor:
                loading || idea.trim().length < 20
                  ? "var(--panel-elevated)"
                  : "var(--accent-amber)",
              color:
                loading || idea.trim().length < 20
                  ? "var(--text-3)"
                  : "var(--bg-0)",
              cursor: loading || idea.trim().length < 20 ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Running analysis…
              </>
            ) : (
              <>
                <RotateCcw size={13} />
                Start New Iteration
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Main workspace page                                                */
/* ------------------------------------------------------------------ */
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "research-pack", label: "Research Pack", icon: BookOpen },
  { id: "expert-reviews", label: "Experts", icon: Users },
  { id: "panel", label: "Panel", icon: MessageSquare },
  { id: "artifacts", label: "Artifacts", icon: FileText },
  { id: "history", label: "History", icon: Clock },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ReviewWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { getIdToken, loading: authLoading } = useAuth();
  const reviewId = params.id as string;

  const [review, setReview] = useState<ReviewSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [view, setView] = useState<AppView>("tabs");
  const [panelSelectedIds, setPanelSelectedIds] = useState<string[]>([]);
  const [panelMessages, setPanelMessages] = useState<ChatMessage[]>([]);
  const [finalizeTrigger, setFinalizeTrigger] = useState(0);
  // Workspace extensions
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [iterationModalOpen, setIterationModalOpen] = useState(false);
  const [hasFinalReport, setHasFinalReport] = useState(false);
  const [audienceSimOpen, setAudienceSimOpen] = useState(false);
  const [viewingArtifact, setViewingArtifact] = useState<Artifact | null>(null);
  const [objectionPrefill, setObjectionPrefill] = useState<string>("");
  const [syntheticBannerDismissed, setSyntheticBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("societyos_synthetic_banner_dismissed") === "1";
  });

  useEffect(() => {
    if (authLoading) return; // wait for Firebase auth state to resolve
    const load = async () => {
      const token = await getIdToken();
      if (!token) { setNotFound(true); return; }
      try {
        const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        const rev = data.review;
        setReview(rev);
        setArtifacts(rev.artifacts ?? []);

        // Restore panel chat if there's an existing conversation history
        const history: ConversationEntry[] = rev.conversationHistory ?? [];
        if (history.length > 0) {
          const personas: Persona[] = rev.personas ?? [];
          const initMsgs: ChatMessage[] = history.map((entry, i) => {
            if (entry.role === "user") {
              return { id: `hist-${i}`, role: "user", content: entry.content, timestamp: new Date() };
            }
            const persona = personas.find((p) => p.id === entry.persona_id);
            return {
              id: `hist-${i}`,
              role: "advisor",
              personaId: entry.persona_id ?? undefined,
              personaName: persona?.name,
              personaArchetype: persona?.archetype,
              content: entry.content,
              timestamp: new Date(),
            };
          });
          const advisorIds = [...new Set(
            history.filter((e) => e.role === "advisor" && e.persona_id).map((e) => e.persona_id as string)
          )];
          setPanelSelectedIds(advisorIds.length > 0 ? advisorIds : personas.map((p) => p.id));
          setPanelMessages(initMsgs);
          // Stay on overview — panel is accessible via the Panel tab
        }
      } catch {
        setNotFound(true);
      }
    };
    load();
  }, [reviewId, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Review not found. It may have expired or the link is incorrect.
        </p>
        <Link
          href="/reviews/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
        >
          Start a new review
        </Link>
      </div>
    );
  }

  if (!review) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-0)" }}
      >
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
      </div>
    );
  }

  // Shared padding + max-width wrapper for all non-chat views
  const ContentShell = ({ children }: { children: React.ReactNode }) => (
    <div className="px-6 sm:px-10 py-8 w-full max-w-5xl mx-auto">
      {children}
    </div>
  );

  const handleEngageAudience = () => { setView("audience-sim"); setAudienceSimOpen(true); };

  const handleTabClick = (id: TabId) => {
    if (id === "panel") {
      if (panelMessages.length > 0 || (review?.conversationHistory?.length ?? 0) > 0) {
        setView("panel-chat");
      } else {
        setView("panel-select");
      }
      return;
    }
    setView("tabs");
    setActiveTab(id);
  };

  const handleIterationComplete = async () => {
    setIterationModalOpen(false);
    // Reload the full review to reflect the new run
    const token = await getIdToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const rev = data.review;
      setReview(rev);
      setArtifacts(rev.artifacts ?? []);
      setPanelMessages([]);
      setHasFinalReport(false);
      setView("tabs");
      setActiveTab("overview");
    } catch {
      // page will still show old data; user can refresh
    }
  };

  const renderContent = () => {
    if (view === "audience-sim") {
      return (
        <AudienceSimView
          reviewId={reviewId}
          reviewIdea={review.idea ?? ""}
          reviewTitle={review.title}
          researchPack={review.researchPack}
          analyses={review.analyses}
          getToken={getIdToken}
          onBack={() => { setView("tabs"); setActiveTab("overview"); setAudienceSimOpen(false); }}
        />
      );
    }
    if (view === "panel-select") {
      return (
        <ContentShell>
          <PanelSelectView
            review={review}
            onStart={(ids) => { setPanelSelectedIds(ids); setView("panel-chat"); }}
            onCancel={() => setView("tabs")}
          />
        </ContentShell>
      );
    }
    if (view === "panel-chat") {
      return (
        <PanelChatView
          review={review}
          selectedIds={panelSelectedIds}
          onUpdateSelectedIds={setPanelSelectedIds}
          onFinalize={(msgs) => { setPanelMessages(msgs); setHasFinalReport(true); setView("final-report"); }}
          finalizeTrigger={finalizeTrigger}
          initialMessages={panelMessages}
          initialInput={objectionPrefill}
        />
      );
    }
    if (view === "final-report") {
      return (
        <ContentShell>
          <FinalReportView review={review} panelMessages={panelMessages} />
        </ContentShell>
      );
    }
    if (view === "artifact-view" && viewingArtifact) {
      return (
        <ContentShell>
          <ArtifactFullView
            artifact={viewingArtifact}
            onBack={() => { setView("tabs"); setActiveTab("artifacts"); }}
          />
        </ContentShell>
      );
    }
    // tabs view
    if (activeTab === "research-pack") {
      return <ContentShell><ResearchPackTab review={review} /></ContentShell>;
    }
    if (activeTab === "expert-reviews") {
      return (
        <ContentShell>
          <ExpertReviewsTab
            review={review}
            onAskPanel={(text) => {
              setObjectionPrefill(text);
              handleTabClick("panel");
            }}
          />
        </ContentShell>
      );
    }
    if (activeTab === "artifacts") {
      return (
        <ContentShell>
          <ArtifactsTab
            reviewId={reviewId}
            review={review}
            artifacts={artifacts}
            onArtifactGenerated={(a) => setArtifacts((prev) => [...prev, a])}
            onViewFinalReport={() => {
              setHasFinalReport(true);
              setView("final-report");
            }}
            hasFinalReport={hasFinalReport}
            onViewArtifact={(a) => { setViewingArtifact(a); setView("artifact-view"); }}
          />
        </ContentShell>
      );
    }
    if (activeTab === "history") {
      return (
        <ContentShell>
          <HistoryTab
            review={review}
            runs={review.runs ?? []}
            onStartIteration={() => setIterationModalOpen(true)}
          />
        </ContentShell>
      );
    }
    // default: overview
    return (
      <ContentShell>
        <OverviewTab
          review={review}
          onContinuePanel={() => handleTabClick("panel")}
          onOpenArtifacts={() => { setView("tabs"); setActiveTab("artifacts"); }}
          onNewIteration={() => setIterationModalOpen(true)}
          onEngageAudience={handleEngageAudience}
        />
      </ContentShell>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
    >
      {/* ── Top nav ── */}
      <header
        className="flex-shrink-0 flex flex-col"
        style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--panel)" }}
      >
        {/* Row 1: brand + meta + actions */}
        <div className="flex items-center justify-between px-6 sm:px-10 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-xs transition-colors flex-shrink-0"
              style={{ color: "var(--text-3)" }}
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div
              className="w-px h-4 hidden sm:block flex-shrink-0"
              style={{ backgroundColor: "var(--border-subtle)" }}
            />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <p
                className="text-sm font-semibold leading-tight truncate max-w-[220px]"
                style={{ color: "var(--text-1)" }}
              >
                {review.title}
              </p>
              <span
                className="accent-chip flex-shrink-0"
                style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
              >
                {USE_CASE_LABEL(review.useCase)}
              </span>
              {review.updatedAt && (
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                  {new Date(review.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Panel action — context-aware */}
            {view === "tabs" && (
              <button
                onClick={() => handleTabClick("panel")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
              >
                {panelMessages.length > 0 ? <MessageSquare size={11} /> : <Play size={11} />}
                <span className="hidden sm:inline">
                  {panelMessages.length > 0 ? "Continue Panel" : "Start Panel"}
                </span>
                <span className="sm:hidden">Panel</span>
              </button>
            )}

            {/* Finalize — shown in panel-chat */}
            {view === "panel-chat" && (
              <button
                onClick={() => setFinalizeTrigger((n) => n + 1)}
                disabled={finalizeTrigger > 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                style={{
                  backgroundColor:
                    finalizeTrigger > 0 ? "var(--panel-elevated)" : "var(--accent-amber)",
                  color:
                    finalizeTrigger > 0 ? "var(--text-3)" : "var(--bg-0)",
                  cursor: finalizeTrigger > 0 ? "not-allowed" : "pointer",
                }}
              >
                {finalizeTrigger > 0 ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                <span className="hidden sm:inline">
                  {finalizeTrigger > 0 ? "Generating…" : "Generate Report"}
                </span>
                <span className="sm:hidden">Report</span>
              </button>
            )}

            {/* Generate Artifact */}
            <button
              onClick={() => { setView("tabs"); setActiveTab("artifacts"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              <Sparkles size={11} />
              <span className="hidden lg:inline">Generate Artifact</span>
              <span className="lg:hidden">Artifact</span>
            </button>

            {/* New Iteration */}
            <button
              onClick={() => setIterationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-2)",
              }}
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">New Iteration</span>
            </button>

            <Link
              href="/reviews/new"
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors hidden sm:flex items-center gap-1.5"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-2)",
                color: "var(--text-3)",
              }}
            >
              <Plus size={11} />
              New Review
            </Link>
          </div>
        </div>

        {/* Row 2: tabs — always visible, panel/report views highlight the relevant tab */}
        <div className="flex items-center gap-0.5 px-6 sm:px-10 pb-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isPanelView = view === "panel-select" || view === "panel-chat";
            const isReportView = view === "final-report";
            const displayLabel =
              id === "research-pack" && review?.useCase === "review-feature"
                ? "Context Pack"
                : label;
            let active = false;
            if (id === "panel") active = isPanelView;
            else if (id === "artifacts") active = isReportView;
            else active = view === "tabs" && activeTab === id;

            return (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0"
                style={{ color: active ? "var(--text-1)" : "var(--text-3)" }}
              >
                <Icon
                  size={13}
                  style={{ color: active ? "var(--accent-amber)" : "var(--text-3)" }}
                />
                {displayLabel}
                {active && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ backgroundColor: "var(--accent-amber)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Summary band ── */}
      {review.workflowType === "simulation" ? (() => {
        const v = review.simulationVerdict;
        const reactions = review.simulationReactions ?? [];
        const avgComp = v?.avg_comprehension ?? (reactions.length ? reactions.reduce((s, r) => s + r.comprehension, 0) / reactions.length : 0);
        const avgEng = v?.avg_engagement ?? (reactions.length ? reactions.reduce((s, r) => s + r.engagement, 0) / reactions.length : 0);
        const shareRate = v?.share_rate ?? (reactions.length ? Math.round(reactions.filter((r) => r.would_share).length * 100 / reactions.length) : 0);
        const scoreColor = (val: number, max = 5) => val / max >= 0.7 ? "#38b27d" : val / max >= 0.4 ? "#f2a93b" : "#df6b57";
        return (
          <div
            className="flex-shrink-0 px-6 sm:px-10 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--panel)" }}
          >
            <div className="grid grid-cols-3 gap-3 max-w-5xl mx-auto">
              {[
                { label: "Comprehension", value: avgComp, max: 5, fmt: (v: number) => `${v.toFixed(1)} / 5` },
                { label: "Engagement", value: avgEng, max: 5, fmt: (v: number) => `${v.toFixed(1)} / 5` },
                { label: "Would Share", value: shareRate, max: 100, fmt: (v: number) => `${Math.round(v)}%` },
              ].map(({ label, value, max, fmt }) => (
                <div key={label} className="rounded-lg px-4 py-3" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}>
                  <p className="section-label mb-1">{label}</p>
                  <p className="text-sm font-bold" style={{ color: scoreColor(value, max) }}>{fmt(value)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })() : (() => {
        const ov = deriveOverview(review.analyses);
        const verdictMap = {
          proceed: { label: "Proceed", color: "#38b27d", bg: "rgba(56,178,125,0.08)", border: "rgba(56,178,125,0.22)" },
          revise: { label: "Revise", color: "#f2a93b", bg: "rgba(242,169,59,0.07)", border: "rgba(242,169,59,0.22)" },
          stop: { label: "Do Not Proceed", color: "#df6b57", bg: "rgba(223,107,87,0.07)", border: "rgba(223,107,87,0.22)" },
        }[ov.verdict];
        return (
          <div
            className="flex-shrink-0 px-6 sm:px-10 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--panel)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
              <div className="rounded-lg px-4 py-3" style={{ border: `1px solid ${verdictMap.border}`, backgroundColor: verdictMap.bg }}>
                <p className="section-label mb-1.5">Recommendation</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${verdictMap.color}22`, color: verdictMap.color }}>
                    {verdictMap.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>Directional — validate with real users</p>
              </div>
              <div className="rounded-lg px-4 py-3" style={{ border: "1px solid rgba(56,178,125,0.18)", backgroundColor: "rgba(56,178,125,0.04)" }}>
                <p className="section-label mb-1.5">Major Opportunity</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{ov.majorOpportunity}</p>
              </div>
              <div className="rounded-lg px-4 py-3" style={{ border: "1px solid rgba(223,107,87,0.18)", backgroundColor: "rgba(223,107,87,0.04)" }}>
                <p className="section-label mb-1.5">Key Risk</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{ov.majorRisk}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Synthetic boundary banner */}
      {!syntheticBannerDismissed && (
        <div
          className="flex items-center justify-between gap-3 px-6 sm:px-10 py-2 flex-shrink-0"
          style={{
            backgroundColor: "var(--bg-2)",
            borderBottom: "1px solid var(--border-subtle)",
            borderLeft: "3px solid var(--accent-amber)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={12} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
              Synthetic simulation — directional insights only. Validate key decisions with real users.
            </p>
          </div>
          <button
            onClick={() => {
              setSyntheticBannerDismissed(true);
              sessionStorage.setItem("societyos_synthetic_banner_dismissed", "1");
            }}
            className="flex-shrink-0 rounded p-0.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-3)" }}
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <main
        className={`flex-1 ${view === "panel-chat" ? "" : "overflow-y-auto"}`}
      >
        {renderContent()}
      </main>

      {/* New Iteration modal */}
      {iterationModalOpen && review && (
        <NewIterationModal
          review={review}
          reviewId={reviewId}
          onClose={() => setIterationModalOpen(false)}
          onComplete={handleIterationComplete}
        />
      )}
    </div>
  );
}
