"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Users, Database, CheckCircle, AlertTriangle, Shield } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--text-3)" }}
          >
            <ArrowLeft size={14} />
            Home
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span className="text-sm font-semibold">Methodology</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-16">

        {/* Header */}
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full mb-5"
            style={{ background: "var(--bg-2)", color: "var(--text-3)" }}
          >
            <FlaskConical size={12} />
            How it works
          </div>
          <h1 className="font-bold mb-4" style={{ fontSize: "2rem", letterSpacing: "-0.03em" }}>
            Methodology & Trust
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-2)", maxWidth: "560px" }}>
            SocietyOS is a decision-support tool. Understanding what it does — and what it doesn&apos;t — will help you get the most from it and avoid over-relying on synthetic outputs.
          </p>
        </div>

        {/* What it does */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.02em" }}>What SocietyOS does</h2>
          <div className="space-y-4">
            <div
              className="rounded-xl p-5 flex gap-4"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-amber-dim)" }}
              >
                <Users size={16} style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Expert advisor panel</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Seven AI personas — each modeled on a distinct founder archetype — independently analyze your idea, pitch, or decision. They bring different frameworks: the operator, the contrarian, the growth specialist, the risk analyst, and more. You get multi-lens critique in minutes instead of days.
                </p>
              </div>
            </div>
            <div
              className="rounded-xl p-5 flex gap-4"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(56,178,125,0.12)" }}
              >
                <Users size={16} style={{ color: "var(--accent-emerald)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Audience simulation panel</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                  A configurable panel of audience personas — Gen Z, Millennials, B2B professionals, or custom-built segments — reacts to your ad copy, messaging, or product description. You get individual reactions, comprehension scores, engagement ratings, and a group discussion that surfaces how your target audience actually processes your content.
                </p>
              </div>
            </div>
            <div
              className="rounded-xl p-5 flex gap-4"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--bg-2)" }}
              >
                <Database size={16} style={{ color: "var(--text-3)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Research-backed briefs</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                  Before analysis, SocietyOS builds a research pack: market context, competitor landscape, target customer profile, and strategic questions. This brief is constructed using the LLM&apos;s training knowledge, not live internet search.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What is synthetic */}
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ letterSpacing: "-0.02em" }}>What is synthetic</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
            Every output from SocietyOS is AI-generated. No real humans participate. Understanding this is essential to using the tool responsibly.
          </p>
          <div
            className="rounded-xl p-5"
            style={{ background: "rgba(242,169,59,0.06)", border: "1px solid rgba(242,169,59,0.2)" }}
          >
            <ul className="space-y-3">
              {[
                "All advisor personas are AI language model instances, not real advisors or investors.",
                "All audience panel members are simulated based on psychographic profiles, not real survey respondents.",
                "Market analysis is generated from training data, not live research or proprietary databases.",
                "Verdicts, recommendations, and artifacts are probabilistic outputs, not deterministic truth.",
                "The same prompt will produce slightly different outputs on different runs.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-amber)" }} />
                  <span className="text-sm" style={{ color: "var(--text-2)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What evidence is used */}
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ letterSpacing: "-0.02em" }}>What evidence is used</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
            SocietyOS uses Qwen2.5 large language models (72B parameter for research and synthesis, 7B for persona reactions) hosted via Hugging Face. These models were trained on large corpora of text data with a knowledge cutoff. The models draw on patterns learned during training — not on real-time web search, proprietary market databases, or user-provided research unless you include it in your input.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-3)" }}>
            Inputs you provide (your idea description, target market, uncertainties) are used directly in prompts and significantly influence output quality. Better inputs yield sharper, more grounded analysis.
          </p>
        </section>

        {/* What to validate */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.02em" }}>What to validate in the real world</h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="grid grid-cols-2 px-5 py-3 text-xs font-semibold"
              style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span>SocietyOS output</span>
              <span>How to validate it</span>
            </div>
            {[
              ["Verdict (Proceed / Revise / Do Not Proceed)", "Treat as a hypothesis. Test with 5–10 real customer conversations before committing resources."],
              ["Market size estimates", "Cross-reference with public reports (Statista, industry associations) and primary interviews."],
              ["Persona reactions and engagement scores", "Run actual user tests or intercept studies with your real target audience."],
              ["Competitor analysis", "Verify with direct competitive research: pricing pages, reviews (G2/Capterra), LinkedIn job posts."],
              ["Advisor recommendations", "Sanity-check with a domain expert or advisor who has relevant lived experience."],
              ["Artifact content (GTM, pitch, etc.)", "Edit and own every claim. Do not publish or pitch directly from generated output without review."],
            ].map(([output, validation], i) => (
              <div
                key={i}
                className="grid grid-cols-2 px-5 py-4 gap-4"
                style={{
                  borderBottom: i < 5 ? "1px solid var(--border-subtle)" : "none",
                  background: i % 2 === 0 ? "var(--bg-1)" : "var(--bg-0)",
                }}
              >
                <span className="text-sm" style={{ color: "var(--text-2)" }}>{output}</span>
                <span className="text-sm" style={{ color: "var(--text-3)" }}>{validation}</span>
              </div>
            ))}
          </div>
        </section>

        {/* What SocietyOS is not */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.02em" }}>What SocietyOS is not</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Not a market research firm", desc: "We do not conduct primary research, surveys, or ethnographic studies." },
              { label: "Not a survey tool", desc: "Simulated audience reactions are not statistically representative samples." },
              { label: "Not a replacement for real customers", desc: "No AI simulation substitutes for direct conversations with your actual target users." },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="font-semibold text-sm mb-1.5">{item.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust calibration */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.02em" }}>How to calibrate your trust</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                principle: "Signal, not certainty",
                desc: "Treat SocietyOS outputs as early-stage signals to investigate, not final answers to act on.",
                icon: Shield,
                color: "var(--accent-amber)",
                bg: "var(--accent-amber-dim)",
              },
              {
                principle: "Pressure-test, not approve",
                desc: "Use the tool to find weak points in your thinking, not to confirm what you already believe.",
                icon: FlaskConical,
                color: "var(--accent-emerald)",
                bg: "rgba(56,178,125,0.1)",
              },
              {
                principle: "Start with this, end with humans",
                desc: "Let SocietyOS accelerate your research — then validate every key insight with real people.",
                icon: Users,
                color: "var(--text-2)",
                bg: "var(--bg-2)",
              },
              {
                principle: "Bias in = bias out",
                desc: "Vague or optimistic inputs produce vague or optimistic outputs. Write your inputs as if briefing a skeptic.",
                icon: CheckCircle,
                color: "var(--text-2)",
                bg: "var(--bg-2)",
              },
            ].map((item) => (
              <div
                key={item.principle}
                className="rounded-xl p-5 flex gap-3"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}
                >
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{item.principle}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="font-semibold mb-2">Ready to use SocietyOS responsibly?</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
            Start with a strategic review or audience simulation. Use the outputs as a launchpad for deeper investigation.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/demo"
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-2)" }}
            >
              See sample outputs
            </Link>
            <Link
              href="/reviews/new"
              className="text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: "var(--accent-amber)", color: "#000" }}
            >
              Start a review →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
