"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, Share2, Activity } from "lucide-react";

// ─── Static sample data ────────────────────────────────────────────────────────

const SAMPLE_AD = `Stop writing your own standup updates.

AutoStandup reads your team's GitHub commits and writes your weekly engineering update automatically — in the format your CTO actually wants to read.

✅ Pulls directly from GitHub activity
✅ No more Sunday-night update stress
✅ Ready in 30 seconds, not 2 hours

Trusted by engineering managers at 40+ startups.
Try free for 14 days → autostandup.dev`;

const SAMPLE_VERDICT = {
  verdict: "The ad landed with the \"Sunday-night update stress\" line — that specific emotional trigger resonated across all personas. The GitHub integration claim adds credibility. However, the \"30 seconds\" promise raised skepticism, and the \"40+ startups\" social proof felt too generic to be compelling. The CTA is weak — \"try free\" is less motivating than \"see your first update in 60 seconds.\" Overall: strong hook, soft close.",
  avg_comprehension: 3.8,
  avg_engagement: 3.4,
  share_rate: 60,
  what_worked: [
    "\"Sunday-night update stress\" — specific, emotionally resonant, immediately relatable to the target persona",
    "GitHub pull claim — technical credibility that distinguishes this from generic standup bots",
    "Clean bulleted format — easy to scan and understand what the product does",
  ],
  risk_flags: [
    "\"30 seconds\" claim triggered skepticism from 3 of 5 panel members — feels like a marketing exaggeration",
    "\"40+ startups\" social proof is too vague — \"40 startups\" means nothing without names or context",
    "\"Try free for 14 days\" is weak compared to showing the product in action before asking for a signup",
  ],
  recommendations: [
    "Replace the \"30 seconds\" claim with a more believable specificity: \"First update ready by Monday morning\"",
    "Replace \"40+ startups\" with a named reference: \"Used by eng managers at [Company A], [Company B], and [Company C]\"",
    "Rewrite the CTA to show value before asking for action: \"See a sample update from your last sprint →\"",
  ],
};

const SAMPLE_REACTIONS = [
  {
    name: "Maya Chen",
    role: "Engineering Manager, B2B SaaS",
    reaction: "\"Sunday-night update stress\" is exactly my life. I got hooked at that line. The GitHub integration is a strong claim — that's the part I'd actually believe. The \"30 seconds\" thing made me raise an eyebrow though. I want to try it, but I'd be annoyed if the first update was garbage.",
    comprehension: 4.2,
    engagement: 4.5,
    confusion: "Not sure if it works for teams that use Linear instead of GitHub",
    would_share: true,
  },
  {
    name: "Jordan Park",
    role: "VP Engineering, Series B startup",
    reaction: "The pain point is real. The execution is decent. But I've seen 20 \"AI-powered engineering tool\" ads this month. What makes this one credible? The \"40+ startups\" line means nothing. Give me a name I recognize or a specific example of what the output looks like.",
    comprehension: 3.8,
    engagement: 3.2,
    confusion: "What does the actual output look like? Is it Slack-formatted or email? Can I edit it before sending?",
    would_share: false,
  },
  {
    name: "Priya Nair",
    role: "Engineering Manager, fintech",
    reaction: "I forwarded this to my team immediately. We've been manually writing these updates for 2 years. The Sunday stress is real. I'd pay $29/month without thinking twice. The only thing I'd want to know is whether it handles commits from multiple repos.",
    comprehension: 4.5,
    engagement: 4.8,
    confusion: "Multi-repo support is unclear",
    would_share: true,
  },
  {
    name: "Alex Rivera",
    role: "Tech Lead, early-stage startup",
    reaction: "Feels a bit generic to me. We already use Geekbot for standups. I'm not immediately seeing how this is different. The \"30 seconds\" promise sounds like every other AI tool. I'd need to see a sample output before I'd even click the link.",
    comprehension: 3.0,
    engagement: 2.5,
    confusion: "What's the actual difference from Geekbot? Both are standup bots.",
    would_share: false,
  },
  {
    name: "Sam Wright",
    role: "Director of Engineering, Series A",
    reaction: "The ad gets the job done. Clear problem, clear solution. The emotional hook works. I'd probably click through to see a demo. My hesitation is always \"will this become another tool my team ignores?\" A line about adoption or how it integrates into existing Slack workflows would help.",
    comprehension: 3.8,
    engagement: 3.6,
    confusion: "How does it handle engineers who work across multiple projects?",
    would_share: true,
  },
];

