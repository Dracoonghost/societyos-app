"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Lightbulb,
  Layers,
  Presentation,
  ChevronRight,
  Users,
  Plus,
  Building2,
  ChevronDown,
  Upload,
  FileText,
  X,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/ui/navbar";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */
type UseCase =
  | "validate-idea"
  | "review-feature"
  | "review-pitch";

interface AudienceLibraryItem {
  id: string;
  name: string;
  description: string;
  geography: string;
  age_band: string;
  role: string;
  channels: string[];
}

type WorkflowType = "review";

interface UseCaseConfig {
  id: UseCase;
  label: string;
  workflowType: WorkflowType;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  tagline: string;
  bestFor: string;
  whatWeAnalyze: string;
  whatToProvide: string;
  outputs: string[];
  fields: FieldConfig[];
  exampleInput?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type: "textarea" | "text" | "select";
  options?: { id: string; label: string }[];
  required?: boolean;
  rows?: number;
}

interface PersonaMeta {
  id: string;
  name: string;
  archetype: string;
  tagline: string;
  color: string;
  emoji: string;
  strengths?: string[];
}

type StreamEvent =
  | { type: "stage"; stage: string; message: string }
  | { type: "research_complete"; summary: { competitors: { name: string; domain?: string | null }[]; risk_count: number; opportunity_count: number; market_overview_snippet: string } }
  | { type: "persona_start"; id: string; name: string; emoji: string; archetype: string }
  | { type: "persona_complete"; id: string; name: string; snippet: string }
  | { type: "done"; review_id: string }
  | { type: "error"; message: string };

type DisplayEvent = Extract<StreamEvent, { type: "stage" | "research_complete" | "persona_start" | "persona_complete" }>;


const USE_CASE_CONFIGS: UseCaseConfig[] = [
  {
    id: "validate-idea",
    label: "Idea Review",
    workflowType: "review",
    icon: Lightbulb,
    tagline: "Should we build this at all?",
    bestFor: "Startup ideas, new products, new business lines",
    whatWeAnalyze: "Market opportunity, competitive landscape, assumption quality, business viability, and strategic fit.",
    whatToProvide: "A description of the idea, the problem it solves, who it serves, and what you want validated.",
    outputs: ["Research brief with market evidence", "Expert-lens critique", "Key risks and opportunities", "Proceed / revise recommendation", "Next-step action memo"],
    fields: [
      { key: "main", label: "Describe the idea", type: "textarea", rows: 7, required: true, placeholder: "Describe the product or business idea: what it does, who it is for, and the problem it solves." },
      { key: "targetCustomer", label: "Target customer", type: "text", placeholder: "e.g. Early-stage SaaS founders, B2B marketers at mid-market companies" },
      { key: "market", label: "Market / geography", type: "text", placeholder: "e.g. US SMB market, global, enterprise software" },
      { key: "uncertainty", label: "Main uncertainty or what you want reviewed", type: "text", placeholder: "e.g. Is this market large enough? Can we charge what we need to charge?" },
    ],
    exampleInput: "A Slack bot that automatically writes weekly engineering progress updates based on GitHub commit history and Jira ticket activity. Targets Series A–C SaaS startups (50–300 employees). Priced at $29/month per team. Currently pre-revenue, building first 10 design partners.\n\nThe problem: engineering managers spend 30–60 min each week manually writing status updates for leadership. We automate that by reading commit messages and closed tickets and generating a readable summary in their writing style.",
  },
  {
    id: "review-feature",
    label: "Feature Review",
    workflowType: "review",
    icon: Layers,
    tagline: "Should we ship this feature, in this form, for this product, right now?",
    bestFor: "Roadmap bets, major UX changes, pricing or packaging changes",
    whatWeAnalyze: "Customer value, product coherence, technical feasibility, business impact, and strategic alignment.",
    whatToProvide: "A description of the feature, what it changes, who it affects, and the decision you are trying to make.",
    outputs: ["Risks and tradeoffs", "Customer-lens critique", "Engineering and feasibility notes", "Business alignment check", "Recommended next step"],
    fields: [
      { key: "main", label: "Describe the feature or change", type: "textarea", rows: 7, required: true, placeholder: "Describe the feature: what it does, what it changes, and the decision you need to make." },
      { key: "productContext", label: "Product context", type: "text", placeholder: "e.g. B2B analytics dashboard for ops teams, mobile-first consumer app" },
      { key: "userSegment", label: "User segment", type: "text", placeholder: "e.g. Power users, new signups, enterprise admins" },
      { key: "successMetric", label: "Goal or success metric", type: "text", placeholder: "e.g. Reduce churn, increase activation, hit Q2 revenue target" },
      { key: "constraints", label: "Risks or constraints", type: "text", placeholder: "e.g. 6-week timeline, limited engineering capacity, existing customers depend on this behavior" },
    ],
    exampleInput: "We're adding an AI-powered 'smart reply' feature to our B2B customer support platform. When a support agent views an open ticket, the feature will suggest 2–3 draft replies based on the conversation history and past resolved tickets.\n\nDecision: Should we launch this as a default-on feature for all plans, or gate it behind the Pro tier? We're worried that making it default-on will cause low-quality replies to go out, but gating it might slow adoption.",
  },
  {
    id: "review-pitch",
    label: "Pitch Review",
    workflowType: "review",
    icon: Presentation,
    tagline: "Does this narrative persuade the specific audience it is intended for?",
    bestFor: "Fundraising decks, partner pitches, strategic presentations",
    whatWeAnalyze: "Narrative clarity, claim strength, objection surfaces, investor-lens attractiveness, and logical flow.",
    whatToProvide: "Your pitch outline or narrative. The more complete, the sharper the feedback.",
    outputs: ["Weak points and gaps", "Likely investor objections", "Clearer framing suggestions", "Alignment with audience expectations", "Recommendation"],
    fields: [
      { key: "main", label: "Paste your pitch narrative or outline", type: "textarea", rows: 8, required: true, placeholder: "Paste your pitch deck outline, narrative script, or key claims. The more detail, the better." },
      { key: "audience", label: "Audience type", type: "text", placeholder: "e.g. Seed-stage investor, Series B VC, strategic partner, enterprise buyer" },
      { key: "stage", label: "Company stage", type: "text", placeholder: "e.g. Pre-revenue idea, MVP with early customers, $1M ARR" },
      { key: "coreClaim", label: "Core claim", type: "text", placeholder: "What is the single most important thing you need the audience to believe?" },
      { key: "concern", label: "Biggest concern about the pitch", type: "text", placeholder: "e.g. The market size argument feels weak, the differentiation is not clear" },
    ],
    exampleInput: "Problem: 60% of Series A–B SaaS companies miss their hiring targets because they can't predict team capacity 6 months out. Existing tools (spreadsheets, ATS data) are backward-looking.\n\nSolution: PlanForce — an AI headcount planning tool that ingests your ATS pipeline, revenue targets, and engineering velocity to generate a 6-month hiring forecast with scenario modeling.\n\nTraction: 3 design partners (all Series B SaaS, 50–150 employees). Letters of intent from 2. Expected ARR from these 3: $72K.\n\nAsk: Raising $1.2M pre-seed to build to 10 paying customers and prove repeatable CAC < $2K.",
  },
];

const REVIEW_CASES = USE_CASE_CONFIGS;

const STAGES = [
  { id: "idea", label: "Idea / concept" },
  { id: "mvp", label: "MVP / prototype" },
  { id: "launched", label: "Launched / live" },
  { id: "scaling", label: "Growing / scaling" },
];

/* ------------------------------------------------------------------ */
/*  Live progress loading screen                                       */
/* ------------------------------------------------------------------ */
const RESEARCH_SUB_STEPS = [
  "Scanning competitor landscape",
  "Mapping market dynamics",
  "Assessing risks and opportunities",
  "Synthesizing research brief",
];

