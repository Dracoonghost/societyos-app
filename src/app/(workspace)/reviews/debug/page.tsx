"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  FlaskConical,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepStatus = "idle" | "running" | "success" | "error";
interface StepState<T> { status: StepStatus; result: T | null; error: string | null; elapsed?: number }

type UseCase = "validate-idea" | "review-feature" | "review-pitch";
type Depth = "quick" | "deep";

interface PersonaMeta { id: string; name: string; emoji: string; archetype: string; segment?: string }

// Step 0
interface PersonasResult { personas: PersonaMeta[]; count: number }

// Step 1
interface IntakeQuestion { id: string; type: "mcq" | "text"; question: string; options?: string[]; why_it_matters: string }
interface QuestionsResult { questions: IntakeQuestion[] }

// Step 2
interface ExpandResult { expanded_brief: string; title: string; extracted_fields: Record<string, string> }

// Step 3
interface Competitor { name: string; domain?: string | null }
interface ResearchPackSummary { competitors: Competitor[]; risk_count: number; opportunity_count: number; market_overview_snippet: string }
interface ResearchPackResult { summary: ResearchPackSummary; raw_pack: Record<string, unknown> }

// Step 4
interface SinglePersonaResult { analysis: Record<string, unknown>; persona: PersonaMeta; elapsed_s: number; model: string }

// Step 5
interface PersonaAnalysis { id: string; name: string; emoji: string; archetype: string; snippet: string; elapsed_s: number }
interface AllAnalysesResult { personas: PersonaAnalysis[]; total_elapsed_s: number; model: string; depth: Depth }

// Step 6
interface SaveResult { review_id: string; title: string; created_at: string }

// Step 7
interface PersonaScoreRow { score: number; matched_keywords: string[]; all_keywords: string[]; name: string; emoji: string }
interface SelectionResult { selected: PersonaMeta[]; all_scores: Record<string, PersonaScoreRow>; message: string; n: number }

// Step 8
interface ChatReply { persona_id: string; persona_name: string; emoji: string; text: string }
interface ChatResult { replies: ChatReply[] }

// Step 9
interface ArtifactResult { markdown: string; artifact_type: string; elapsed_s: number; model: string }

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESETS: Record<UseCase, { idea: string; industry: string; stage: string; target_market: string }> = {
  "validate-idea": {
    idea: "A Slack bot that automatically writes weekly engineering progress updates based on GitHub commit history and Jira ticket activity. Targets Series A-C SaaS startups (50-300 employees). Priced at $29/month per team.\n\nThe problem: engineering managers spend 30-60 min each week manually writing status updates for leadership.",
    industry: "B2B SaaS",
    stage: "mvp",
    target_market: "Engineering managers at Series A-C SaaS startups",
  },
  "review-feature": {
    idea: "Adding an AI smart reply feature to our B2B customer support platform. When an agent views an open ticket it suggests 2-3 draft replies based on conversation history and past resolved tickets.\n\nDecision: default-on for all plans or gate behind Pro tier?",
    industry: "B2B SaaS",
    stage: "launched",
    target_market: "Customer support teams at mid-market SaaS companies",
  },
  "review-pitch": {
    idea: "Problem: 60% of Series A-B SaaS companies miss hiring targets because they cannot predict team capacity 6 months out. Existing tools are backward-looking.\n\nSolution: PlanForce, an AI headcount planning tool. Traction: 3 design partners, 2 LOIs. Raising $1.2M pre-seed.",
    industry: "HR Tech / SaaS",
    stage: "idea",
    target_market: "Series A-B SaaS founders",
  },
};

// ---------------------------------------------------------------------------
// Artifact types (must match _ARTIFACT_PROMPTS keys in founder_engine.py)
// ---------------------------------------------------------------------------

