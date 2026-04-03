"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Megaphone,
  MessageSquare,
  Rocket,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  Target,
  Play,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyStateDecor } from "@/components/ui/DecorativeViz";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ------------------------------------------------------------------ */
/*  Types & Helpers                                                     */
/* ------------------------------------------------------------------ */
interface ReviewMeta {
  id: string;
  title: string;
  useCase: string | null;
  workflowType: "review" | "simulation" | null;
  status: string;
  createdAt: string | null;
  updatedAt?: string | null;
}

const USE_CASE_LABELS: Record<string, string> = {
  "test-ad": "Test Ad",
  "test-messaging": "Test Messaging",
  "stress-test-launch": "Stress-Test Launch",
  "analyze-competitor": "Competitor Analysis",
};

const USE_CASE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
  return "Resume Simulation";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function SimulationsListPage() {
  const router = useRouter();
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [simulations, setSimulations] = useState<ReviewMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      const token = await getIdToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/api/reviews`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          const data = await res.json();
          // Filter to only 'simulation' type
          setSimulations((data.reviews ?? []).filter((r: ReviewMeta) => r.workflowType === "simulation"));
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8 md:py-12">
      <motion.div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10" {...fadeUp(0)}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} className="text-[var(--accent-cyan)]" />
            <span className="section-label">Simulations</span>
          </div>
          <h1 className="font-bold tracking-tight mb-2" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}>
            Audience Simulations
          </h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Test messaging, campaigns, and launches with AI-driven audience panels.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push("/simulations/new")} className="btn-secondary flex items-center gap-2" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)'}}>
            <Plus size={13} />
            New Simulation
          </button>
        </div>
      </motion.div>

      <motion.div className="mb-10" {...fadeUp(0.1)}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={18} className="animate-spin text-[var(--text-3)]" />
          </div>
        ) : simulations.length === 0 ? (
          <EmptySimulationState />
        ) : (
          <div className="space-y-2">
            {simulations.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <WorkspaceRow review={r} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workspace row                                                       */
/* ------------------------------------------------------------------ */
function WorkspaceRow({ review }: { review: ReviewMeta }) {
  const Icon = review.useCase && USE_CASE_ICONS[review.useCase] ? USE_CASE_ICONS[review.useCase] : FileText;
  const useCaseLabel = review.useCase ? (USE_CASE_LABELS[review.useCase] ?? review.useCase) : "Simulation";
  const href = `/simulations/${review.id}`;
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
        <div className="icon-box icon-box-cyan shrink-0" style={{ width: "2rem", height: "2rem" }}>
          <Icon size={12} className="text-[var(--accent-cyan)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-[var(--text-1)]">
            {review.title || "Untitled"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--accent-cyan-dim)", color: "var(--accent-cyan)" }}
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
        style={{ background: "var(--bg-0)", borderColor: "var(--border-subtle)", color: "var(--text-2)" }}
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
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */
function EmptySimulationState() {
  return (
    <div
      className="relative flex flex-col items-center justify-center py-20 px-6 rounded-2xl text-center overflow-hidden"
      style={{ border: "1px dashed var(--border-default)", background: "var(--bg-1)" }}
    >
      <EmptyStateDecor />
      <div className="icon-box icon-box-cyan mb-5" style={{ width: "3rem", height: "3rem", borderRadius: "1rem" }}>
        <Activity size={20} className="text-[var(--accent-cyan)]" />
      </div>
      <p className="font-semibold mb-2 text-[var(--text-1)]">No simulations yet</p>
      <p className="text-sm mb-7 max-w-xs leading-relaxed text-[var(--text-3)]">
        Test how an audience reacts to your messaging and campaigns.
      </p>
      <Link href="/simulations/new" className="btn-secondary text-xs px-4 py-2.5">
        <Plus size={12} />
        New Simulation
      </Link>
    </div>
  );
}