function LiveProgressState({
  config,
  events,
}: {
  config: UseCaseConfig;
  events: DisplayEvent[];
}) {
  const researchStarted = events.some((e) => e.type === "stage");
  const researchEvent = events.find(
    (e): e is Extract<DisplayEvent, { type: "research_complete" }> =>
      e.type === "research_complete"
  );
  const personaStarts = events.filter(
    (e): e is Extract<DisplayEvent, { type: "persona_start" }> => e.type === "persona_start"
  );
  const personaCompletes = events.filter(
    (e): e is Extract<DisplayEvent, { type: "persona_complete" }> => e.type === "persona_complete"
  );

  const completedIds = new Set(personaCompletes.map((e) => e.id));
  const activePersona = personaStarts.find((s) => !completedIds.has(s.id));

  const totalSteps = 1 + personaStarts.length;
  const completedSteps = (researchEvent ? 1 : 0) + personaCompletes.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Sub-step animation during research phase
  const [subStepIdx, setSubStepIdx] = useState(0);
  useEffect(() => {
    if (!researchStarted || researchEvent) return;
    const interval = setInterval(() => {
      setSubStepIdx((prev) => {
        if (prev >= RESEARCH_SUB_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [researchStarted, researchEvent]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
    >
      <div
        className="h-14 flex items-center px-6"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span className="text-sm font-semibold">SocietyOS</span>
        <div className="ml-auto flex items-center gap-3">
          <div
            className="h-1 w-32 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                backgroundColor: "var(--accent-amber)",
              }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            {progressPct}%
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-6 py-16 gap-12">
        {/* Sidebar — live stage list */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="sticky top-16">
            <p className="section-label mb-5">
              Progress
            </p>
            <div className="space-y-0.5">
              {/* Research step */}
              {(() => {
                const done = !!researchEvent;
                const active = researchStarted && !done;
                return (
                  <div className="flex items-center gap-2.5 py-1.5">
                    <div
                      className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                      style={{
                        width: "18px",
                        height: "18px",
                        backgroundColor: done
                          ? "var(--accent-emerald)"
                          : active
                          ? "var(--accent-amber)"
                          : "var(--bg-2)",
                        border: active || done ? "none" : "1px solid var(--border-default)",
                      }}
                    >
                      {done ? (
                        <Check size={10} style={{ color: "var(--bg-0)" }} />
                      ) : active ? (
                        <Loader2 size={10} className="animate-spin" style={{ color: "var(--bg-0)" }} />
                      ) : null}
                    </div>
                    <span
                      className="text-sm transition-colors duration-300"
                      style={{
                        color: done
                          ? "var(--text-2)"
                          : active
                          ? "var(--text-1)"
                          : "var(--text-3)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      Market research
                    </span>
                  </div>
                );
              })()}

              {/* Persona steps */}
              {personaStarts.map((ps) => {
                const done = completedIds.has(ps.id);
                const active = activePersona?.id === ps.id;
                return (
                  <div key={ps.id} className="flex items-center gap-2.5 py-1.5">
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                      style={{
                        width: "18px",
                        height: "18px",
                        backgroundColor: done
                          ? "var(--accent-emerald)"
                          : active
                          ? "var(--accent-amber)"
                          : "var(--bg-2)",
                        border: active || done ? "none" : "1px solid var(--border-default)",
                      }}
                    >
                      {done ? (
                        <Check size={10} style={{ color: "var(--bg-0)" }} />
                      ) : active ? (
                        <Loader2 size={10} className="animate-spin" style={{ color: "var(--bg-0)" }} />
                      ) : null}
                    </div>
                    <span
                      className="text-sm transition-colors duration-300"
                      style={{
                        color: done
                          ? "var(--text-2)"
                          : active
                          ? "var(--text-1)"
                          : "var(--text-3)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {ps.emoji} {ps.name}
                    </span>
                  </div>
                );
              })}

              {/* Pending personas not yet announced */}
              {!researchEvent && (
                <div className="flex items-center gap-2.5 py-1.5">
                  <div
                    className="rounded-full"
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "1px solid var(--border-default)",
                    }}
                  />
                  <span className="text-sm" style={{ color: "var(--text-3)" }}>
                    Expert analyses
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content — actual findings */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="accent-chip mb-4">{config.label}</div>
            <h1
              className="font-bold mb-2"
              style={{ fontSize: "1.65rem", letterSpacing: "-0.025em" }}
            >
              Building your review
            </h1>
            <p style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
              This typically takes 30–90 seconds. Do not close this tab.
            </p>
          </div>

          {/* Research findings — shown when research_complete arrives */}
          {researchEvent && (
            <div
              className="rounded-lg p-5 mb-5"
              style={{
                border: "1px solid rgba(242, 169, 59, 0.20)",
                backgroundColor: "rgba(242, 169, 59, 0.04)",
              }}
            >
              <p
                className="section-label mb-4"
                style={{ color: "var(--accent-amber)" }}
              >
                Research complete
              </p>

              {/* Market snippet */}
              {researchEvent.summary.market_overview_snippet && (
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {researchEvent.summary.market_overview_snippet}
                  {researchEvent.summary.market_overview_snippet.length >= 218 ? "..." : ""}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 mb-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--accent-emerald-dim)",
                    color: "var(--accent-emerald)",
                  }}
                >
                  {researchEvent.summary.risk_count} risks identified
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--accent-amber-dim)",
                    color: "var(--accent-amber)",
                  }}
                >
                  {researchEvent.summary.opportunity_count} opportunities found
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--accent-cyan-dim)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  {researchEvent.summary.competitors.length} competitors mapped
                </span>
              </div>

              {/* Competitor chips */}
              {researchEvent.summary.competitors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {researchEvent.summary.competitors.map((c) => (
                    <span
                      key={c.name}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-2)",
                      }}
                    >
                      {c.name}
                      {c.domain ? (
                        <span style={{ color: "var(--text-3)" }}> · {c.domain}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Persona analysis snippets */}
          {personaCompletes.length > 0 && (
            <div className="space-y-2">
              {personaCompletes.map((pc) => {
                const ps = personaStarts.find((s) => s.id === pc.id);
                // Strip markdown headers/bold and extract first clean sentence
                const cleanText = pc.snippet
                  .replace(/\*\*[^*]+\*\*\s*/g, "")
                  .replace(/^#+\s.*/gm, "")
                  .replace(/\n+/g, " ")
                  .trim();
                const firstSentence = cleanText.match(/[^.!?]+[.!?]/)?.[0]?.trim() ?? cleanText.slice(0, 120);
                return (
                  <div
                    key={pc.id}
                    className="rounded-lg px-4 py-3 flex items-start gap-3"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--bg-1)",
                    }}
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0">{ps?.emoji}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium mr-2" style={{ color: "var(--text-1)" }}>
                        {pc.name}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-3)" }}>
                        {firstSentence}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active persona — currently analyzing */}
          {activePersona && (
            <div
              className="rounded-lg p-4 mt-3"
              style={{
                border: "1px solid rgba(242, 169, 59, 0.18)",
                backgroundColor: "rgba(242, 169, 59, 0.03)",
              }}
            >
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                <span className="text-sm" style={{ color: "var(--accent-amber)" }}>
                  {activePersona.emoji} {activePersona.name} is analyzing...
                </span>
              </div>
            </div>
          )}

          {/* Initial state before first event */}
          {!researchStarted && (
            <div
              className="rounded-lg p-5"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-1)",
              }}
            >
              <div className="flex items-center gap-3">
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  Connecting...
                </p>
              </div>
            </div>
          )}

          {/* Research in progress — before research_complete */}
          {researchStarted && !researchEvent && (
            <div
              className="rounded-lg p-5"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-1)",
              }}
            >
              <div className="space-y-3">
                {RESEARCH_SUB_STEPS.map((label, i) => {
                  const isVisible = i <= subStepIdx;
                  const isDone = i < subStepIdx;
                  const isActive = i === subStepIdx;
                  if (!isVisible) return null;
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-3"
                      style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
                    >
                      <div className="flex-shrink-0" style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone ? (
                          <Check size={13} style={{ color: "var(--accent-emerald)" }} />
                        ) : isActive ? (
                          <Loader2 size={13} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                        ) : (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--border-default)" }} />
                        )}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          color: isDone ? "var(--text-2)" : isActive ? "var(--text-1)" : "var(--text-3)",
                          fontWeight: isActive ? 500 : 400,
                          transition: "color 0.3s ease",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Choose use case                                            */
/* ------------------------------------------------------------------ */
function StepChoose({
  selected,
  onSelect,
}: {
  selected: UseCase | null;
  onSelect: (id: UseCase) => void;
}) {
  const selectedConfig = selected ? USE_CASE_CONFIGS.find((u) => u.id === selected) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
      <div>
        <div className="mb-8">
          <h2
            className="font-bold mb-1"
            style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
          >
            Choose a review type
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Select the type of strategic review that fits your decision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REVIEW_CASES.map((uc) => (
            <UseCaseSelectCard
              key={uc.id}
              uc={uc}
              isSelected={selected === uc.id}
              onSelect={() => onSelect(uc.id)}
            />
          ))}
        </div>
      </div>

      {/* Right: How this works panel */}
      <div className="lg:sticky lg:top-24">
        {selectedConfig ? (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <p className="section-label mb-1">
                How this works
              </p>
              <p className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
                {selectedConfig.label}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "var(--text-3)" }}
                >
                  What we analyze
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {selectedConfig.whatWeAnalyze}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "var(--text-3)" }}
                >
                  What to provide
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {selectedConfig.whatToProvide}
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: "var(--text-3)" }}
                >
                  Outputs
                </p>
                <div className="space-y-1.5">
                  {selectedConfig.outputs.map((o) => (
                    <div key={o} className="flex items-start gap-2">
                      <div
                        className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: "var(--accent-amber)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>
                        {o}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="pt-3"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor:
                      selectedConfig.workflowType === "review"
                        ? "var(--accent-amber-dim)"
                        : "var(--accent-emerald-dim)",
                    color:
                      selectedConfig.workflowType === "review"
                        ? "var(--accent-amber)"
                        : "var(--accent-emerald)",
                  }}
                >
                  Expert Review
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg p-5"
            style={{ border: "1px solid rgba(255, 255, 255, 0.06)", backgroundColor: "var(--panel)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Select a use case to see how it works and what you will receive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function UseCaseSelectCard({
  uc,
  isSelected,
  onSelect,
}: {
  uc: UseCaseConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = uc.icon;
  return (
    <button
      onClick={onSelect}
      className="text-left p-4 rounded-lg transition-all duration-150"
      style={{
        border: isSelected
          ? "1px solid rgba(242, 169, 59, 0.40)"
          : "1px solid var(--border-subtle)",
        backgroundColor: isSelected
          ? "rgba(242, 169, 59, 0.08)"
          : "var(--bg-1)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className="p-1.5 rounded-md"
          style={{
            backgroundColor: isSelected
              ? "rgba(242, 169, 59, 0.15)"
              : "var(--bg-2)",
          }}
        >
          <Icon
            size={13}
            style={{
              color: isSelected ? "var(--accent-amber)" : "var(--text-3)",
            }}
          />
        </div>
        {isSelected && (
          <Check size={12} style={{ color: "var(--accent-amber)" }} />
        )}
      </div>
      <p
        className="font-semibold text-sm mb-1"
        style={{
          color: isSelected ? "var(--text-1)" : "var(--text-2)",
        }}
      >
        {uc.label}
      </p>
      <p
        className="text-xs leading-relaxed mb-2"
        style={{ color: isSelected ? "var(--text-2)" : "var(--text-3)" }}
      >
        {uc.tagline}
      </p>
      {uc.outputs?.[0] && (
        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
          → {uc.outputs[0]}
        </p>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Add context  (Smart intake — multi-phase)                  */
/* ------------------------------------------------------------------ */
type ContextPhase = "describe" | "loading-questions" | "answer" | "loading-expand" | "review-brief" | "fallback";

interface IntakeQuestion {
  id: string;
  type: "mcq" | "text";
  question: string;
  options?: string[];
  why_it_matters: string;
}

const STEP2_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function StepContext({
  config,
  fieldValues,
  setFieldValue,
  stage,
  setStage,
  expandedBrief,
  setExpandedBrief,
  extractedFields,
  setExtractedFields,
  autoTitle,
  setAutoTitle,
  smartQuestionsReady,
  setSmartQuestionsReady,
}: {
  config: UseCaseConfig;
  fieldValues: Record<string, string>;
  setFieldValue: (key: string, val: string) => void;
  stage: string;
  setStage: (s: string) => void;
  expandedBrief: string;
  setExpandedBrief: (s: string) => void;
  extractedFields: Record<string, string>;
  setExtractedFields: (f: Record<string, string>) => void;
  autoTitle: string;
  setAutoTitle: (s: string) => void;
  smartQuestionsReady: boolean;
  setSmartQuestionsReady: (b: boolean) => void;
}) {
  const [phase, setPhase] = useState<ContextPhase>("describe");
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editingBrief, setEditingBrief] = useState(false);

  const mainInput = fieldValues["main"] ?? "";
  const useCase = config.id;

  // Reset smartQuestionsReady when going back to earlier phases
  useEffect(() => {
    if (phase !== "review-brief") {
      setSmartQuestionsReady(false);
    }
  }, [phase, setSmartQuestionsReady]);

  const handleGenerateQuestions = async () => {
    if (mainInput.trim().length < 20) return;
    setPhase("loading-questions");
    try {
      const res = await fetch(`${STEP2_API}/api/founder/intake/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: mainInput.trim(), use_case: useCase }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) throw new Error("No questions returned");
      setQuestions(data.questions);
      setAnswers({});
      setPhase("answer");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reach the server";
      toast.error(`Smart questions failed: ${msg}. You can fill in the form manually.`);
      setPhase("fallback");
    }
  };


  const handleExpandBrief = async () => {
    setPhase("loading-expand");
    try {
      const answerPayload = questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: answers[q.id] ?? "",
      }));
      const res = await fetch(`${STEP2_API}/api/founder/intake/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: mainInput.trim(), use_case: useCase, answers: answerPayload }),
      });
      if (!res.ok) throw new Error("Failed to expand brief");
      const data = await res.json();
      setExpandedBrief(data.expanded_brief ?? "");
      setAutoTitle(data.title ?? "");
      setExtractedFields(data.extracted_fields ?? {});
      setSmartQuestionsReady(true);
      setPhase("review-brief");
    } catch {
      // Fallback: concatenate idea + answers
      const fallbackBrief = `${mainInput.trim()}\n\n${questions.map((q) => `${q.question}: ${answers[q.id] ?? ""}`).join("\n")}`;
      setExpandedBrief(fallbackBrief);
      setAutoTitle(mainInput.trim().slice(0, 80));
      setSmartQuestionsReady(true);
      setPhase("review-brief");
    }
  };

  // --- Describe phase ---
  if (phase === "describe") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
        <div className="space-y-6">
          <div>
            <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
              {config.label}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Describe your idea in a few sentences. We&apos;ll ask smart follow-up questions to build a complete brief.
            </p>
          </div>

          <div>
            <label className="input-label" style={{ color: "var(--text-2)" }}>
              Your idea <span style={{ color: "var(--accent-amber)" }}>*</span>
            </label>
            <textarea
              value={mainInput}
              onChange={(e) => setFieldValue("main", e.target.value)}
              placeholder={config.fields.find((f) => f.key === "main")?.placeholder ?? "Describe your idea..."}
              rows={7}
              className="input-field resize-none leading-relaxed"
              style={{ padding: "0.75rem 1rem" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(242, 169, 59, 0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "")}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {mainInput.length < 20
                  ? `Minimum 20 characters — ${20 - mainInput.length} more needed`
                  : `${mainInput.length} characters`}
              </p>
              {config.exampleInput && (
                <button
                  type="button"
                  onClick={() => setFieldValue("main", config.exampleInput!)}
                  className="text-xs"
                  style={{ color: "var(--accent-amber)" }}
                >
                  Load example →
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerateQuestions}
            disabled={mainInput.trim().length < 20}
            className="btn-primary flex items-center gap-2"
            style={{
              padding: "0.65rem 1.25rem",
              opacity: mainInput.trim().length < 20 ? 0.4 : 1,
              cursor: mainInput.trim().length < 20 ? "not-allowed" : "pointer",
            }}
          >
            <Lightbulb size={14} />
            Generate Smart Questions
          </button>
        </div>

        {/* Right sidebar */}
        <div className="lg:sticky lg:top-24">
          <div
            className="rounded-lg p-5"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <p className="section-label mb-3">How it works</p>
            <div className="space-y-3">
              {[
                { num: "1", text: "Describe your idea above" },
                { num: "2", text: "Answer 5–7 smart follow-up questions" },
                { num: "3", text: "Review your AI-expanded brief" },
                { num: "4", text: "Configure and submit for analysis" },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-2.5">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
                  >
                    {s.num}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{s.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Best for: {config.bestFor}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading questions phase ---
  if (phase === "loading-questions") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
        <p className="text-sm font-medium">Analyzing your idea...</p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Generating smart follow-up questions</p>
      </div>
    );
  }

  // --- Answer phase ---
  if (phase === "answer") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
              A few follow-up questions
            </h2>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Your answers help us build a complete picture. Answer all to continue.
            </p>
          </div>
          <button
            onClick={() => setPhase("describe")}
            className="text-xs flex items-center gap-1 transition-colors hover:text-[var(--text-1)]"
            style={{ color: "var(--text-3)" }}
          >
            <ArrowLeft size={12} />
            Edit idea
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-lg p-5"
              style={{
                border: (answers[q.id] ?? "").trim()
                  ? "1px solid rgba(56, 178, 125, 0.3)"
                  : "1px solid var(--border-default)",
                backgroundColor: (answers[q.id] ?? "").trim()
                  ? "rgba(56, 178, 125, 0.04)"
                  : "var(--bg-1)",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
            >
              <p className="text-sm font-medium mb-1.5">{q.question}</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>{q.why_it_matters}</p>

              {q.type === "mcq" && q.options ? (
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className="w-full text-left rounded-md px-3 py-2 text-xs transition-colors"
                      style={{
                        border: answers[q.id] === opt
                          ? "1px solid rgba(242, 169, 59, 0.5)"
                          : "1px solid var(--border-subtle)",
                        backgroundColor: answers[q.id] === opt
                          ? "rgba(242, 169, 59, 0.10)"
                          : "transparent",
                        color: answers[q.id] === opt ? "var(--text-1)" : "var(--text-2)",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer..."
                  className="input-field text-sm"
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(242, 169, 59, 0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            All questions are optional
          </span>
          <button
            onClick={handleExpandBrief}
            className="btn-primary flex items-center gap-2"
            style={{ padding: "0.65rem 1.25rem" }}
          >
            Build Brief
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // --- Loading expand phase ---
  if (phase === "loading-expand") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
        <p className="text-sm font-medium">Building your brief...</p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Synthesizing your idea and answers into a complete brief</p>
      </div>
    );
  }

  // --- Review brief phase ---
  if (phase === "review-brief") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
                Review your brief
              </h2>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                This is what will be sent for analysis. Edit if needed, then proceed.
              </p>
            </div>
            <button
              onClick={() => setPhase("answer")}
              className="text-xs flex items-center gap-1 transition-colors hover:text-[var(--text-1)]"
              style={{ color: "var(--text-3)" }}
            >
              <ArrowLeft size={12} />
              Back to questions
            </button>
          </div>

          {/* Auto title */}
          <div>
            <label className="input-label">Title</label>
            <input
              type="text"
              value={autoTitle}
              onChange={(e) => setAutoTitle(e.target.value)}
              className="input-field"
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(242, 169, 59, 0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "")}
            />
          </div>

          {/* Brief */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Expanded brief</label>
              <button
                onClick={() => setEditingBrief(!editingBrief)}
                className="text-xs transition-colors hover:text-[var(--accent-amber)]"
                style={{ color: "var(--text-3)" }}
              >
                {editingBrief ? "Done editing" : "Edit"}
              </button>
            </div>
            {editingBrief ? (
              <textarea
                value={expandedBrief}
                onChange={(e) => setExpandedBrief(e.target.value)}
                rows={12}
                className="input-field resize-none leading-relaxed"
                style={{ padding: "0.75rem 1rem" }}
              />
            ) : (
              <div
                className="rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-1)",
                  color: "var(--text-2)",
                }}
              >
                {expandedBrief}
              </div>
            )}
          </div>

          {/* Extracted fields as pills */}
          {Object.keys(extractedFields).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(extractedFields).map(([key, val]) =>
                val ? (
                  <span
                    key={key}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
                  >
                    {key}: {val}
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Stage selector for review workflows */}
          {config.workflowType === "review" && (
            <div>
              <label className="input-label">Current stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{
                      border: stage === s.id ? "1px solid rgba(242, 169, 59, 0.40)" : "1px solid var(--border-default)",
                      backgroundColor: stage === s.id ? "rgba(242, 169, 59, 0.10)" : "var(--bg-1)",
                      color: stage === s.id ? "var(--text-1)" : "var(--text-2)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:sticky lg:top-24">
          <div
            className="rounded-lg p-5"
            style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
          >
            <p className="section-label mb-3">You will get</p>
            <div className="space-y-2">
              {config.outputs.map((o) => (
                <div key={o} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{o}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Best for: {config.bestFor}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Fallback: static form (original behavior) ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
      <div className="space-y-6">
        <div>
          <h2 className="font-bold mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            {config.label}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {config.tagline}
          </p>
        </div>

        {config.fields.map((field) => {
          const isMain = field.key === "main";
          const val = fieldValues[field.key] ?? "";
          return (
            <div key={field.key}>
              <label className="input-label" style={{ color: isMain ? "var(--text-2)" : "var(--text-3)" }}>
                {field.label}
                {field.required && <span style={{ color: "var(--accent-amber)", marginLeft: "4px" }}>*</span>}
              </label>
              {field.type === "textarea" ? (
                <>
                  <textarea
                    value={val}
                    onChange={(e) => setFieldValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows ?? 5}
                    className="input-field resize-none leading-relaxed"
                    style={{ padding: "0.75rem 1rem" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(242, 169, 59, 0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                  />
                  {isMain && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                      {val.length < 20 ? `Minimum 20 characters — ${20 - val.length} more needed` : `${val.length} characters`}
                    </p>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="input-field"
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(242, 169, 59, 0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                />
              )}
            </div>
          );
        })}

        {config.workflowType === "review" && (
          <div>
            <label className="input-label">Current stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    border: stage === s.id ? "1px solid rgba(242, 169, 59, 0.40)" : "1px solid var(--border-default)",
                    backgroundColor: stage === s.id ? "rgba(242, 169, 59, 0.10)" : "var(--bg-1)",
                    color: stage === s.id ? "var(--text-1)" : "var(--text-2)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-24">
        <div
          className="rounded-lg p-5"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          <p className="section-label mb-3">You will get</p>
          <div className="space-y-2">
            {config.outputs.map((o) => (
              <div key={o} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)" }} />
                <span className="text-xs" style={{ color: "var(--text-2)" }}>{o}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Best for: {config.bestFor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Configure                                                  */
/* ------------------------------------------------------------------ */
function StepConfigure({
  config,
  personas,
  selectedLenses,
  toggleLens,
  depth,
  setDepth,
}: {
  config: UseCaseConfig;
  personas: PersonaMeta[];
  selectedLenses: string[];
  toggleLens: (id: string) => void;
  depth: "quick" | "deep";
  setDepth: (d: "quick" | "deep") => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
      <div className="space-y-8">
        <div>
          <h2
            className="font-bold mb-1"
            style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
          >
            Configure your review
          </h2>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Select which expert perspectives you want in the analysis.
          </p>
        </div>

          <section>
            <div className="flex items-baseline justify-between mb-1">
              <label className="section-label">
                Expert Advisors
              </label>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {selectedLenses.length} of {personas.length} selected
              </span>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              All advisors are preselected — remove any you don&apos;t want in the analysis.
            </p>
            {personas.length === 0 && (
              <div className="flex items-center gap-2 py-6" style={{ color: "var(--text-3)" }}>
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Loading advisors...</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personas.map((p) => {
                const active = selectedLenses.includes(p.id);
                const color = p.color ?? "#888";
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleLens(p.id)}
                    className="text-left p-4 rounded-lg transition-all duration-150"
                    style={{
                      border: active
                        ? `1px solid ${color}55`
                        : "1px solid var(--border-subtle)",
                      backgroundColor: active
                        ? `${color}0d`
                        : "var(--bg-1)",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <span className="text-xl flex-shrink-0 leading-none mt-0.5">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-semibold text-sm leading-tight block mb-0.5"
                          style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
                        >
                          {p.name}
                        </span>
                        <span
                          className="inline-block text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: active ? `${color}22` : "var(--bg-2)",
                            color: active ? color : "var(--text-3)",
                          }}
                        >
                          {p.archetype}
                        </span>
                      </div>
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: active ? color : "transparent",
                          border: active ? "none" : "1px solid var(--border-strong)",
                        }}
                      >
                        {active && <Check size={9} style={{ color: "var(--bg-0)" }} />}
                      </div>
                    </div>
                    <p
                      className="text-xs leading-relaxed mb-3"
                      style={{ color: active ? "var(--text-3)" : "var(--text-3)" }}
                    >
                      {p.tagline}
                    </p>
                    {p.strengths && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.strengths.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: active ? `${color}18` : "var(--bg-2)",
                              color: active ? color : "var(--text-3)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>



      </div>

      {/* Right: summary panel */}
      <div className="lg:sticky lg:top-24">
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <p className="section-label">
              Run summary
            </p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Type</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                {config.label}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Mode</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                Expert Review
              </p>
            </div>
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
                  Lenses ({selectedLenses.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {personas.filter((p) => selectedLenses.includes(p.id)).map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${p.color ?? "#888"}22`,
                        color: p.color ?? "var(--text-2)",
                      }}
                    >
                      {p.archetype}
                    </span>
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
/*  Stepper header                                                     */
/* ------------------------------------------------------------------ */
function StepperHeader({
  step,
  config,
  canAdvance,
  onBack,
  onNext,
  onSubmit,
  submitting,
}: {
  step: 1 | 2 | 3;
  config: UseCaseConfig | null;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const steps = ["Choose", "Context", "Configure"];
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
                    backgroundColor: done
                      ? "var(--accent-emerald)"
                      : active
                      ? "var(--accent-amber)"
                      : "var(--panel-elevated)",
                    color: done || active ? "var(--bg-0)" : "var(--text-3)",
                  }}
                >
                  {done ? <Check size={10} /> : num}
                </div>
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{
                    color: active
                      ? "var(--text-1)"
                      : done
                      ? "var(--text-3)"
                      : "var(--text-3)",
                  }}
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
        <Link
          href="/reviews/debug"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all"
          style={{ borderColor: "var(--border-default)", color: "var(--text-3)" }}
          title="Pipeline Lab — test steps individually"
        >
          <FlaskConical size={12} />
          Lab
        </Link>
        {step > 1 && (
          <button
            onClick={onBack}
            className="btn-secondary"
          >
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
              backgroundColor: canAdvance ? "var(--accent-amber)" : "var(--panel-elevated)",
              color: canAdvance ? "var(--bg-0)" : "var(--text-3)",
              cursor: canAdvance ? "pointer" : "not-allowed",
            }}
          >
            Run Review
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main intake form                                                   */
/* ------------------------------------------------------------------ */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ------------------------------------------------------------------ */
/*  Feature Review — Context Pack + Feature Intake                    */
/* ------------------------------------------------------------------ */

const FEATURE_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ContextPackMeta {
  id: string;
  name: string;
  product_summary: string;
  product_stage: string;
  primary_user: string;
  context_summary: string;
  updated_at: string;
}

function FeatureIntakeStep({
  fieldValues,
  setFieldValue,
  contextPackId,
  setContextPackId,
  contextPackName,
  setContextPackName,
  contextPackData,
  setContextPackData,
  featureName,
  setFeatureName,
  affectedUsers,
  setAffectedUsers,
  successMetric,
  setSuccessMetric,
  featureConstraints,
  setFeatureConstraints,
  featureProblem,
  setFeatureProblem,
  alternativesConsidered,
  setAlternativesConsidered,
  featureSubStep,
  setFeatureSubStep,
  getIdToken,
}: {
  fieldValues: Record<string, string>;
  setFieldValue: (key: string, val: string) => void;
  contextPackId: string | null;
  setContextPackId: (id: string | null) => void;
  contextPackName: string;
  setContextPackName: (n: string) => void;
  contextPackData: Record<string, string> | null;
  setContextPackData: (d: Record<string, string> | null) => void;
  featureName: string;
  setFeatureName: (n: string) => void;
  affectedUsers: string;
  setAffectedUsers: (v: string) => void;
  successMetric: string;
  setSuccessMetric: (v: string) => void;
  featureConstraints: string;
  setFeatureConstraints: (v: string) => void;
  featureProblem: string;
  setFeatureProblem: (v: string) => void;
  alternativesConsidered: string;
  setAlternativesConsidered: (v: string) => void;
  featureSubStep: 1 | 2;
  setFeatureSubStep: (s: 1 | 2) => void;
  getIdToken: () => Promise<string | null>;
}) {
  const [packs, setPacks] = useState<ContextPackMeta[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingFileInputRef = useRef<HTMLInputElement>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    product_summary: "",
    primary_user: "",
    product_stage: "",
    core_workflow: "",
    business_model: "",
    constraints: "",
    pasted_notes: "",
  });

  useEffect(() => {
    (async () => {
      const token = await getIdToken();
      if (!token) { setLoadingPacks(false); return; }
      try {
        const res = await fetch(`${FEATURE_API}/api/knowledge-packs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPacks(data.packs ?? []);
        }
      } catch { /* silently ignore */ }
      setLoadingPacks(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePack = async () => {
    if (!createForm.name || !createForm.product_summary || !createForm.primary_user || !createForm.product_stage || !createForm.core_workflow) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setCreateLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`${FEATURE_API}/api/knowledge-packs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create pack");
      const data = await res.json();
      const pack: ContextPackMeta = data.pack;
      // Upload file if one was attached
      if (fileToUpload && token) {
        const fd = new FormData();
        fd.append("file", fileToUpload);
        await fetch(`${FEATURE_API}/api/knowledge-packs/${pack.id}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        setFileToUpload(null);
      }
      setPacks((prev) => [pack, ...prev]);
      setContextPackId(pack.id);
      setContextPackName(pack.name);
      setShowCreateForm(false);
      setCreateForm({ name: "", product_summary: "", primary_user: "", product_stage: "", core_workflow: "", business_model: "", constraints: "", pasted_notes: "" });
      toast.success("Knowledge pack created");
    } catch {
      toast.error("Could not create knowledge pack. Please try again.");
    }
    setCreateLoading(false);
  };

  const handleUploadToExistingPack = async (packId: string, file: File) => {
    setUploadingFile(true);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${FEATURE_API}/api/knowledge-packs/${packId}/files`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(`File "${file.name}" added to pack`);
    } catch {
      toast.error("File upload failed. Please try again.");
    }
    setUploadingFile(false);
  };

  // ── Sub-step 1: Product Context ──
  if (featureSubStep === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>Step 1 of 2</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
            Product context
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
            Attach a knowledge pack so every expert reviews this feature knowing the product it belongs to. You can skip this if you prefer.
          </p>
        </div>

        {/* Existing packs */}
        {loadingPacks ? (
          <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-3)" }}>
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm">Loading your knowledge packs…</span>
          </div>
        ) : packs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>Your knowledge packs</p>
            {packs.map((pack) => (
              <button
                key={pack.id}
                onClick={() => {
                  const isSelected = contextPackId === pack.id;
                  setContextPackId(isSelected ? null : pack.id);
                  setContextPackName(isSelected ? "" : pack.name);
                  setContextPackData(isSelected ? null : {
                    product_summary: pack.product_summary ?? "",
                    primary_user: pack.primary_user ?? "",
                    product_stage: pack.product_stage ?? "",
                  });
                }}
                className="w-full text-left rounded-xl p-4 transition-colors"
                style={{
                  border: contextPackId === pack.id
                    ? "1px solid var(--accent-amber)"
                    : "1px solid var(--border-subtle)",
                  backgroundColor: contextPackId === pack.id
                    ? "rgba(242, 169, 59, 0.06)"
                    : "var(--bg-1)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {pack.name}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-3)" }}>
                      {pack.product_summary}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                      {pack.primary_user} · {pack.product_stage}
                    </p>
                  </div>
                  {contextPackId === pack.id && (
                    <div className="flex items-center gap-2">
                      {/* Upload file to existing selected pack */}
                      <input
                        ref={existingFileInputRef}
                        type="file"
                        accept=".pdf,.txt,.md"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadToExistingPack(pack.id, f);
                          if (existingFileInputRef.current) existingFileInputRef.current.value = "";
                        }}
                      />
                      <button
                        onClick={(evt) => { evt.stopPropagation(); existingFileInputRef.current?.click(); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
                        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-3)", backgroundColor: "var(--bg-2)" }}
                        title="Upload a PDF or text file to augment this knowledge pack"
                      >
                        {uploadingFile ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                        Upload file
                      </button>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--accent-amber)" }}>
                        <Check size={11} style={{ color: "var(--bg-0)" }} />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          !showCreateForm && (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              You have no saved knowledge packs yet.
            </p>
          )
        )}

        {/* Create new pack */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--accent-amber)" }}
          >
            <Plus size={14} />
            Create a new knowledge pack
          </button>
        ) : (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-1)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>New knowledge pack</p>
              <button onClick={() => setShowCreateForm(false)} className="text-xs" style={{ color: "var(--text-3)" }}>Cancel</button>
            </div>
            {[
              { key: "name", label: "Pack name *", placeholder: "e.g. Acme — B2B Analytics Dashboard", required: true },
              { key: "product_summary", label: "What does the product do? *", placeholder: "2–3 sentences describing the product and the problem it solves." },
              { key: "primary_user", label: "Primary user *", placeholder: "e.g. Operations managers at mid-market logistics companies" },
              { key: "product_stage", label: "Product stage *", placeholder: "e.g. Post-launch, ~300 paying customers, Series A" },
              { key: "core_workflow", label: "Core workflow *", placeholder: "The main job the product does for users day-to-day." },
              { key: "business_model", label: "Business model (optional)", placeholder: "e.g. SaaS, $299/mo per team, annual contracts" },
              { key: "constraints", label: "Known constraints (optional)", placeholder: "e.g. Cannot break existing CSV export, enterprise SSO required" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>{f.label}</label>
                {f.key === "product_summary" || f.key === "core_workflow" ? (
                  <textarea
                    rows={3}
                    value={createForm[f.key as keyof typeof createForm]}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
                    style={{
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-2)",
                      color: "var(--text-1)",
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={createForm[f.key as keyof typeof createForm]}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-2)",
                      color: "var(--text-1)",
                    }}
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>Paste notes or docs (optional)</label>
              <textarea
                rows={4}
                value={createForm.pasted_notes}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, pasted_notes: e.target.value }))}
                placeholder="Paste any relevant product notes, PRDs, design docs, or background context."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-2)",
                  color: "var(--text-1)",
                }}
              />
            </div>
            {/* File upload */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>Upload a document (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => setFileToUpload(e.target.files?.[0] ?? null)}
              />
              {fileToUpload ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: "1px solid var(--accent-amber)", backgroundColor: "rgba(242,169,59,0.06)" }}>
                  <FileText size={13} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
                  <span className="text-xs truncate flex-1" style={{ color: "var(--text-2)" }}>{fileToUpload.name}</span>
                  <button onClick={() => { setFileToUpload(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs" style={{ color: "var(--text-3)" }}>Remove</button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{ border: "1px dashed var(--border-default)", color: "var(--text-3)", width: "100%" }}
                >
                  <Upload size={12} />
                  Upload PDF, .txt, or .md — will be extracted and injected into the analysis
                </button>
              )}
            </div>
            <button
              onClick={handleCreatePack}
              disabled={createLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: createLoading ? "var(--panel-elevated)" : "var(--accent-amber)",
                color: createLoading ? "var(--text-3)" : "var(--bg-0)",
              }}
            >
              {createLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {createLoading ? "Creating…" : "Create pack"}
            </button>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={() => setFeatureSubStep(2)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--accent-amber)",
            color: "var(--bg-0)",
          }}
        >
          {contextPackId ? (
            <>Continue with <strong>{contextPackName}</strong></>
          ) : (
            "Continue without knowledge pack"
          )}
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ── Sub-step 2: Feature Proposal ──
  const description = fieldValues["main"] ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setFeatureSubStep(1)}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--text-3)" }}
          >
            <ArrowLeft size={12} /> Back
          </button>
          {contextPackId && (
            <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(242,169,59,0.1)", color: "var(--accent-amber)" }}>
              <Building2 size={11} />
              {contextPackName}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>Step 2 of 2</p>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
          Describe the feature decision
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
          Explain what you are deciding: what the feature does, what it changes, and why this decision matters now.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Feature name
        </label>
        <input
          type="text"
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
          placeholder="e.g. AI-powered smart reply, Bulk import, SSO login"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Feature description <span style={{ color: "var(--accent-amber)" }}>*</span>
        </label>
        <textarea
          rows={7}
          value={description}
          onChange={(e) => setFieldValue("main", e.target.value)}
          placeholder="Describe the feature: what it does, what it changes, and the decision you need to make. Include any context about why this is being considered now."
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
        <p className="text-xs mt-1" style={{ color: description.length < 20 ? "var(--text-3)" : "transparent" }}>
          Minimum 20 characters required
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
            Affected users
          </label>
          <input
            type="text"
            value={affectedUsers}
            onChange={(e) => setAffectedUsers(e.target.value)}
            placeholder="e.g. Power users, new signups, all plans"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-1)",
              color: "var(--text-1)",
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
            Success metric
          </label>
          <input
            type="text"
            value={successMetric}
            onChange={(e) => setSuccessMetric(e.target.value)}
            placeholder="e.g. Reduce support tickets by 30%"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-1)",
              color: "var(--text-1)",
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Constraints or risks
        </label>
        <input
          type="text"
          value={featureConstraints}
          onChange={(e) => setFeatureConstraints(e.target.value)}
          placeholder="e.g. 6-week timeline, cannot break existing behavior for enterprise customers"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          What user problem does this feature solve? <span className="font-normal" style={{ color: "var(--text-3)" }}>(optional)</span>
        </label>
        <textarea
          rows={2}
          value={featureProblem}
          onChange={(e) => setFeatureProblem(e.target.value)}
          placeholder="e.g. Users struggle to find relevant past tickets, leading to duplicate resolutions and wasted time."
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Alternatives considered <span className="font-normal" style={{ color: "var(--text-3)" }}>(optional)</span>
        </label>
        <input
          type="text"
          value={alternativesConsidered}
          onChange={(e) => setAlternativesConsidered(e.target.value)}
          placeholder="e.g. Third-party integrations, manual workaround, postpone to Q3"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      {/* ContextPak inline preview */}
      {contextPackId && contextPackData && (
        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(242, 169, 59, 0.3)", backgroundColor: "rgba(242, 169, 59, 0.04)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-amber)" }}>
            Knowledge pack in use: {contextPackName}
          </p>
          <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--text-2)" }}>
            {(contextPackData.product_summary ?? "").slice(0, 120)}{contextPackData.product_summary?.length > 120 ? "…" : ""}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}>
              {contextPackData.product_stage}
            </span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {contextPackData.primary_user}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-3)" }}>
            Our experts will evaluate this feature against {contextPackData.primary_user} needs and your known constraints.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pitch Intake Step                                                  */
/* ------------------------------------------------------------------ */
const PITCH_SECTION_OPTIONS = ["Problem", "Solution", "Market", "Traction", "Ask", "Team", "Business Model", "Competition"];

function PitchIntakeStep({
  fieldValues,
  setFieldValue,
  pitchSubStep,
  setPitchSubStep,
  pitchInputMode,
  setPitchInputMode,
  pitchFileId,
  setPitchFileId,
  pitchFileName,
  setPitchFileName,
  pitchPageCount,
  setPitchPageCount,
  pitchExtractedText,
  setPitchExtractedText,
  pitchExtractExpanded,
  setPitchExtractExpanded,
  pitchUploadLoading,
  setPitchUploadLoading,
  pitchSections,
  setPitchSections,
  targetCheckSize,
  setTargetCheckSize,
  getIdToken,
}: {
  fieldValues: Record<string, string>;
  setFieldValue: (key: string, val: string) => void;
  pitchSubStep: 1 | 2;
  setPitchSubStep: (s: 1 | 2) => void;
  pitchInputMode: "upload" | "paste";
  setPitchInputMode: (m: "upload" | "paste") => void;
  pitchFileId: string | null;
  setPitchFileId: (id: string | null) => void;
  pitchFileName: string;
  setPitchFileName: (n: string) => void;
  pitchPageCount: number | null;
  setPitchPageCount: (n: number | null) => void;
  pitchExtractedText: string;
  setPitchExtractedText: (t: string) => void;
  pitchExtractExpanded: boolean;
  setPitchExtractExpanded: (v: boolean) => void;
  pitchUploadLoading: boolean;
  setPitchUploadLoading: (v: boolean) => void;
  pitchSections: string[];
  setPitchSections: (s: string[]) => void;
  targetCheckSize: string;
  setTargetCheckSize: (v: string) => void;
  getIdToken: () => Promise<string | null>;
}) {
  const pitchFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 20 MB.");
      return;
    }
    setPitchUploadLoading(true);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/reviews/pitch-upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPitchFileId(data.file_id);
      setPitchFileName(data.filename);
      setPitchPageCount(data.page_count ?? null);
      setPitchExtractedText(data.extracted_text ?? "");
      setPitchExtractExpanded(false);
      if (data.extraction_warning) {
        // Image-based PDF — switch to paste mode with a helpful message
        setPitchInputMode("paste");
        toast.error(data.extraction_warning);
      } else {
        toast.success(`"${data.filename}" extracted successfully`);
      }
    } catch {
      toast.error("Could not process the file. Please try again or paste your pitch text.");
    }
    setPitchUploadLoading(false);
  };

  const toggleSection = (s: string) => {
    setPitchSections(
      pitchSections.includes(s) ? pitchSections.filter((x) => x !== s) : [...pitchSections, s]
    );
  };

  // Sub-step 1: Upload or Paste
  if (pitchSubStep === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>Step 1 of 2</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
            Your pitch
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
            Upload your pitch deck or paste your narrative. The more complete, the sharper the feedback.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {(["upload", "paste"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPitchInputMode(mode)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                border: pitchInputMode === mode ? "1px solid var(--accent-amber)" : "1px solid var(--border-subtle)",
                backgroundColor: pitchInputMode === mode ? "rgba(242, 169, 59, 0.06)" : "var(--bg-1)",
                color: pitchInputMode === mode ? "var(--accent-amber)" : "var(--text-3)",
              }}
            >
              {mode === "upload" ? "📎 Upload Pitch Deck" : "✏️ Paste Narrative"}
            </button>
          ))}
        </div>

        {/* Upload zone */}
        {pitchInputMode === "upload" && (
          <div>
            <input
              ref={pitchFileRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                if (pitchFileRef.current) pitchFileRef.current.value = "";
              }}
            />
            {pitchFileId ? (
              <div className="space-y-3">
                <div
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{ border: "1px solid rgba(56, 178, 125, 0.4)", backgroundColor: "rgba(56, 178, 125, 0.05)" }}
                >
                  <FileText size={16} style={{ color: "rgb(56, 178, 125)", flexShrink: 0, marginTop: 2 }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {pitchFileName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {pitchPageCount !== null ? `${pitchPageCount} pages · ` : ""}{pitchExtractedText.length.toLocaleString()} characters extracted
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPitchFileId(null);
                      setPitchFileName("");
                      setPitchPageCount(null);
                      setPitchExtractedText("");
                    }}
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--text-3)" }}
                  >
                    Remove
                  </button>
                </div>
                {/* Preview */}
                <div>
                  <button
                    onClick={() => setPitchExtractExpanded(!pitchExtractExpanded)}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "var(--text-3)" }}
                  >
                    {pitchExtractExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {pitchExtractExpanded ? "Hide" : "Preview"} extracted text
                  </button>
                  {pitchExtractExpanded && (
                    <div className="mt-2 space-y-1">
                      <textarea
                        rows={8}
                        value={pitchExtractedText}
                        onChange={(e) => setPitchExtractedText(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-xs resize-none outline-none font-mono"
                        style={{
                          border: "1px solid var(--border-default)",
                          backgroundColor: "var(--bg-2)",
                          color: "var(--text-2)",
                        }}
                      />
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        You can edit the extracted text to fix any extraction errors.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => pitchFileRef.current?.click()}
                disabled={pitchUploadLoading}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl transition-colors"
                style={{
                  border: "2px dashed var(--border-default)",
                  backgroundColor: "var(--bg-1)",
                  color: "var(--text-3)",
                  cursor: pitchUploadLoading ? "not-allowed" : "pointer",
                }}
              >
                {pitchUploadLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                    <span className="text-sm">Extracting text…</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop your pitch deck here</p>
                      <p className="text-xs mt-0.5">PDF, PPT, PPTX, TXT, MD · Max 20 MB</p>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Paste mode */}
        {pitchInputMode === "paste" && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
              Pitch narrative <span style={{ color: "var(--accent-amber)" }}>*</span>
            </label>
            <textarea
              rows={10}
              value={fieldValues["main"] ?? ""}
              onChange={(e) => setFieldValue("main", e.target.value)}
              placeholder="Paste your pitch deck outline, narrative script, or key claims. The more detail, the better."
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-1)",
                color: "var(--text-1)",
              }}
            />
          </div>
        )}

        <button
          onClick={() => setPitchSubStep(2)}
          disabled={pitchInputMode === "upload" ? !pitchFileId : (fieldValues["main"] ?? "").trim().length < 20}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            backgroundColor: (pitchInputMode === "upload" ? !pitchFileId : (fieldValues["main"] ?? "").trim().length < 20)
              ? "var(--panel-elevated)"
              : "var(--accent-amber)",
            color: (pitchInputMode === "upload" ? !pitchFileId : (fieldValues["main"] ?? "").trim().length < 20)
              ? "var(--text-3)"
              : "var(--bg-0)",
            cursor: (pitchInputMode === "upload" ? !pitchFileId : (fieldValues["main"] ?? "").trim().length < 20) ? "not-allowed" : "pointer",
          }}
        >
          Continue
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // Sub-step 2: Context
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setPitchSubStep(1)}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--text-3)" }}
          >
            <ArrowLeft size={12} /> Back
          </button>
          {pitchFileName && (
            <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(56, 178, 125, 0.1)", color: "rgb(56, 178, 125)" }}>
              <FileText size={11} />
              {pitchFileName}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-3)" }}>Step 2 of 2</p>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
          Pitch context
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
          Help the panel evaluate your pitch from the right angle.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Audience type
        </label>
        <input
          type="text"
          value={fieldValues["audience"] ?? ""}
          onChange={(e) => setFieldValue("audience", e.target.value)}
          placeholder="e.g. Seed-stage investor, Series B VC, strategic partner"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Company stage
        </label>
        <input
          type="text"
          value={fieldValues["stage"] ?? ""}
          onChange={(e) => setFieldValue("stage", e.target.value)}
          placeholder="e.g. Pre-revenue idea, MVP with early customers, $1M ARR"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Target check size <span className="font-normal" style={{ color: "var(--text-3)" }}>(optional)</span>
        </label>
        <input
          type="text"
          value={targetCheckSize}
          onChange={(e) => setTargetCheckSize(e.target.value)}
          placeholder="e.g. $500K pre-seed, $2M seed"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>
          Sections included in your pitch <span className="font-normal" style={{ color: "var(--text-3)" }}>(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PITCH_SECTION_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSection(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                border: pitchSections.includes(s) ? "1px solid var(--accent-amber)" : "1px solid var(--border-subtle)",
                backgroundColor: pitchSections.includes(s) ? "rgba(242, 169, 59, 0.1)" : "var(--bg-1)",
                color: pitchSections.includes(s) ? "var(--accent-amber)" : "var(--text-3)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Biggest concern about the pitch <span className="font-normal" style={{ color: "var(--text-3)" }}>(optional)</span>
        </label>
        <input
          type="text"
          value={fieldValues["concern"] ?? ""}
          onChange={(e) => setFieldValue("concern", e.target.value)}
          placeholder="e.g. The market size argument feels weak, the differentiation is not clear"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-1)",
            color: "var(--text-1)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main intake form                                                   */
/* ------------------------------------------------------------------ */
function IntakeFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, getIdToken } = useAuth();

  const initialType = (searchParams.get("use_case") ?? searchParams.get("type")) as UseCase | null;
  const modeParam = searchParams.get("mode") as WorkflowType | null;

  const [step, setStep] = useState<1 | 2 | 3>(initialType ? 2 : 1);
  const [useCase, setUseCase] = useState<UseCase | null>(initialType ?? null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [stage, setStage] = useState("idea");
  const [depth, setDepth] = useState<"quick" | "deep">("quick");
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [streamEvents, setStreamEvents] = useState<DisplayEvent[]>([]);
  const [personas, setPersonas] = useState<PersonaMeta[]>([]);

  // Smart intake state
  const [expandedBrief, setExpandedBrief] = useState("");
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({});
  const [autoTitle, setAutoTitle] = useState("");
  const [smartQuestionsReady, setSmartQuestionsReady] = useState(false);

  // Feature Review state
  const [contextPackId, setContextPackId] = useState<string | null>(null);
  const [contextPackName, setContextPackName] = useState("");
  const [contextPackData, setContextPackData] = useState<Record<string, string> | null>(null);
  const [featureName, setFeatureName] = useState("");
  const [affectedUsers, setAffectedUsers] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [featureConstraints, setFeatureConstraints] = useState("");
  const [featureProblem, setFeatureProblem] = useState("");
  const [alternativesConsidered, setAlternativesConsidered] = useState("");
  const [featureSubStep, setFeatureSubStep] = useState<1 | 2>(1);

  // Pitch Review state
  const [pitchSubStep, setPitchSubStep] = useState<1 | 2>(1);
  const [pitchInputMode, setPitchInputMode] = useState<"upload" | "paste">("paste");
  const [pitchFileId, setPitchFileId] = useState<string | null>(null);
  const [pitchFileName, setPitchFileName] = useState("");
  const [pitchPageCount, setPitchPageCount] = useState<number | null>(null);
  const [pitchExtractedText, setPitchExtractedText] = useState("");
  const [pitchExtractExpanded, setPitchExtractExpanded] = useState(false);
  const [pitchUploadLoading, setPitchUploadLoading] = useState(false);
  const [pitchSections, setPitchSections] = useState<string[]>([]);
  const [targetCheckSize, setTargetCheckSize] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/founder/personas`)
      .then((r) => r.json())
      .then((data) => {
        const list: PersonaMeta[] = data.personas ?? [];
        setPersonas(list);
        setSelectedLenses(list.map((p) => p.id));
      })
      .catch(() => {});
  }, []);

  const config = useCase ? USE_CASE_CONFIGS.find((u) => u.id === useCase) ?? null : null;

  const setFieldValue = (key: string, val: string) =>
    setFieldValues((prev) => ({ ...prev, [key]: val }));

  const mainInput = fieldValues["main"] ?? "";

  const canAdvanceStep1 = useCase !== null;
  const canAdvanceStep2 = useCase === "review-feature"
    ? featureSubStep === 2 && (fieldValues["main"] ?? "").trim().length >= 20
    : useCase === "review-pitch"
    ? pitchSubStep === 2 && (pitchExtractedText.trim().length >= 20 || (fieldValues["main"] ?? "").trim().length >= 20)
    : smartQuestionsReady ? expandedBrief.trim().length > 0 : mainInput.trim().length >= 20;
  const canAdvanceStep3 = selectedLenses.length > 0;

  const canAdvance =
    step === 1 ? canAdvanceStep1 : step === 2 ? canAdvanceStep2 : canAdvanceStep3;

  const toggleLens = (id: string) => {
    setSelectedLenses((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((p) => p !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && canAdvanceStep1) setStep(2);
    else if (step === 2 && canAdvanceStep2) setStep(3);
  };
  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    if (!config || !canAdvanceStep3) return;
    setSubmitting(true);
    setStreamEvents([]);

    // Use expanded brief from smart intake if available
    let ideaPayload: string;
    if (useCase === "review-pitch" && pitchExtractedText.trim()) {
      // Prefer extracted file text; append any context fields
      const ctxParts = config.fields
        .filter((f) => f.key !== "main" && fieldValues[f.key])
        .map((f) => `${f.label}: ${fieldValues[f.key]}`)
        .filter(Boolean);
      const pitchBase = pitchFileName ? `[Pitch: ${pitchFileName}]\n\n${pitchExtractedText.trim()}` : pitchExtractedText.trim();
      ideaPayload = ctxParts.length ? `${pitchBase}\n\n---\n${ctxParts.join("\n")}` : pitchBase;
    } else if (smartQuestionsReady && expandedBrief.trim()) {
      ideaPayload = expandedBrief.trim();
    } else {
      const contextParts = config.fields
        .filter((f) => f.key !== "main" && fieldValues[f.key])
        .map((f) => `${f.label}: ${fieldValues[f.key]}`)
        .filter(Boolean);

      contextParts.push(`Current stage: ${STAGES.find((s) => s.id === stage)?.label ?? stage}`);

      ideaPayload = contextParts.length
        ? `${mainInput.trim()}\n\n---\n${contextParts.join("\n")}`
        : mainInput.trim();
    }

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const endpoint = `${API_URL}/api/founder/analyze/stream`;

      const effectiveTitle = useCase === "review-feature" && featureName
        ? featureName.slice(0, 100)
        : useCase === "review-pitch" && pitchFileName
        ? pitchFileName.replace(/\.[^.]+$/, "").slice(0, 100)
        : (autoTitle || mainInput.trim()).slice(0, 100);
      const effectiveIndustry = extractedFields.industry || fieldValues["market"] || fieldValues["channel"] || undefined;
      const effectiveTargetMarket = extractedFields.target_market || fieldValues["targetCustomer"] || fieldValues["audience"] || undefined;
      const effectiveStage = extractedFields.stage || stage;

      const body = {
            idea: ideaPayload,
            industry: effectiveIndustry,
            stage: effectiveStage,
            target_market: effectiveTargetMarket,
            persona_ids: selectedLenses.length === personas.length ? [] : selectedLenses,
            use_case: useCase,
            workflow_type: config.workflowType,
            title: effectiveTitle,
            depth,
            // Feature Review extras
            ...(useCase === "review-feature" && {
              context_pack_id: contextPackId ?? undefined,
              feature_name: featureName || undefined,
              affected_users: affectedUsers || undefined,
              success_metric: successMetric || undefined,
              feature_constraints: featureConstraints || undefined,
              feature_problem: featureProblem || undefined,
              alternatives_considered: alternativesConsidered || undefined,
            }),
            // Pitch Review extras
            ...(useCase === "review-pitch" && {
              pitch_audience: fieldValues["audience"] || undefined,
              pitch_sections: pitchSections.length > 0 ? pitchSections : undefined,
              target_check_size: targetCheckSize || undefined,
            }),
          };

      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Analysis failed. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const event = JSON.parse(part.slice(6)) as { type: string; review_id?: string; message?: string };
          if (event.type === "done" && event.review_id) {
            router.push(`/reviews/${event.review_id}`);
            return;
          }
          if (event.type === "error") {
            throw new Error(event.message || "Analysis failed.");
          }
          const displayTypes = new Set(["stage", "research_complete", "persona_start", "persona_complete"]);
          if (displayTypes.has(event.type)) {
            setStreamEvents((prev) => [...prev, event as DisplayEvent]);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setSubmitting(false);
      setStreamEvents([]);
    }
  };

  if (submitting && config) {
    return <LiveProgressState config={config} events={streamEvents} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
    >
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <StepperHeader
          step={step}
          config={config}
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
              setFeatureSubStep(1);
            }}
          />
        )}

        {step === 2 && config && config.id === "review-feature" && (
          <FeatureIntakeStep
            fieldValues={fieldValues}
            setFieldValue={setFieldValue}
            contextPackId={contextPackId}
            setContextPackId={setContextPackId}
            contextPackName={contextPackName}
            setContextPackName={setContextPackName}
            contextPackData={contextPackData}
            setContextPackData={setContextPackData}
            featureName={featureName}
            setFeatureName={setFeatureName}
            affectedUsers={affectedUsers}
            setAffectedUsers={setAffectedUsers}
            successMetric={successMetric}
            setSuccessMetric={setSuccessMetric}
            featureConstraints={featureConstraints}
            setFeatureConstraints={setFeatureConstraints}
            featureProblem={featureProblem}
            setFeatureProblem={setFeatureProblem}
            alternativesConsidered={alternativesConsidered}
            setAlternativesConsidered={setAlternativesConsidered}
            featureSubStep={featureSubStep}
            setFeatureSubStep={setFeatureSubStep}
            getIdToken={getIdToken}
          />
        )}

        {step === 2 && config && config.id === "review-pitch" && (
          <PitchIntakeStep
            fieldValues={fieldValues}
            setFieldValue={setFieldValue}
            pitchSubStep={pitchSubStep}
            setPitchSubStep={setPitchSubStep}
            pitchInputMode={pitchInputMode}
            setPitchInputMode={setPitchInputMode}
            pitchFileId={pitchFileId}
            setPitchFileId={setPitchFileId}
            pitchFileName={pitchFileName}
            setPitchFileName={setPitchFileName}
            pitchPageCount={pitchPageCount}
            setPitchPageCount={setPitchPageCount}
            pitchExtractedText={pitchExtractedText}
            setPitchExtractedText={setPitchExtractedText}
            pitchExtractExpanded={pitchExtractExpanded}
            setPitchExtractExpanded={setPitchExtractExpanded}
            pitchUploadLoading={pitchUploadLoading}
            setPitchUploadLoading={setPitchUploadLoading}
            pitchSections={pitchSections}
            setPitchSections={setPitchSections}
            targetCheckSize={targetCheckSize}
            setTargetCheckSize={setTargetCheckSize}
            getIdToken={getIdToken}
          />
        )}

        {step === 2 && config && config.id !== "review-feature" && config.id !== "review-pitch" && (
          <StepContext
            config={config}
            fieldValues={fieldValues}
            setFieldValue={setFieldValue}
            stage={stage}
            setStage={setStage}
            expandedBrief={expandedBrief}
            setExpandedBrief={setExpandedBrief}
            extractedFields={extractedFields}
            setExtractedFields={setExtractedFields}
            autoTitle={autoTitle}
            setAutoTitle={setAutoTitle}
            smartQuestionsReady={smartQuestionsReady}
            setSmartQuestionsReady={setSmartQuestionsReady}
          />
        )}

        {step === 3 && config && (
          <StepConfigure
            config={config}
            personas={personas}
            selectedLenses={selectedLenses}
            toggleLens={toggleLens}
            depth={depth}
            setDepth={setDepth}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */
export default function ReviewsNewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-0)" }}
        >
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
        </div>
      }
    >
      <IntakeFormInner />
    </Suspense>
  );
}
