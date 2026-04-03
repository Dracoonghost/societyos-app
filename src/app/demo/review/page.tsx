"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

// ─── Static sample data ────────────────────────────────────────────────────────

const SAMPLE_IDEA = `A Slack bot that automatically writes weekly progress updates for engineering teams based on their GitHub commit history and pull request activity. Targets Series A–C B2B SaaS startups (50–300 employees). Engineers log their work in Git — the bot surfaces it as a polished async update for standup or stakeholder reporting. Priced at $29/month per team. Pre-revenue, building first 10 design partners.`;

const SAMPLE_VERDICT = {
  recommendation: "Proceed with Validation" as const,
  confidence: "Medium",
  summary: "The core pain is real and the workflow hook (Git activity) is clever. However, the $29/month price point may face resistance from engineering managers who see this as a \"nice to have\" rather than a budget-justified tool. The key risk is whether async reporting pain is acute enough to drive paid adoption — or whether teams will default to a 5-minute manual standup instead. Validate with 10 engineering managers before building.",
  risks: [
    "Engineering managers rarely own their own budget — procurement often sits with finance or IT, creating a longer sales cycle than the self-serve pricing model assumes.",
    "GitHub activity is a proxy for work, not a perfect signal — engineers doing architecture, code review, or meetings will appear \"inactive\" and generate misleading updates.",
    "Free alternatives (LinearB, Clockwise integrations, native GitHub digests) may satisfy the superficial need without a dedicated subscription.",
  ],
  opportunities: [
    "Growing remote-first culture makes async updates more valuable than synchronous standups — timing is good.",
    "Strong distribution moat if you can land a few anchor design partners who share it publicly inside Slack communities.",
    "Upsell path to team-level analytics, manager dashboards, and performance review drafts once the weekly update habit is formed.",
  ],
};

const SAMPLE_RESEARCH = {
  market_overview: "The developer productivity and async communication space is growing rapidly alongside the remote-first shift. Engineering teams at Series A–C companies spend 3–5 hours per week on status reporting and standup preparation. Tools like Linear, GitHub, and Jira capture work data but none automatically surfaces it as human-readable communication. The total addressable market for developer productivity tools is estimated at $8–12B globally, with async communication tools seeing 40%+ growth post-COVID.",
  competitors: [
    { name: "LinearB", description: "Engineering metrics platform", strength: "Deep Git analytics, OKR tracking", weakness: "Complex setup, enterprise pricing, not focused on communication" },
    { name: "Geekbot", description: "Async standup bot", strength: "Simple, popular, Slack-native", weakness: "Manual input — engineers still have to type their updates" },
    { name: "GitHub native digests", description: "Built-in GitHub notification summaries", strength: "Zero cost, no setup", weakness: "Raw and unformatted — not suitable for stakeholder communication" },
  ],
  target_customer: "Engineering Manager or VP Engineering at a Series A–C B2B SaaS company with 20–100 engineers. They are drowning in ad-hoc Slack pings asking for status and struggling to give executives a coherent weekly engineering update without taking 2+ hours to compile it. They already use GitHub, Linear, or Jira — they want the data they already have surfaced automatically.",
};