const ARTIFACT_TYPES: { value: string; label: string }[] = [
  { value: "gtm-strategy", label: "Go-to-Market Strategy" },
  { value: "next-steps-30d", label: "30-Day Next Steps" },
  { value: "pitch-draft", label: "Pitch Draft" },
  { value: "customer-validation-plan", label: "Customer Validation Plan" },
  { value: "messaging-strategy", label: "Messaging Strategy" },
  { value: "final-report", label: "Final Report" },
  { value: "feature-decision-memo", label: "Feature Decision Memo" },
  { value: "scope-recommendation", label: "Scope Recommendation" },
  { value: "experiment-plan", label: "Experiment Plan" },
  { value: "rollout-plan", label: "Rollout Plan" },
  { value: "success-metrics-plan", label: "Success Metrics Plan" },
  { value: "stakeholder-brief", label: "Stakeholder Brief" },
  { value: "refined-pitch", label: "Refined Pitch Narrative" },
  { value: "investor-faq", label: "Investor FAQ" },
  { value: "one-pager", label: "One-Pager" },
  { value: "exec-summary", label: "Executive Summary" },
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function StepStatusBadge({ status }: { status: StepStatus }) {
  if (status === "idle") return <span className="text-xs text-[var(--text-3)]">idle</span>;
  if (status === "running") return <span className="flex items-center gap-1 text-xs text-amber-400"><Loader2 size={11} className="animate-spin" />running</span>;
  if (status === "success") return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={11} />done</span>;
  return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={11} />error</span>;
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-[var(--bg-0)] border border-[var(--border-subtle)]">
      <span className={`text-sm font-bold font-mono ${accent ? "text-[var(--accent-amber)]" : "text-[var(--text-1)]"}`}>{value}</span>
      <span className="text-[10px] text-[var(--text-3)] mt-0.5">{label}</span>
    </div>
  );
}

