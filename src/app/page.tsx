"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Layers,
  Presentation,
  FileText,
  Users,
  Target,
  Megaphone,
  Brain,
  Activity,
  CheckCircle,
  Search,
  Zap,
  ChevronRight,
  Star,
  Eye,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/ui/navbar";
import { HeroDecisionViz } from "@/components/ui/HeroDecisionViz";
import { MarketingFooter } from "@/components/ui/marketing-footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PLAN_ORDER = ["free", "starter", "pro", "enterprise"];

interface Plan {
  id: string;
  name: string;
  price_usd: number;
  billing_cycle: string;
  monthly_credits: number;
  credit_rollover: boolean;
  features: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, delay },
});

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */
const PROOF_ITEMS = [
  { label: "Multi-lens AI advisor panel", icon: Brain },
  { label: "5\u2013100 audience panel members", icon: Users },
  { label: "Under 5 minutes", icon: Zap },
  { label: "5 exportable artifact types", icon: CheckCircle },
];

const REVIEW_FEATURES = [
  "Research Pack",
  "Expert Reviews",
  "Panel Discussion",
  "Artifacts",
  "History and Iterations",
];

const SIM_FEATURES = [
  "Audience Library",
  "Custom Audience Builder",
  "Reaction Scores",
  "Debate Graph",
  "Shareable Report",
];

const USE_CASES = [
  {
    id: "validate-idea",
    mode: "review",
    icon: Lightbulb,
    title: "Validate an Idea",
    summary: "Research the opportunity, pressure-test assumptions, and get a clear proceed/revise recommendation.",
    bestFor: "Startup ideas, new products, new business lines",
    cta: "Validate Idea",
    color: "amber",
  },
  {
    id: "review-feature",
    mode: "review",
    icon: Layers,
    title: "Review a Feature",
    summary: "Examine a product decision from customer, product, engineering, and business angles.",
    bestFor: "Roadmap bets, major UX changes, pricing or packaging changes",
    cta: "Review Feature",
    color: "amber",
  },
  {
    id: "review-pitch",
    mode: "review",
    icon: Presentation,
    title: "Review a Pitch",
    summary: "Test your pitch narrative against investor and buyer skepticism before the meeting.",
    bestFor: "Fundraising decks, partner pitches, strategic presentations",
    cta: "Review Pitch",
    color: "amber",
  },
  {
    id: "test-ad",
    mode: "simulation",
    icon: Megaphone,
    title: "Test an Ad",
    summary: "Simulate how a target audience interprets, discusses, and reacts to an ad before launch.",
    bestFor: "Campaign concepts, ad scripts, social creatives",
    cta: "Test Ad",
    color: "cyan",
  },
  {
    id: "test-messaging",
    mode: "simulation",
    icon: MessageSquare,
    title: "Test Messaging",
    summary: "Review copy, headlines, and positioning from audience and expert perspectives before you publish.",
    bestFor: "Landing page copy, launch copy, ads, brand messaging",
    cta: "Test Messaging",
    color: "cyan",
  },
  {
    id: "analyze-competitor",
    mode: "simulation",
    icon: Search,
    title: "Analyze a Competitor",
    summary: "Compare how a rival's offer, positioning, and messaging land with your target audience.",
    bestFor: "Pricing pages, landing pages, launch copy, campaign messaging",
    cta: "Analyze Competitor",
    color: "cyan",
  },
];