const SAMPLE_PERSONAS = [
  {
    name: "The Operator",
    archetype: "execution-focused",
    emoji: "⚙️",
    color: "#4a7a5e",
    stance: "Cautiously positive",
    analysis: "The distribution strategy needs work before the product does. At $29/month you're selling to teams that have a budget approval process — but this feels priced for PLG. I'd want to see a bottom-up motion where individual engineers discover and expense it, then it spreads. The core integration is right: GitHub is where the work lives. But the output needs to be opinionated — don't just list commits, synthesize them into meaningful narrative. The real test is whether the first paragraph of the generated update passes a \"would I send this to my CTO?\" test.",
  },
  {
    name: "The Contrarian",
    archetype: "skeptic",
    emoji: "🧨",
    color: "#9e4a5e",
    stance: "Skeptical",
    analysis: "The core assumption here is that engineering managers want more automated content, not less. In my experience, the real problem isn't writing the update — it's knowing what to include. Git commits are a noisy signal: a 3-line config change and a 500-line feature refactor look the same in the log. If the bot generates a misleading update and an engineer sends it to their CTO, that's worse than no update. You need a \"review before send\" step baked in, which kills the \"automatic\" value proposition. Also: Geekbot has been trying to solve this for years and still hasn't reached escape velocity.",
  },
  {
    name: "The Growth Specialist",
    archetype: "growth-focused",
    emoji: "📈",
    color: "#4a6b9e",
    stance: "Bullish on distribution",
    analysis: "The go-to-market angle I'd lean into: Slack communities are where engineering managers hang out and share pain. r/ExperiencedDevs, Rands Leadership Slack, the CTO Craft community — these are your top-of-funnel. Build the freemium version, get 10 power users who share their generated updates publicly (with permission), and let the output quality speak for itself. The product is essentially a demo of itself. On pricing: $29/month per team is too cheap for enterprise buyers and too expensive for indie engineering managers to expense without approval. Consider $9/month per user or a team trial that upgrades.",
  },
];

const SAMPLE_ARTIFACT = `## Go-to-Market Strategy — AutoStandup

### Ideal Customer Profile
**Primary buyer:** Engineering Manager at a 30–150 person Series A–B B2B SaaS company using GitHub + Slack. They manage 5–15 engineers, run weekly async standups, and spend 2+ hours per week manually compiling status updates for their VP or CEO. They care deeply about team visibility and are frustrated that good work gets lost in commit noise.

**Anti-ICP:** Solo developer teams, companies using Azure DevOps (integration complexity), or engineering managers who believe async standups are a symptom, not a solution.

### Positioning
"For engineering managers who spend hours on status reports, AutoStandup is the only async update tool that writes itself — pulling directly from your team's GitHub activity, unlike Geekbot which still requires engineers to type manually."

### Launch Sequence
**Week 1–2:** Recruit 10 design partner engineering managers from CTO Craft, Rands Leadership Slack, and direct LinkedIn outreach. Offer free unlimited access in exchange for 30-minute feedback sessions.

**Month 1:** Publish "The Engineering Manager's Standup Stack" — a content piece showing 5 real (anonymized) AI-generated updates vs. manual ones. Seed in Slack communities and r/ExperiencedDevs.

**Month 2:** Launch public Product Hunt campaign. Target #2 or above in "Developer Tools." Use design partner testimonials as social proof.

### Success Metrics (90-day)
- 50 active teams (defined as generating ≥1 update per week)
- 15% week-3 retention among trial signups
- NPS ≥ 40 from design partner cohort
- 3 public case studies from design partners`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "research" | "experts" | "artifact";