function JsonView({ data, label = "Raw JSON" }: { data: unknown; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}{label}
      </button>
      {open && (
        <pre className="mt-2 text-[10px] leading-relaxed text-[var(--text-3)] bg-[var(--bg-0)] rounded-lg p-3 overflow-x-auto max-h-96 scrollbar-thin">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
    </div>
  );
}

function StepCard({
  number, title, description, tag, status, error, elapsed, canRun, onRun, children,
}: {
  number: number; title: string; description: string; tag?: string;
  status: StepStatus; error: string | null; elapsed?: number;
  canRun: boolean; onRun: () => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const border =
    status === "success" ? "border-emerald-800/40" :
    status === "error" ? "border-red-800/40" :
    status === "running" ? "border-amber-800/40" :
    "border-[var(--border-subtle)]";
  const badge =
    status === "success" ? "bg-emerald-900/40 text-emerald-400" :
    status === "error" ? "bg-red-900/40 text-red-400" :
    status === "running" ? "bg-amber-900/40 text-amber-400" :
    "bg-[var(--bg-2)] text-[var(--text-3)]";
  return (
    <div className={`rounded-xl border bg-[var(--bg-1)] overflow-hidden transition-colors ${border}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badge}`}>{number}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
            {tag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-[var(--text-3)]" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}>
                {tag}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{description}</p>
        </div>
        {elapsed !== undefined && status === "success" && (
          <span className="text-[10px] font-mono text-[var(--text-3)] shrink-0">{elapsed.toFixed(1)}s</span>
        )}
        <StepStatusBadge status={status} />
        <button
          onClick={onRun}
          disabled={!canRun || status === "running"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {status === "running" ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {status === "success" ? "Re-run" : "Run"}
        </button>
        {(status === "success" || status === "error") && (
          <button onClick={() => setOpen(!open)} className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        )}
      </div>
      {error && (
        <div className="px-5 pb-4">
          <p className="text-xs text-red-400 bg-red-950/20 rounded-lg px-3 py-2 font-mono break-all">{error}</p>
        </div>
      )}
      {children && open && (
        <div className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step output components
// ---------------------------------------------------------------------------

function Step0Output({ result }: { result: PersonasResult }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatChip label="personas loaded" value={result.count} accent />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {result.personas.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3 py-2">
            <span className="text-base">{p.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-1)] truncate">{p.name}</p>
              <p className="text-[10px] text-[var(--text-3)] truncate">{p.archetype}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step1Output({
  result, answers, onAnswerChange,
}: {
  result: QuestionsResult;
  answers: Record<string, string>;
  onAnswerChange: (id: string, val: string) => void;
}) {
  const inputCls = "w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="questions" value={result.questions.length} accent />
      </div>
      {result.questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-1)]">{q.question}</p>
            <p className="text-[10px] text-[var(--text-3)] mt-0.5">Why this matters: {q.why_it_matters}</p>
          </div>
          {q.type === "mcq" && q.options ? (
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onAnswerChange(q.id, opt)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: answers[q.id] === opt ? "rgba(242,169,59,0.10)" : "var(--bg-0)",
                    border: `1px solid ${answers[q.id] === opt ? "rgba(242,169,59,0.35)" : "var(--border-subtle)"}`,
                    color: answers[q.id] === opt ? "var(--accent-amber)" : "var(--text-2)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              className={inputCls}
              placeholder="Your answer..."
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step2Output({ result }: { result: ExpandResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {result.extracted_fields.industry && <StatChip label="industry" value={result.extracted_fields.industry} />}
        {result.extracted_fields.stage && <StatChip label="stage" value={result.extracted_fields.stage} />}
      </div>
      {result.title && (
        <p className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wider">{result.title}</p>
      )}
      <p className="text-sm leading-relaxed text-[var(--text-2)] bg-[var(--bg-0)] rounded-lg p-3 border border-[var(--border-subtle)] whitespace-pre-wrap">
        {result.expanded_brief}
      </p>
      <JsonView data={result.extracted_fields} label="Extracted fields JSON" />
    </div>
  );
}

function Step3Output({ result }: { result: ResearchPackResult }) {
  const { summary } = result;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="competitors" value={summary.competitors.length} accent />
        <StatChip label="risks" value={summary.risk_count} />
        <StatChip label="opportunities" value={summary.opportunity_count} />
      </div>
      {summary.market_overview_snippet && (
        <p className="text-sm leading-relaxed text-[var(--text-2)] bg-[var(--bg-0)] rounded-lg p-3 border border-[var(--border-subtle)]">
          {summary.market_overview_snippet}
        </p>
      )}
      {summary.competitors.length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Competitors mapped</p>
          <div className="flex flex-wrap gap-2">
            {summary.competitors.map((c) => (
              <span key={c.name} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-0)] border border-[var(--border-subtle)] text-[var(--text-2)]">
                {c.name}{c.domain && <span className="text-[var(--text-3)] ml-1">· {c.domain}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <JsonView data={result.raw_pack} label="Full research pack JSON" />
    </div>
  );
}

function Step4Output({ result }: { result: SinglePersonaResult }) {
  const a = result.analysis;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="persona" value={`${result.persona.emoji} ${result.persona.name}`} accent />
        <StatChip label="elapsed" value={`${result.elapsed_s.toFixed(1)}s`} />
        {!!a.confidence && <StatChip label="confidence" value={String(a.confidence)} />}
        <StatChip label="model" value={result.model.split("-").slice(0, 3).join("-")} />
      </div>
      {!!a.text && (
        <p className="text-sm leading-relaxed text-[var(--text-2)] bg-[var(--bg-0)] rounded-lg p-3 border border-[var(--border-subtle)] whitespace-pre-wrap">
          {String(a.text).slice(0, 600)}{String(a.text).length > 600 ? "..." : ""}
        </p>
      )}
      {!!a.recommendation && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 shrink-0 mt-0.5">Rec</span>
          <p className="text-xs text-[var(--text-2)]">{String(a.recommendation)}</p>
        </div>
      )}
      <JsonView data={result.analysis} label="Full analysis JSON" />
    </div>
  );
}

function Step5Output({ result }: { result: AllAnalysesResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="personas" value={result.personas.length} accent />
        <StatChip label="total time" value={`${result.total_elapsed_s.toFixed(1)}s`} />
        <StatChip label="depth" value={result.depth} />
        <StatChip label="model" value={result.model.split("-").slice(0, 3).join("-")} />
      </div>
      <div className="space-y-2">
        {result.personas.map((p) => (
          <div key={p.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-0)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{p.emoji}</span>
              <span className="text-sm font-semibold text-[var(--text-1)]">{p.name}</span>
              <span className="text-xs text-[var(--text-3)]">{p.archetype}</span>
              <span className="ml-auto text-[10px] font-mono text-[var(--text-3)]">{p.elapsed_s.toFixed(1)}s</span>
            </div>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">{p.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step6Output({ result }: { result: SaveResult }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Review saved</p>
          <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">{result.review_id}</p>
        </div>
        <Link
          href={`/reviews/${result.review_id}`}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-xs font-semibold hover:brightness-110 transition-all shrink-0"
        >
          Open <ExternalLink size={11} />
        </Link>
      </div>
      <JsonView data={result} label="Save response JSON" />
    </div>
  );
}

function Step7Output({ result }: { result: SelectionResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="selected" value={result.selected.length} accent />
        <StatChip label="requested n" value={result.n} />
        <StatChip label="total scored" value={Object.keys(result.all_scores).length} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Selected personas</p>
        <div className="flex flex-wrap gap-2">
          {result.selected.map((p) => (
            <span key={p.id} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-emerald-300">
              {p.emoji} {p.name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">All keyword scores</p>
        <div className="space-y-1">
          {Object.entries(result.all_scores).sort((a, b) => b[1].score - a[1].score).map(([pid, row]) => (
            <div key={pid} className="flex items-center gap-3 text-xs">
              <span className="w-5">{row.emoji}</span>
              <span className="w-28 truncate text-[var(--text-2)]">{row.name}</span>
              <span className="font-mono text-[var(--accent-amber)] w-4">{row.score}</span>
              {row.matched_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {row.matched_keywords.map((kw) => (
                    <span key={kw} className="px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-800/30 text-amber-300 text-[10px]">{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <JsonView data={result} label="Full selection result JSON" />
    </div>
  );
}

function Step8Output({ result }: { result: ChatResult }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatChip label="replies" value={result.replies.length} accent />
      </div>
      {result.replies.map((r, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-0)] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{r.emoji}</span>
            <span className="text-sm font-semibold text-[var(--text-1)]">{r.persona_name}</span>
          </div>
          <p className="text-xs text-[var(--text-2)] leading-relaxed whitespace-pre-wrap">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function Step9Output({ result }: { result: ArtifactResult }) {
  const [copied, setCopied] = useState(false);
  function copyMarkdown() {
    navigator.clipboard.writeText(result.markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="type" value={result.artifact_type} accent />
        <StatChip label="elapsed" value={`${result.elapsed_s.toFixed(1)}s`} />
        <StatChip label="model" value={result.model.split("-").slice(0, 3).join("-")} />
      </div>
      <div className="relative">
        <button
          onClick={copyMarkdown}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[var(--text-3)] hover:text-[var(--text-1)] bg-[var(--bg-1)] border border-[var(--border-subtle)] transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="text-xs leading-relaxed text-[var(--text-2)] bg-[var(--bg-0)] rounded-lg p-4 overflow-x-auto max-h-[500px] scrollbar-thin whitespace-pre-wrap border border-[var(--border-subtle)]">
          {result.markdown}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReviewsDebugPage() {
  const { user } = useAuth();

  // ── Inputs ──────────────────────────────────────────────────────────────
  const [useCase, setUseCase] = useState<UseCase>("validate-idea");
  const [depth, setDepth] = useState<Depth>("quick");
  const [idea, setIdea] = useState(PRESETS["validate-idea"].idea);
  const [industry, setIndustry] = useState(PRESETS["validate-idea"].industry);
  const [stage, setStage] = useState(PRESETS["validate-idea"].stage);
  const [targetMarket, setTargetMarket] = useState(PRESETS["validate-idea"].target_market);

  // ── Step-specific controls ───────────────────────────────────────────────
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [selectionMessage, setSelectionMessage] = useState("Should we add dark mode?");
  const [chatMessage, setChatMessage] = useState("What do you think about the pricing?");
  const [artifactType, setArtifactType] = useState<string>("gtm-strategy");
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});

  // ── Step states ──────────────────────────────────────────────────────────
  const empty = { status: "idle" as const, result: null, error: null };
  const [step0, setStep0] = useState<StepState<PersonasResult>>(empty);
  const [step1, setStep1] = useState<StepState<QuestionsResult>>(empty);
  const [step2, setStep2] = useState<StepState<ExpandResult>>(empty);
  const [step3, setStep3] = useState<StepState<ResearchPackResult>>(empty);
  const [step4, setStep4] = useState<StepState<SinglePersonaResult>>(empty);
  const [step5, setStep5] = useState<StepState<AllAnalysesResult>>(empty);
  const [step6, setStep6] = useState<StepState<SaveResult>>(empty);
  const [step7, setStep7] = useState<StepState<SelectionResult>>(empty);
  const [step8, setStep8] = useState<StepState<ChatResult>>(empty);
  const [step9, setStep9] = useState<StepState<ArtifactResult>>(empty);

  // ── Internal refs ────────────────────────────────────────────────────────
  const personasRef = useRef<PersonaMeta[] | null>(null);
  const researchPackRef = useRef<Record<string, unknown> | null>(null);
  const personaAnalysesRef = useRef<Record<string, unknown> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const intakeQuestionsRef = useRef<IntakeQuestion[] | null>(null);

  // ── Auth helper ──────────────────────────────────────────────────────────
  async function getToken(): Promise<string | null> {
    if (!user) return null;
    const { getIdToken } = await import("firebase/auth");
    return getIdToken(user as Parameters<typeof getIdToken>[0]);
  }

  // ── API fetch helper ─────────────────────────────────────────────────────
  async function apiFetch(method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
    const token = await getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
  }

  // ── Preset loader ────────────────────────────────────────────────────────
  function loadPreset(uc: UseCase) {
    const p = PRESETS[uc];
    setUseCase(uc);
    setIdea(p.idea);
    setIndustry(p.industry);
    setStage(p.stage);
    setTargetMarket(p.target_market);
  }

  // ── Reset all ────────────────────────────────────────────────────────────
  function resetAll() {
    personasRef.current = null;
    researchPackRef.current = null;
    personaAnalysesRef.current = null;
    sessionIdRef.current = null;
    intakeQuestionsRef.current = null;
    setIntakeAnswers({});
    [setStep0, setStep1, setStep2, setStep3, setStep4, setStep5, setStep6, setStep7, setStep8, setStep9].forEach(
      (s) => s(empty)
    );
  }

  // ── Step 0: Load Personas ────────────────────────────────────────────────
  async function runStep0() {
    setStep0({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("GET", "/api/founder/personas") as { personas: PersonaMeta[] };
      personasRef.current = data.personas;
      if (!selectedPersonaId && data.personas.length > 0) {
        setSelectedPersonaId(data.personas[0].id);
      }
      setStep0({
        status: "success",
        result: { personas: data.personas, count: data.personas.length },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep0({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 1: Smart Intake Questions ──────────────────────────────────────
  async function runStep1() {
    setStep1({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/intake/questions", {
        idea: idea.trim(),
        use_case: useCase,
      }) as { questions: IntakeQuestion[] };
      intakeQuestionsRef.current = data.questions;
      setIntakeAnswers({});
      setStep1({
        status: "success",
        result: { questions: data.questions },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep1({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 2: Expand Brief ─────────────────────────────────────────────────
  async function runStep2() {
    if (!step1.result) return;
    setStep2({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const answers = (intakeQuestionsRef.current ?? []).map((q) => ({
        id: q.id,
        question: q.question,
        answer: intakeAnswers[q.id] ?? "",
      }));
      const data = await apiFetch("POST", "/api/founder/intake/expand", {
        idea: idea.trim(),
        use_case: useCase,
        answers,
      }) as { expanded_brief: string; title: string; extracted_fields: Record<string, string> };
      setIdea(data.expanded_brief);
      if (data.extracted_fields.industry) setIndustry(data.extracted_fields.industry);
      if (data.extracted_fields.stage) setStage(data.extracted_fields.stage);
      if (data.extracted_fields.target_market) setTargetMarket(data.extracted_fields.target_market);
      setStep2({
        status: "success",
        result: { expanded_brief: data.expanded_brief, title: data.title, extracted_fields: data.extracted_fields },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep2({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 3: Research Pack ────────────────────────────────────────────────
  async function runStep3() {
    setStep3({ status: "running", result: null, error: null });
    researchPackRef.current = null;
    personaAnalysesRef.current = null;
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/debug/research-pack", {
        idea: idea.trim(),
        industry: industry.trim() || undefined,
        stage: stage.trim() || undefined,
        target_market: targetMarket.trim() || undefined,
        use_case: useCase,
      }) as { research_pack: Record<string, unknown>; personas: PersonaMeta[] };

      researchPackRef.current = data.research_pack;
      if (!personasRef.current && data.personas?.length > 0) {
        personasRef.current = data.personas;
        if (!selectedPersonaId) setSelectedPersonaId(data.personas[0].id);
      }

      const pack = data.research_pack;
      const summary: ResearchPackSummary = {
        competitors: ((pack.competitors ?? []) as Competitor[]).map((c) => ({ name: c.name, domain: c.domain })),
        risk_count: ((pack.top_risks ?? []) as unknown[]).length,
        opportunity_count: ((pack.top_opportunities ?? []) as unknown[]).length,
        market_overview_snippet: String(pack.market_overview ?? "").slice(0, 320),
      };
      setStep3({
        status: "success",
        result: { summary, raw_pack: pack },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep3({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 4: Single Persona Analysis (independent) ───────────────────────
  async function runStep4() {
    if (!researchPackRef.current) return;
    const persona = (personasRef.current ?? []).find((p) => p.id === selectedPersonaId);
    if (!persona) return;
    setStep4({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/debug/single-persona", {
        idea: idea.trim(),
        industry: industry.trim() || undefined,
        stage: stage.trim() || undefined,
        target_market: targetMarket.trim() || undefined,
        use_case: useCase,
        depth,
        research_pack: researchPackRef.current,
        persona,
      }) as SinglePersonaResult;
      setStep4({
        status: "success",
        result: data,
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep4({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 5: All Persona Analyses ─────────────────────────────────────────
  async function runStep5() {
    if (!researchPackRef.current || !personasRef.current) return;
    setStep5({ status: "running", result: null, error: null });
    personaAnalysesRef.current = null;
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/debug/persona-analyses", {
        idea: idea.trim(),
        industry: industry.trim() || undefined,
        stage: stage.trim() || undefined,
        target_market: targetMarket.trim() || undefined,
        use_case: useCase,
        depth,
        research_pack: researchPackRef.current,
        personas: personasRef.current,
      }) as {
        analyses: Record<string, { text: string; elapsed_s: number }>;
        model: string;
        depth: Depth;
        personas: PersonaMeta[];
      };

      personaAnalysesRef.current = data.analyses;

      const personas: PersonaAnalysis[] = (data.personas ?? personasRef.current ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        archetype: p.archetype,
        snippet: (data.analyses[p.id]?.text ?? "").slice(0, 240),
        elapsed_s: data.analyses[p.id]?.elapsed_s ?? 0,
      }));

      setStep5({
        status: "success",
        result: { personas, total_elapsed_s: (Date.now() - t0) / 1000, model: data.model, depth: data.depth },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep5({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 6: Save Review to DB ─────────────────────────────────────────────
  async function runStep6() {
    if (!researchPackRef.current || !personaAnalysesRef.current || !personasRef.current) return;
    if (!user) { setStep6({ status: "error", result: null, error: "Must be logged in to save to DB." }); return; }
    setStep6({ status: "running", result: null, error: null });
    try {
      const data = await apiFetch("POST", "/api/founder/debug/save-review", {
        idea: idea.trim(),
        industry: industry.trim() || undefined,
        stage: stage.trim() || undefined,
        target_market: targetMarket.trim() || undefined,
        use_case: useCase,
        depth,
        title: idea.trim().slice(0, 80),
        research_pack: researchPackRef.current,
        initial_analyses: personaAnalysesRef.current,
        personas: personasRef.current,
      }) as SaveResult;
      sessionIdRef.current = data.review_id;
      setStep6({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep6({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 7: Persona Selection Preview (independent) ──────────────────────
  async function runStep7() {
    if (!personasRef.current) return;
    setStep7({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/debug/persona-selection", {
        personas: personasRef.current,
        message: selectionMessage.trim(),
        n: 3,
      }) as SelectionResult;
      setStep7({
        status: "success",
        result: data,
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep7({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 8: Chat Turn ─────────────────────────────────────────────────────
  async function runStep8() {
    if (!sessionIdRef.current) return;
    setStep8({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/chat", {
        session_id: sessionIdRef.current,
        message: chatMessage.trim(),
      }) as { replies: ChatReply[] };
      setStep8({
        status: "success",
        result: { replies: data.replies },
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep8({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 9: Generate Artifact (independent) ───────────────────────────────
  async function runStep9() {
    if (!researchPackRef.current || !personaAnalysesRef.current || !personasRef.current) return;
    setStep9({ status: "running", result: null, error: null });
    const t0 = Date.now();
    try {
      const data = await apiFetch("POST", "/api/founder/debug/artifact", {
        artifact_type: artifactType,
        idea: idea.trim(),
        research_pack: researchPackRef.current,
        initial_analyses: personaAnalysesRef.current,
        personas: personasRef.current,
      }) as ArtifactResult;
      setStep9({
        status: "success",
        result: data,
        error: null,
        elapsed: (Date.now() - t0) / 1000,
      });
    } catch (e: unknown) {
      setStep9({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  const inputCls = "w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors";
  const packReady = step3.status === "success" && !!researchPackRef.current;
  const personasReady = !!personasRef.current && (personasRef.current?.length ?? 0) > 0;
  const analysesReady = step5.status === "success" && !!personaAnalysesRef.current;
  const reviewSaved = step6.status === "success" && !!sessionIdRef.current;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Page header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-0)" }}
      >
        <Link href="/reviews" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <FlaskConical size={16} style={{ color: "var(--accent-amber)" }} />
        <h1 className="text-sm font-semibold">Strategic Review — Pipeline Lab</h1>
        <span className="text-xs px-2 py-0.5 rounded font-mono"
          style={{ backgroundColor: "rgba(242,169,59,0.12)", color: "var(--accent-amber)", border: "1px solid rgba(242,169,59,0.25)" }}>
          /api/founder/*
        </span>
        <span className="text-[10px] text-[var(--text-3)] hidden sm:block">10 steps</span>
        <button
          onClick={resetAll}
          className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
        >
          <RotateCcw size={13} /> Reset all
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Config panel ── */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] p-5 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Input configuration</p>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Use case</p>
              <div className="flex flex-col gap-1.5">
                {(["validate-idea", "review-feature", "review-pitch"] as UseCase[]).map((uc) => (
                  <button
                    key={uc}
                    onClick={() => loadPreset(uc)}
                    className="text-left px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: useCase === uc ? "rgba(242,169,59,0.10)" : "var(--bg-0)",
                      border: `1px solid ${useCase === uc ? "rgba(242,169,59,0.35)" : "var(--border-subtle)"}`,
                      color: useCase === uc ? "var(--accent-amber)" : "var(--text-2)",
                    }}
                  >
                    {uc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[160px]">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Depth</p>
              <div className="flex gap-2">
                {(["quick", "deep"] as Depth[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className="flex-1 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: depth === d ? "rgba(242,169,59,0.10)" : "var(--bg-0)",
                      border: `1px solid ${depth === d ? "rgba(242,169,59,0.35)" : "var(--border-subtle)"}`,
                      color: depth === d ? "var(--accent-amber)" : "var(--text-2)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {!user && (
                <p className="text-[10px] text-amber-400 mt-3 bg-amber-950/20 border border-amber-800/30 rounded px-2 py-1.5">
                  Not logged in — Step 6 (save) will fail. All other steps work.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Idea *</p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={5}
              className={inputCls}
              style={{ resize: "vertical" }}
              placeholder="Describe the idea in detail..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-1.5">Industry</p>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} placeholder="e.g. B2B SaaS" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-1.5">Stage</p>
              <input value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls} placeholder="idea / mvp / launched" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-1.5">Target market</p>
              <input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} className={inputCls} placeholder="e.g. SaaS founders" />
            </div>
          </div>
        </div>

        {/* ── Step 0: Load Personas ── */}
        <StepCard
          number={0}
          title="Load Personas"
          description="Fetch all advisor personas from the database. Required for Steps 4, 5, 7."
          status={step0.status}
          error={step0.error}
          elapsed={step0.elapsed}
          canRun={true}
          onRun={runStep0}
        >
          {step0.result && <Step0Output result={step0.result} />}
        </StepCard>

        <SectionDivider label="Smart Intake (optional)" />

        {/* ── Step 1: Smart Intake Questions ── */}
        <StepCard
          number={1}
          title="Smart Intake Questions"
          description="Generate 3-5 follow-up questions tailored to the use case. Calls generate_intake_questions()."
          status={step1.status}
          error={step1.error}
          elapsed={step1.elapsed}
          canRun={idea.trim().length >= 20}
          onRun={runStep1}
        >
          {step1.result && (
            <Step1Output
              result={step1.result}
              answers={intakeAnswers}
              onAnswerChange={(id, val) => setIntakeAnswers((prev) => ({ ...prev, [id]: val }))}
            />
          )}
        </StepCard>

        {/* ── Step 2: Expand Brief ── */}
        <StepCard
          number={2}
          title="Expand Brief"
          description="Merge idea + intake answers into a full enriched brief. Updates the Idea field above. Calls expand_idea_brief()."
          status={step2.status}
          error={step2.error}
          elapsed={step2.elapsed}
          canRun={step1.status === "success"}
          onRun={runStep2}
        >
          {step2.result && <Step2Output result={step2.result} />}
        </StepCard>

        <SectionDivider label="Core Pipeline" />

        {/* ── Step 3: Research Pack ── */}
        <StepCard
          number={3}
          title="Research Pack"
          description="Run market intelligence: competitor mapping, risks, opportunities, market overview. Calls build_research_pack()."
          status={step3.status}
          error={step3.error}
          elapsed={step3.elapsed}
          canRun={idea.trim().length >= 20}
          onRun={runStep3}
        >
          {step3.result && <Step3Output result={step3.result} />}
        </StepCard>

        {/* ── Step 4: Single Persona Analysis (independent) ── */}
        <StepCard
          number={4}
          title="Single Persona Analysis"
          description="Run analysis for one selected persona only. Calls analyze_single_persona(). Useful for debugging a specific lens."
          tag="independent"
          status={step4.status}
          error={step4.error}
          elapsed={step4.elapsed}
          canRun={packReady && personasReady && !!selectedPersonaId}
          onRun={runStep4}
        >
          {/* Persona picker */}
          {personasReady && (
            <div className="mb-4">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Select persona</p>
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                className={inputCls}
              >
                {(personasRef.current ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name} — {p.archetype}</option>
                ))}
              </select>
            </div>
          )}
          {step4.result && <Step4Output result={step4.result} />}
        </StepCard>

        {/* ── Step 5: All Persona Analyses ── */}
        <StepCard
          number={5}
          title="All Persona Analyses"
          description="Run all expert-lens analyses in parallel (bounded by LLM_CONCURRENCY). Calls analyze_single_persona() for each persona."
          status={step5.status}
          error={step5.error}
          elapsed={step5.elapsed}
          canRun={packReady && personasReady}
          onRun={runStep5}
        >
          {step5.result && <Step5Output result={step5.result} />}
        </StepCard>

        <SectionDivider label="Persistence & Interaction" />

        {/* ── Step 6: Save Review to DB ── */}
        <StepCard
          number={6}
          title="Save Review to DB"
          description="Persist the review document to MongoDB and deduct credits. Requires authentication. Enables Step 8."
          status={step6.status}
          error={step6.error}
          canRun={packReady && analysesReady && !!user}
          onRun={runStep6}
        >
          {step6.result && <Step6Output result={step6.result} />}
        </StepCard>

        {/* ── Step 7: Persona Selection Preview (independent) ── */}
        <StepCard
          number={7}
          title="Persona Selection Preview"
          description="Inspect which personas _select_responding_personas() would pick for a given message, with keyword scores."
          tag="independent"
          status={step7.status}
          error={step7.error}
          elapsed={step7.elapsed}
          canRun={personasReady}
          onRun={runStep7}
        >
          <div className="mb-4">
            <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Test message</p>
            <input
              value={selectionMessage}
              onChange={(e) => setSelectionMessage(e.target.value)}
              className={inputCls}
              placeholder="e.g. Should we add dark mode?"
            />
          </div>
          {step7.result && <Step7Output result={step7.result} />}
        </StepCard>

        {/* ── Step 8: Chat Turn ── */}
        <StepCard
          number={8}
          title="Chat Turn"
          description="Send a message to the saved review session and get persona replies. Requires Step 6 (save) to have run first."
          status={step8.status}
          error={step8.error}
          elapsed={step8.elapsed}
          canRun={reviewSaved}
          onRun={runStep8}
        >
          <div className="mb-4">
            <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">
              Message
              {sessionIdRef.current && (
                <span className="ml-2 font-mono normal-case">(session: {sessionIdRef.current.slice(0, 12)}…)</span>
              )}
            </p>
            <input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className={inputCls}
              placeholder="e.g. What do you think about the pricing?"
            />
          </div>
          {step8.result && <Step8Output result={step8.result} />}
        </StepCard>

        {/* ── Step 9: Generate Artifact (independent) ── */}
        <StepCard
          number={9}
          title="Generate Artifact"
          description="Generate any of the 16 artifact types from in-memory data. No DB write. No credits deducted. Calls generate_artifact()."
          tag="independent"
          status={step9.status}
          error={step9.error}
          elapsed={step9.elapsed}
          canRun={packReady && analysesReady}
          onRun={runStep9}
        >
          <div className="mb-4">
            <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Artifact type</p>
            <select
              value={artifactType}
              onChange={(e) => setArtifactType(e.target.value)}
              className={inputCls}
            >
              {ARTIFACT_TYPES.map((at) => (
                <option key={at.value} value={at.value}>{at.label}</option>
              ))}
            </select>
          </div>
          {step9.result && <Step9Output result={step9.result} />}
        </StepCard>

      </div>
    </div>
  );
}