const OUTPUT_CARDS = [
  { label: "Final Report", desc: "Boardroom-ready summary with verdict and evidence", icon: FileText },
  { label: "GTM Strategy", desc: "Go-to-market plan based on findings", icon: Target },
  { label: "Pitch Draft", desc: "Investor-ready narrative built from your review", icon: Presentation },
  { label: "Messaging Strategy", desc: "Positioning direction and copy framework", icon: MessageSquare },
  { label: "30-Day Next Steps", desc: "Action plan prioritized by confidence", icon: CheckCircle },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/billing/plans`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...(Array.isArray(data) ? data : [])].sort(
          (a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)
        );
        setPlans(sorted);
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  function go(href: string) {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  }

  return (
    <div className="page-root dot-grid relative overflow-x-hidden">
      <Navbar user={user} onLogout={logout} />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative max-w-[1280px] mx-auto px-5 pt-24 pb-20">
        {/* Ambient top glow */}
        <div
          className="pointer-events-none absolute inset-0 -top-24"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(242,169,59,0.07) 0%, transparent 60%)",
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 items-center">
          {/* Left: copy */}
          <div className="max-w-2xl">
            <motion.div {...fadeUp(0)}>
              <div className="accent-chip mb-6">AI Decision Lab</div>
            </motion.div>

            <motion.h1
              className="font-bold leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.25rem)", letterSpacing: "-0.04em" }}
              {...fadeUp(0.05)}
            >
              AI expert panels and{" "}
              <span className="text-[var(--accent-amber)]">audience simulations</span>{" "}
              for founders.
            </motion.h1>

            <motion.p
              className="text-lg leading-relaxed mb-8 max-w-xl"
              style={{ color: "var(--text-2)" }}
              {...fadeUp(0.1)}
            >
              Expert panel review, audience simulation, and actionable artifacts — in under 5 minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div className="flex items-center gap-3 mb-8" {...fadeUp(0.15)}>
              <button
                onClick={() => go("/reviews/new")}
                className="btn-primary text-base px-6 py-3"
              >
                Try a Free Review
                <ArrowRight size={15} />
              </button>
              <Link href="#see-it-in-action" className="btn-secondary text-base px-6 py-3">
                See Sample Outputs
              </Link>
            </motion.div>

            {/* Mode chips */}
            <motion.div className="flex flex-wrap gap-2" {...fadeUp(0.18)}>
              {[
                { label: "Strategic Review", href: "/reviews/new?mode=review", color: "text-[var(--accent-amber)]", bg: "bg-[var(--accent-amber-dim)] border-[rgba(242,169,59,0.18)]" },
                { label: "Audience Simulation", href: "/simulations/new", color: "text-[var(--accent-cyan)]", bg: "bg-[var(--accent-cyan-dim)] border-[rgba(88,184,216,0.18)]" },
                { label: "Competitor Analysis", href: "/simulations/new?use_case=analyze-competitor", color: "text-[var(--text-2)]", bg: "bg-[rgba(255,255,255,0.04)] border-[var(--border-subtle)]" },
                { label: "Custom Audiences", href: "/audiences", color: "text-[var(--accent-emerald)]", bg: "bg-[var(--accent-emerald-dim)] border-[rgba(56,178,125,0.18)]" },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity hover:opacity-80 ${chip.color} ${chip.bg}`}
                >
                  {chip.label}
                  <ChevronRight size={10} />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Right: hero visualization */}
          <motion.div
            className="hidden lg:flex justify-end"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HeroDecisionViz />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. PROOF STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-1)]">
        <div className="max-w-[1280px] mx-auto px-5 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {PROOF_ITEMS.map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-2.5">
                {i > 0 && <div className="hidden sm:block w-px h-4 bg-[var(--border-subtle)] -ml-5 mr-5" />}
                <Icon size={13} className="text-[var(--accent-amber)] shrink-0" />
                <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SEE IT IN ACTION — Demo previews
      ═══════════════════════════════════════════════════════════ */}
      <section id="see-it-in-action" className="max-w-[1280px] mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="section-label mb-3">See It In Action</p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            Real outputs, not marketing promises
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-2)" }}>
            Browse complete sample outputs generated by SocietyOS — from research packs and expert
            critiques to audience reaction reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Sample Review preview */}
          <Link href="/demo/review" className="group card-amber rounded-2xl overflow-hidden transition-all hover:border-[rgba(242,169,59,0.35)]">
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--panel)" }}
            >
              <div className="icon-box icon-box-amber">
                <Brain size={13} className="text-[var(--accent-amber)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">Strategic Review</p>
                <p className="text-[10px] text-[var(--text-3)]">B2B SaaS idea validation</p>
              </div>
              <div className="ml-auto">
                <span className="badge-proceed accent-chip text-[10px]">Proceed</span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--text-2)] leading-relaxed mb-4">
                A complete idea validation — research pack, expert analyses from multiple advisors,
                panel discussion, and a GTM strategy artifact — generated in under 3 minutes.
              </p>
              <div className="flex gap-2 flex-wrap mb-5">
                {["Research Pack", "Expert Reviews", "Verdict", "GTM Artifact"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.05)] text-[var(--text-3)] border border-[var(--border-subtle)]">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-amber)] group-hover:gap-3 transition-all">
                <Eye size={14} />
                View Full Sample Review
                <ArrowRight size={13} />
              </div>
            </div>
          </Link>

          {/* Sample Simulation preview */}
          <Link href="/demo/simulation" className="group card-cyan rounded-2xl overflow-hidden transition-all hover:border-[rgba(88,184,216,0.35)]">
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--panel)" }}
            >
              <div className="icon-box icon-box-cyan">
                <Activity size={13} className="text-[var(--accent-cyan)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">Audience Simulation</p>
                <p className="text-[10px] text-[var(--text-3)]">SaaS ad campaign test</p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "var(--accent-cyan-dim)", color: "var(--accent-cyan)" }}>78% Engagement</span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--text-2)] leading-relaxed mb-4">
                Panel reactions, audience debate, risk flags, and a messaging strategy artifact for
                a B2B SaaS ad — tested against a custom audience panel.
              </p>
              <div className="flex gap-2 flex-wrap mb-5">
                {["Audience Reactions", "Debate Graph", "Verdict", "Messaging Strategy"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.05)] text-[var(--text-3)] border border-[var(--border-subtle)]">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-cyan)] group-hover:gap-3 transition-all">
                <Eye size={14} />
                View Full Sample Simulation
                <ArrowRight size={13} />
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center">
          <button
            onClick={() => go("/reviews/new")}
            className="btn-primary"
          >
            Run This for Your Idea
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. PRODUCT MODES
      ═══════════════════════════════════════════════════════════ */}
      <section id="product" className="max-w-[1280px] mx-auto px-5 py-24">
        <motion.div {...fadeIn(0)} className="text-center mb-14">
          <p className="section-label mb-3">Two Product Lanes</p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.03em" }}
          >
            Two ways to pressure-test a decision
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-2)" }}>
            Run a strategic review when you need expert judgment.
            Run a simulation when you need audience reaction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Strategic Review card */}
          <div className="card-amber rounded-2xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-box icon-box-amber w-10 h-10 rounded-xl">
                <Brain size={17} className="text-[var(--accent-amber)]" />
              </div>
              <div>
                <p className="font-semibold text-base text-[var(--text-1)]">Strategic Review</p>
                <p className="text-xs text-[var(--text-3)]">Expert judgment</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-2)" }}>
              Research the market, brief the panel, compare expert perspectives, and turn the outcome
              into a report, GTM plan, pitch draft, or next-step memo.
            </p>
            <ul className="space-y-2.5 mb-8">
              {REVIEW_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => go("/reviews/new?mode=review")} className="btn-primary mt-auto self-start">
              Start Strategic Review
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Audience Simulation card */}
          <div className="card-cyan rounded-2xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-box icon-box-cyan w-10 h-10 rounded-xl">
                <Activity size={17} className="text-[var(--accent-cyan)]" />
              </div>
              <div>
                <p className="font-semibold text-base text-[var(--text-1)]">Audience Simulation</p>
                <p className="text-xs text-[var(--text-3)]">Audience reaction</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-2)" }}>
              Test messaging, ads, launches, and competitor positioning with a visible audience panel
              and live reaction graph.
            </p>
            <ul className="space-y-2.5 mb-8">
              {SIM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => go("/simulations/new")} className="btn-secondary mt-auto self-start border-[rgba(88,184,216,0.25)] text-[var(--accent-cyan)] hover:border-[rgba(88,184,216,0.5)]">
              Start Simulation
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. USE-CASE GRID
      ═══════════════════════════════════════════════════════════ */}
      <section id="use-cases" className="max-w-[1280px] mx-auto px-5 py-20 border-t border-[var(--border-subtle)]">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Use Cases</p>
          <h2
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            What do you need to decide?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const isAmber = uc.color === "amber";
            return (
              <button
                key={uc.id}
                onClick={() => go(uc.mode === "simulation" ? `/simulations/new?use_case=${uc.id}` : `/reviews/new?use_case=${uc.id}`)}
                className={`text-left p-6 rounded-xl flex flex-col group transition-all ${isAmber ? "card" : "card"}`}
                style={{
                  background: isAmber ? "var(--bg-1)" : "var(--bg-1)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`icon-box ${isAmber ? "icon-box-amber" : "icon-box-cyan"}`}>
                    <Icon size={14} className={isAmber ? "text-[var(--accent-amber)]" : "text-[var(--accent-cyan)]"} />
                  </div>
                  <ArrowRight size={13} className="mt-0.5 text-[var(--text-3)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="font-semibold text-[0.9375rem] mb-2 text-[var(--text-1)]">{uc.title}</h3>
                <p className="text-sm leading-relaxed flex-1 mb-4 text-[var(--text-3)]">{uc.summary}</p>
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-3)]">
                    <span className="font-semibold text-[var(--text-2)]">Best for:</span>{" "}
                    {uc.bestFor}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. WHAT YOU GET
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-5 py-20 border-t border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="section-label mb-4">Outputs</p>
            <h2
              className="font-bold tracking-tight mb-5"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
            >
              Every run becomes a working asset
            </h2>
            <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: "var(--text-2)" }}>
              SocietyOS does not stop at opinions. Each review or simulation can become a final report,
              GTM strategy, pitch draft, messaging plan, customer validation plan, or 30-day next-step memo.
            </p>
            <button onClick={() => go("/demo")} className="btn-secondary">
              Explore Outputs
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {OUTPUT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="icon-box icon-box-amber shrink-0">
                    <Icon size={14} className="text-[var(--accent-amber)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-1)]">{card.label}</p>
                    <p className="text-xs text-[var(--text-3)]">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. HOW IT WORKS (compact)
      ═══════════════════════════════════════════════════════════ */}
      <section id="methodology" className="max-w-[1280px] mx-auto px-5 py-20 border-t border-[var(--border-subtle)]">
        <div className="text-center mb-12">
          <p className="section-label mb-3">How It Works</p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            From brief to decision in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            {
              icon: Search,
              color: "var(--text-2)",
              bg: "var(--bg-2)",
              step: "1",
              title: "Research",
              body: "SocietyOS builds a research pack — market context, competitor landscape, target customer profile, and strategic questions.",
            },
            {
              icon: Brain,
              color: "var(--accent-amber)",
              bg: "var(--accent-amber-dim)",
              step: "2",
              title: "Analyze",
              body: "AI advisor personas — each modeled on a distinct founder archetype — independently critique your idea from multiple angles.",
            },
            {
              icon: CheckCircle,
              color: "var(--accent-emerald)",
              bg: "rgba(56,178,125,0.12)",
              step: "3",
              title: "Act",
              body: "Get a verdict with confidence level, then generate actionable artifacts — GTM strategy, pitch draft, 30-day plan, messaging strategy.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl p-6 text-center"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: item.bg }}
                >
                  <Icon size={17} style={{ color: item.color }} />
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-3)" }}>STEP {item.step}</p>
                <p className="font-semibold text-sm mb-2" style={{ color: "var(--text-1)" }}>{item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{item.body}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-3">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            All outputs are AI-generated synthetic analysis — treat them as signals to investigate, not final answers.
          </p>
          <Link href="/methodology" className="btn-secondary">
            Full Methodology &amp; Limitations
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* Advanced Features section removed — folded into product modes and use case grid */}

      {/* Old Sample Outputs section removed — now integrated into "See it in action" above */}

      {/* ═══════════════════════════════════════════════════════════
          9. PRICING
      ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="max-w-[1280px] mx-auto px-5 py-20 border-t border-[var(--border-subtle)]">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Pricing</p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
            Your free account includes enough for a full expert panel review — no credit card required.
            Upgrade when you need more capacity.
          </p>
        </div>

        {/* Credit cost reference */}
        <div className="card rounded-xl px-6 py-5 mb-10 max-w-2xl mx-auto">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-3)" }}>CREDIT COSTS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Strategic Review", cost: 50 },
              { label: "Chat Exchange", cost: 5 },
              { label: "Artifact (GTM, Pitch…)", cost: 10 },
              { label: "Re-run Iteration", cost: 25 },
              { label: "Audience Simulation", cost: 15 },
            ].map(({ label, cost }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: "var(--text-2)" }}>{label}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
                >
                  {cost} cr
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {plansLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--accent-amber)] border-t-transparent animate-spin" />
          </div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {plans.map((plan) => {
              const isPro = plan.id === "pro";
              const isEnterprise = plan.id === "enterprise";
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl flex flex-col"
                  style={{
                    border: isPro ? "1px solid var(--accent-amber)" : "1px solid var(--border-subtle)",
                    background: isPro ? "var(--accent-amber-dim)" : "var(--bg-1)",
                    padding: "1.5rem",
                  }}
                >
                  {isPro && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full"
                      style={{ background: "var(--accent-amber)", color: "#000" }}
                    >
                      Most popular
                    </div>
                  )}
                  <div className="mb-5">
                    <p className="font-semibold mb-1" style={{ color: "var(--text-1)" }}>{plan.name}</p>
                    <div className="flex items-end gap-1">
                      {isEnterprise ? (
                        <span className="text-2xl font-bold tracking-tight">Custom</span>
                      ) : (
                        <>
                          <span
                            className="font-bold tracking-tight"
                            style={{ fontSize: "1.875rem", letterSpacing: "-0.03em" }}
                          >
                            ${plan.price_usd}
                          </span>
                          {plan.price_usd > 0 && (
                            <span className="text-xs mb-1" style={{ color: "var(--text-3)" }}>/mo</span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                      {isEnterprise
                        ? "Unlimited credits"
                        : plan.id === "free"
                        ? `${plan.monthly_credits} one-time credits`
                        : `${plan.monthly_credits.toLocaleString()} credits / month`}
                    </p>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                        <Check
                          size={12}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: isPro ? "var(--accent-amber)" : "var(--text-3)" }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      if (plan.id === "free") { go(user ? "/dashboard" : "/login"); return; }
                      if (plan.id === "enterprise") { window.location.href = "mailto:hello@societyos.ai?subject=Enterprise Plan"; return; }
                      go("/reviews/new");
                    }}
                    className={isPro ? "btn-primary text-xs w-full justify-center" : "btn-secondary text-xs w-full justify-center"}
                  >
                    {plan.id === "free" ? "Get started free" : plan.id === "enterprise" ? "Contact us" : "Coming soon"}
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="text-center space-y-3 mt-6">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Credits reset monthly. Unused credits do not roll over on Starter and Pro plans. All prices in USD.
          </p>
          <Link href="/pricing" className="btn-secondary text-xs inline-flex">
            Full Pricing Details
            <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          10. FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-5 py-24 border-t border-[var(--border-subtle)]">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <Star size={13} className="text-[var(--accent-amber)]" />
              <p className="section-label">Get Started</p>
              <Star size={13} className="text-[var(--accent-amber)]" />
            </div>
            <h2
              className="font-bold tracking-tight mb-5"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.035em" }}
            >
              Put a real decision through the system
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--text-2)" }}>
              Start with an idea, a feature, a message, or a competitor.
              SocietyOS will take it from context to report.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => go("/reviews/new")}
                className="btn-primary text-base px-7 py-3"
              >
                Try a Free Review
                <ArrowRight size={15} />
              </button>
              <Link href="#see-it-in-action" className="btn-secondary text-base px-7 py-3">
                See Sample Outputs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <MarketingFooter />
    </div>
  );
}