const VERDICT_COLOR = {
  "Proceed with Validation": "var(--accent-amber)",
  "Proceed": "var(--accent-emerald)",
  "Do Not Proceed": "var(--accent-coral)",
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoReviewPage() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "research", label: "Research Pack" },
    { id: "experts", label: "Expert Reviews" },
    { id: "artifact", label: "Artifacts" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Demo banner */}
      <div
        className="py-2.5 px-6 text-center text-xs font-medium"
        style={{ background: "rgba(242,169,59,0.12)", borderBottom: "1px solid rgba(242,169,59,0.2)", color: "var(--accent-amber)" }}
      >
        This is a sample review — sign up to run your own analysis.&nbsp;&nbsp;
        <Link href="/login" className="underline font-semibold">Get started free →</Link>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/demo" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-3)" }}>
            <ArrowLeft size={14} />
            Sample outputs
          </Link>
          <span style={{ color: "var(--text-3)", opacity: 0.4 }}>/</span>
          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}>
            Validate Idea
          </span>
          <span className="text-sm truncate max-w-xs" style={{ color: "var(--text-2)" }}>
            AutoStandup — Engineering Update Bot
          </span>
        </div>
      </nav>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto px-6 flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="py-3 text-sm border-b-2 transition-colors"
              style={{
                borderColor: tab === t.id ? "var(--accent-amber)" : "transparent",
                color: tab === t.id ? "var(--text-1)" : "var(--text-3)",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Overview tab */}
        {tab === "overview" && (
          <>
            {/* Idea */}
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
              <p className="section-label mb-2">Idea reviewed</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{SAMPLE_IDEA}</p>
            </div>

            {/* Verdict */}
            <div>
              <p className="section-label mb-3">Verdict</p>
              <div className="rounded-xl p-6" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-sm font-bold px-3 py-1.5 rounded-lg"
                    style={{
                      background: "var(--accent-amber-dim)",
                      color: VERDICT_COLOR["Proceed with Validation"],
                    }}
                  >
                    {SAMPLE_VERDICT.recommendation}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>Confidence: {SAMPLE_VERDICT.confidence}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)", lineHeight: "1.8" }}>
                  {SAMPLE_VERDICT.summary}
                </p>
              </div>
            </div>

            {/* Risks + Opportunities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(223,107,87,0.18)" }}>
                <p className="section-label mb-4" style={{ color: "var(--accent-coral)" }}>Key Risks</p>
                <ul className="space-y-3">
                  {SAMPLE_VERDICT.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <TrendingDown size={13} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-coral)" }} />
                      <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(56,178,125,0.18)" }}>
                <p className="section-label mb-4" style={{ color: "var(--accent-emerald)" }}>Key Opportunities</p>
                <ul className="space-y-3">
                  {SAMPLE_VERDICT.opportunities.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <TrendingUp size={13} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-emerald)" }} />
                      <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Research Pack tab */}
        {tab === "research" && (
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
              <p className="section-label mb-3">Market Overview</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{SAMPLE_RESEARCH.market_overview}</p>
            </div>
            <div>
              <p className="section-label mb-3">Competitor Landscape</p>
              <div className="space-y-3">
                {SAMPLE_RESEARCH.competitors.map((c) => (
                  <div key={c.name} className="rounded-xl p-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-sm">{c.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{c.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-emerald)" }} />
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.strength}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-amber)" }} />
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.weakness}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
              <p className="section-label mb-3">Target Customer</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{SAMPLE_RESEARCH.target_customer}</p>
            </div>
          </div>
        )}

        {/* Expert Reviews tab */}
        {tab === "experts" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Showing 3 of 7 advisor analyses. Each persona brings an independent lens.
            </p>
            {SAMPLE_PERSONAS.map((p) => (
              <div key={p.name} className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                    style={{ background: p.color, color: "rgba(0,0,0,0.85)" }}
                  >
                    {p.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{p.stance}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)", lineHeight: "1.8" }}>
                  {p.analysis}
                </p>
              </div>
            ))}
            <div
              className="rounded-xl p-4 text-center text-sm"
              style={{ background: "var(--bg-2)", color: "var(--text-3)", border: "1px dashed var(--border-default)" }}
            >
              4 more advisor analyses available in a full run →
            </div>
          </div>
        )}

        {/* Artifact tab */}
        {tab === "artifact" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
              >
                Go-to-Market Strategy
              </span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Generated from research pack + advisor analyses</span>
            </div>
            <div
              className="rounded-xl p-6"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-2)", lineHeight: "1.9" }}>
                {SAMPLE_ARTIFACT}
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center text-sm mt-4"
              style={{ background: "var(--bg-2)", color: "var(--text-3)", border: "1px dashed var(--border-default)" }}
            >
              5 more artifact types available: Pitch Draft, 30-Day Next Steps, Customer Validation Plan, Messaging Strategy, Final Report →
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-xl p-6 flex items-center justify-between gap-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
        >
          <div>
            <p className="font-semibold text-sm mb-1">Run your own strategic review</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>50 free credits included. No card required.</p>
          </div>
          <Link
            href="/reviews/new"
            className="text-sm px-4 py-2 rounded-lg font-medium flex-shrink-0"
            style={{ background: "var(--accent-amber)", color: "#000" }}
          >
            Start now →
          </Link>
        </div>
      </div>
    </div>
  );
}
