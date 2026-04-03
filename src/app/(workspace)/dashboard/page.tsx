"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Activity,
  ArrowRight,
  Lightbulb,
  Layers,
  Presentation,
  Megaphone,
  MessageSquare,
  Rocket,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  Users,
  Target,
  Zap,
  BarChart2,
  Play,
  Plus,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/ui/navbar";
import { Sidebar } from "@/components/ui/sidebar";
import { useBilling } from "@/contexts/BillingContext";
// EmptyStateDecor removed — empty state now uses guided card selector

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface ReviewMeta {
  id: string;
  title: string;
  summary?: string | null;
  useCase: string | null;
  workflowType: "review" | "simulation" | null;
  status: string;
  createdAt: string | null;
  updatedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const USE_CASE_LABELS: Record<string, string> = {
  "validate-idea": "Validate Idea",
  "review-feature": "Review Feature",
  "review-pitch": "Review Pitch",
  "test-ad": "Test Ad",
  "test-messaging": "Test Messaging",
  "stress-test-launch": "Stress-Test Launch",
  "analyze-competitor": "Competitor Analysis",
};

const USE_CASE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "validate-idea": Lightbulb,
  "review-feature": Layers,
  "review-pitch": Presentation,
  "test-ad": Megaphone,
  "test-messaging": MessageSquare,
  "stress-test-launch": Rocket,
  "analyze-competitor": Target,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMin = Math.floor(diffMs / (1000 * 60));
      return diffMin <= 1 ? "just now" : `${diffMin}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNextAction(review: ReviewMeta): string {
  if (review.workflowType === "simulation") return "Resume Simulation";
  if (review.status === "complete") return "View Report";
  return "Continue Panel";
}

const QUICK_ACTIONS = [
  {
    id: "review",
    label: "Strategic Review",
    desc: "Research an idea, brief the panel, compare expert judgment, and generate artifacts.",
    href: "/reviews/new?mode=review",
    icon: Brain,
    colorClass: "card-amber",
    iconClass: "icon-box-amber",
    iconColor: "text-[var(--accent-amber)]",
  },
  {
    id: "simulation",
    label: "Audience Simulation",
    desc: "Test an ad, message, or launch with an audience panel and reaction graph.",
    href: "/simulations/new",
    icon: Activity,
    colorClass: "card-cyan",
    iconClass: "icon-box-cyan",
    iconColor: "text-[var(--accent-cyan)]",
  },
  {
    id: "competitor",
    label: "Competitor Analysis",
    desc: "Run a rival through the intelligence engine to compare pricing, positioning, and GTM.",
    href: "/competitor-analysis/new",
    icon: Target,
    colorClass: "card",
    iconClass: "icon-box-muted",
    iconColor: "text-[var(--text-2)]",
  },
  {
    id: "audience",
    label: "Build Audience",
    desc: "Create and save a custom audience you can reuse across future simulations.",
    href: "/audiences",
    icon: Users,
    colorClass: "card",
    iconClass: "icon-box-green",
    iconColor: "text-[var(--accent-emerald)]",
  },
];

const FILTER_TABS = ["All", "Reviews", "Simulations"] as const;
type FilterTab = typeof FILTER_TABS[number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, getIdToken } = useAuth();
  const { billing } = useBilling();
  const [reviews, setReviews] = useState<ReviewMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [contextPackCount, setContextPackCount] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      const token = await getIdToken();
      if (!token) { setLoading(false); return; }
      try {
        const [reviewsRes, audiencesRes, packsRes] = await Promise.all([
          fetch(`${API_URL}/api/reviews`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/audience-library`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/context-packs`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.reviews ?? []);
        }
        if (audiencesRes.ok) {
          const data = await audiencesRes.json();
          setAudienceCount((data.audiences ?? []).length);
        }
        if (packsRes.ok) {
          const data = await packsRes.json();
          setContextPackCount((data.packs ?? []).length);
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = user?.displayName || user?.email?.split("@")[0] || null;
  const reviewCount = reviews.filter(r => r.workflowType === "review").length;
  const simCount = reviews.filter(r => r.workflowType === "simulation").length;
  const creditsLow = billing !== null && billing.credits_remaining < 20;

  const filteredReviews = activeFilter === "All"
    ? reviews
    : activeFilter === "Reviews"
    ? reviews.filter(r => r.workflowType === "review")
    : reviews.filter(r => r.workflowType === "simulation");

  const hasWork = reviews.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8 md:py-12">
      {/* ═══════════════════════════════════════════════════════════
          1. WELCOME / STATUS HEADER
      ═══════════════════════════════════════════════════════════ */}
        <motion.div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10" {...fadeUp(0)}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-[var(--text-3)]" />
              <span className="section-label">Dashboard</span>
            </div>
            <h1
              className="font-bold tracking-tight mb-2"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
            >
              Your decision workspace
            </h1>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Pick up an active review, start a new simulation, or build a reusable audience.
            </p>
          </div>

          {/* Right: credits + plan snapshot */}
          <div className="flex items-center gap-3 shrink-0">
            {billing !== null && (
              <Link
                href="/account"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-colors hover:border-[var(--border-strong)]"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-1)" }}
              >
                <Zap size={13} style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }}>
                    {billing.credits_remaining} credits
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    {creditsLow ? "Running low" : "Available"}
                  </p>
                </div>
              </Link>
            )}
            <button
              onClick={() => router.push("/reviews/new?mode=review")}
              className="btn-primary"
            >
              <Plus size={13} />
              New Review
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            2. QUICK-ACTION ROW (shown for returning users)
        ═══════════════════════════════════════════════════════════ */}
        {hasWork && (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10" {...fadeUp(0.05)}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => router.push(action.href)}
                className={`${action.colorClass} rounded-xl p-5 text-left flex flex-col group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`icon-box ${action.iconClass}`}>
                    <Icon size={14} className={action.iconColor} />
                  </div>
                  <ArrowRight size={13} className="mt-0.5 text-[var(--text-3)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-semibold text-sm mb-1 text-[var(--text-1)]">{action.label}</p>
                <p className="text-xs leading-relaxed text-[var(--text-3)]">{action.desc}</p>
              </button>
            );
          })}
        </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            3. RESUME WORK (or EMPTY STATE for new users)
        ═══════════════════════════════════════════════════════════ */}
        <motion.div className="mb-10" {...fadeUp(0.1)}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={18} className="animate-spin text-[var(--text-3)]" />
            </div>
          ) : !hasWork ? (
            <EmptyWorkspace displayName={displayName} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold text-base text-[var(--text-1)]">Resume active work</h2>
                  <div className="flex items-center gap-1 bg-[var(--bg-1)] rounded-lg p-0.5 border border-[var(--border-subtle)]">
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          activeFilter === tab
                            ? "bg-[var(--bg-2)] text-[var(--text-1)] shadow-sm"
                            : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-3)]">
                  {filteredReviews.length} workspace{filteredReviews.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-2">
                {filteredReviews.slice(0, 6).map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <WorkspaceRow review={r} />
                  </motion.div>
                ))}
                {filteredReviews.length > 6 && (
                  <Link
                    href={activeFilter === "Simulations" ? "/simulations" : "/reviews"}
                    className="block text-center text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-2)] py-3 transition-colors"
                  >
                    View all {filteredReviews.length} workspaces
                  </Link>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            4. PRODUCT LANES
        ═══════════════════════════════════════════════════════════ */}
        {!loading && reviews.length > 0 && (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10" {...fadeUp(0.15)}>
            <div
              className="rounded-xl p-5 flex items-center gap-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="icon-box icon-box-amber w-11 h-11 rounded-xl shrink-0">
                <Brain size={16} className="text-[var(--accent-amber)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-1)]">Strategic Reviews</p>
                <p className="text-xs text-[var(--text-3)]">{reviewCount} workspace{reviewCount !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => router.push("/reviews/new?mode=review")}
                className="btn-secondary text-xs px-3 py-2 shrink-0"
              >
                New Review
                <ArrowRight size={11} />
              </button>
            </div>
            <div
              className="rounded-xl p-5 flex items-center gap-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="icon-box icon-box-cyan w-11 h-11 rounded-xl shrink-0">
                <Activity size={16} className="text-[var(--accent-cyan)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-1)]">Audience Simulations</p>
                <p className="text-xs text-[var(--text-3)]">
                  {simCount} simulation{simCount !== 1 ? "s" : ""}
                  {audienceCount !== null && audienceCount > 0 && ` · ${audienceCount} saved audience${audienceCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => router.push("/simulations/new")}
                className="btn-secondary text-xs px-3 py-2 shrink-0"
              >
                New Simulation
                <ArrowRight size={11} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            5. UTILITY SECTION (4 compact cards)
        ═══════════════════════════════════════════════════════════ */}
        {hasWork && (
        <motion.div {...fadeUp(0.2)}>
          <p className="section-label mb-4">Quick access</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Audiences",
                desc: audienceCount !== null && audienceCount > 0
                  ? `${audienceCount} saved`
                  : "Build custom panels",
                icon: Users,
                href: "/audiences",
                iconClass: "icon-box-green",
                iconColor: "text-[var(--accent-emerald)]",
              },
              {
                label: "Context Packs",
                desc: contextPackCount !== null && contextPackCount > 0
                  ? `${contextPackCount} saved`
                  : "Save product context",
                icon: Layers,
                href: "/context-packs",
                iconClass: "icon-box-amber",
                iconColor: "text-[var(--accent-amber)]",
              },
              {
                label: "Sample Outputs",
                desc: "See what SocietyOS produces",
                icon: FileText,
                href: "/demo",
                iconClass: "icon-box-amber",
                iconColor: "text-[var(--accent-amber)]",
              },
              {
                label: "Account & Billing",
                desc: "Credits, plan, and history",
                icon: Zap,
                href: "/account",
                iconClass: "icon-box-muted",
                iconColor: "text-[var(--text-2)]",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="card rounded-xl p-4 flex flex-col gap-3 group"
                >
                  <div className={`icon-box ${item.iconClass}`}>
                    <Icon size={13} className={item.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-1)] group-hover:text-[var(--accent-amber)] transition-colors">{item.label}</p>
                    <p className="text-xs text-[var(--text-3)] leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workspace row                                                       */
/* ------------------------------------------------------------------ */
function WorkspaceRow({ review }: { review: ReviewMeta }) {
  const Icon =
    review.useCase && USE_CASE_ICONS[review.useCase]
      ? USE_CASE_ICONS[review.useCase]
      : FileText;
  const useCaseLabel = review.useCase
    ? (USE_CASE_LABELS[review.useCase] ?? review.useCase)
    : "Review";
  const isSimulation = review.workflowType === "simulation";
  const href = isSimulation ? `/simulations/${review.id}` : `/reviews/${review.id}`;
  const nextAction = getNextAction(review);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-150 group"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-1)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-2)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-1)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
      }}
    >
      <Link href={href} className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`icon-box ${isSimulation ? "icon-box-cyan" : "icon-box-amber"} shrink-0`}
          style={{ width: "2rem", height: "2rem" }}
        >
          <Icon size={12} className={isSimulation ? "text-[var(--accent-cyan)]" : "text-[var(--accent-amber)]"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-[var(--text-1)]">
            {review.title || "Untitled"}
          </p>
          {review.summary && (
            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-3)" }}>
              {review.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: isSimulation ? "var(--accent-cyan-dim)" : "var(--accent-amber-dim)",
                color: isSimulation ? "var(--accent-cyan)" : "var(--accent-amber)",
              }}
            >
              {useCaseLabel}
            </span>
            {review.createdAt && (
              <span className="text-[10px] flex items-center gap-1 text-[var(--text-3)]">
                <Clock size={9} />
                {formatDate(review.createdAt)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0"
        style={{
          background: "var(--bg-0)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-2)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
        }}
      >
        <Play size={10} />
        {nextAction}
      </Link>
      <ChevronRight size={13} className="opacity-0 group-hover:opacity-50 transition-opacity text-[var(--text-3)] shrink-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty workspace state — guided first-move selector                  */
/* ------------------------------------------------------------------ */
function EmptyWorkspace({ displayName }: { displayName: string | null }) {
  const FIRST_MOVES = [
    {
      icon: Lightbulb,
      iconClass: "icon-box-amber",
      iconColor: "text-[var(--accent-amber)]",
      title: "Validate a business idea",
      desc: "Research the market, get expert critique, and a proceed/revise recommendation.",
      bestFor: "New ideas, product concepts",
      href: "/reviews/new?use_case=validate-idea",
      cta: "Start Idea Review",
      cardClass: "card-amber",
    },
    {
      icon: Megaphone,
      iconClass: "icon-box-cyan",
      iconColor: "text-[var(--accent-cyan)]",
      title: "Test ad copy or messaging",
      desc: "Simulate how a target audience will react before you spend on ads.",
      bestFor: "Ads, landing pages, launch copy",
      href: "/simulations/new",
      cta: "Run Simulation",
      cardClass: "card-cyan",
    },
    {
      icon: Building2,
      iconClass: "icon-box-muted",
      iconColor: "text-[var(--text-2)]",
      title: "Analyze your brand",
      desc: "Full audit: SEO, tech, social presence, and competitive landscape.",
      bestFor: "Understanding your position",
      href: "/my-brand/new",
      cta: "Analyze Brand",
      cardClass: "card",
    },
  ];

  return (
    <div className="relative">
      {/* Welcome header */}
      <div className="text-center mb-8">
        <h2
          className="font-bold tracking-tight mb-2"
          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.03em" }}
        >
          {displayName ? `Welcome to SocietyOS, ${displayName}` : "Welcome to SocietyOS"}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Your AI decision lab is ready. Pick a starting point below.
        </p>
      </div>

      {/* 3 guided option cards */}
      <div className="space-y-3 mb-8">
        {FIRST_MOVES.map((move) => {
          const Icon = move.icon;
          return (
            <Link
              key={move.title}
              href={move.href}
              className={`${move.cardClass} rounded-xl p-5 flex items-center gap-5 group transition-all`}
            >
              <div className={`icon-box ${move.iconClass} w-11 h-11 rounded-xl shrink-0`}>
                <Icon size={18} className={move.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[var(--text-1)] mb-0.5">{move.title}</p>
                <p className="text-xs text-[var(--text-3)] leading-relaxed">{move.desc}</p>
                <p className="text-[10px] text-[var(--text-3)] mt-1">
                  <span className="font-medium text-[var(--text-2)]">Best for:</span> {move.bestFor}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors shrink-0">
                {move.cta}
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary quick links */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {[
          { label: "Analyze a Competitor", href: "/competitor-analysis/new" },
          { label: "Build a Custom Audience", href: "/audiences" },
          { label: "Browse Sample Outputs", href: "/demo" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Trust strip */}
      <div className="text-center">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
          SocietyOS uses real-time research, expert-persona analysis, and audience simulation
          to help you make better decisions.{" "}
          <Link href="/methodology" className="underline hover:text-[var(--text-2)] transition-colors">
            See methodology
          </Link>
        </p>
      </div>
    </div>
  );
}