const SAMPLE_DEBATE = [
  {
    from_name: "Maya Chen",
    to_names: ["Jordan Park"],
    role: "Engineering Manager",
    message: "I think Jordan's right that the social proof is weak, but I also don't think that's what would kill this ad. For me, the question is: does it actually produce something I'd send? If it could show me a real sample update from a real team, the credibility problem goes away. The social proof is a band-aid on the wrong wound.",
  },
  {
    from_name: "Jordan Park",
    to_names: ["Maya Chen", "Sam Wright"],
    role: "VP Engineering",
    message: "Fair point. But there's a sequencing issue here — you need the social proof to get someone to look at the sample output. Without credibility, they bounce before they even see the demo. I'd A/B test a version with a specific company name against the current vague claim. My bet is naming one recognizable company triples click-through.",
  },
  {
    from_name: "Priya Nair",
    to_names: ["Alex Rivera"],
    role: "Engineering Manager",
    message: "Alex, I hear the Geekbot comparison but I think you're missing the core difference: Geekbot still requires engineers to type their own update. This pulls from Git automatically. That's a completely different product. The ad could do a better job making that distinction explicit — maybe just one line: \"Unlike standup bots, no one has to type anything.\"",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#4a7a5e", "#4a6b9e", "#9e7a4a", "#7a4a9e", "#9e4a5e"];
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

function MetricCard({ label, value, max, unit }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = max ? value / max : value / 100;
  const color = scoreColor(pct);
  const displayValue = max ? value.toFixed(1) : String(value);
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
      <span className="section-label">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>{displayValue}</span>
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

export default function DemoSimulationPage() {
  const wouldShareCount = SAMPLE_REACTIONS.filter((r) => r.would_share).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Demo banner */}
      <div
        className="py-2.5 px-6 text-center text-xs font-medium"
        style={{ background: "rgba(56,178,125,0.1)", borderBottom: "1px solid rgba(56,178,125,0.2)", color: "var(--accent-emerald)" }}
      >
        This is a sample simulation — sign up to run your own.&nbsp;&nbsp;
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
          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "var(--accent-emerald-dim)", color: "var(--accent-emerald)" }}>
            Ad Test
          </span>
          <span className="text-sm truncate max-w-xs" style={{ color: "var(--text-2)" }}>
            AutoStandup — Facebook/LinkedIn Ad
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Title + badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Activity size={18} className="text-[var(--accent-emerald)]" />
            <h1 className="font-bold" style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Simulation Results</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}>
              5 panel members
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}>
              Panel Discussion
            </span>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--panel)", border: "1px solid var(--border-subtle)" }}>
            <p className="section-label mb-2">Content Tested</p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-2)" }}>{SAMPLE_AD}</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Comprehension" value={SAMPLE_VERDICT.avg_comprehension} max={5} />
          <MetricCard label="Engagement" value={SAMPLE_VERDICT.avg_engagement} max={5} />
          <MetricCard label="Would Share" value={SAMPLE_VERDICT.share_rate} unit={`% (${wouldShareCount}/${SAMPLE_REACTIONS.length})`} />
        </div>

        {/* Verdict */}
        <section>
          <p className="section-label mb-3">Jury Verdict</p>
          <div className="rounded-xl p-6" style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(242,169,59,0.18)" }}>
            <p className="leading-relaxed text-base" style={{ color: "var(--text-1)", lineHeight: "1.8" }}>
              {SAMPLE_VERDICT.verdict}
            </p>
          </div>
        </section>

        {/* Breakdown */}
        <section>
          <p className="section-label mb-3">Breakdown</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(56,178,125,0.18)" }}>
              <p className="section-label mb-4" style={{ color: "var(--accent-emerald)" }}>What Landed</p>
              <ul className="space-y-3">
                {SAMPLE_VERDICT.what_worked.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-[var(--accent-emerald)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid rgba(223,107,87,0.18)" }}>
              <p className="section-label mb-4" style={{ color: "var(--accent-coral)" }}>What Didn&apos;t Land</p>
              <ul className="space-y-3">
                {SAMPLE_VERDICT.risk_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <AlertTriangle size={14} className="text-[var(--accent-coral)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <p className="section-label mb-3">Recommendations</p>
          <div className="space-y-2.5">
            {SAMPLE_VERDICT.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3.5 rounded-xl px-5 py-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}>
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel voices */}
        <section>
          <div className="flex items-baseline gap-3 mb-5">
            <p className="section-label">Panel Voices</p>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {SAMPLE_REACTIONS.filter(r => r.comprehension >= 3 && r.engagement >= 3).length} of {SAMPLE_REACTIONS.length} had strong comprehension + engagement
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SAMPLE_REACTIONS.map((r) => {
              const ac = avatarColor(r.name);
              const isStrong = r.comprehension >= 3 && r.engagement >= 3;
              return (
                <div key={r.name} className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: isStrong ? "1px solid rgba(56,178,125,0.15)" : "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: ac, color: "rgba(0,0,0,0.85)" }}>
                      {initials(r.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>
                    {r.reaction}
                  </p>
                  <div className="space-y-1.5">
                    <ScoreBar label="Comprehension" value={r.comprehension} />
                    <ScoreBar label="Engagement" value={r.engagement} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Debate */}
        <section>
          <p className="section-label mb-3">Group Debate</p>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
            <div className="px-5 py-3.5" style={{ background: "var(--panel)", borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Panel members responding to each other — unfiltered</p>
            </div>
            <div className="p-5 space-y-5" style={{ background: "var(--bg-1)" }}>
              {SAMPLE_DEBATE.map((dm, i) => {
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
                        <span className="text-xs" style={{ color: "var(--text-3)", opacity: 0.6 }}>↩ {dm.to_names.join(", ")}</span>
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

        {/* CTA */}
        <div className="rounded-xl p-6 flex items-center justify-between gap-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="font-semibold text-sm mb-1">Test your own ad or messaging</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>50 free credits included. No card required.</p>
          </div>
          <Link href="/reviews/new" className="text-sm px-4 py-2 rounded-lg font-medium flex-shrink-0" style={{ background: "var(--accent-amber)", color: "#000" }}>
            Start now →
          </Link>
        </div>
      </div>
    </div>
  );
}
