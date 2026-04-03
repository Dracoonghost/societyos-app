"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Zap,
  ArrowUpRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Loader2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/contexts/BillingContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Transaction {
  type: string;
  amount: number;
  balance_after: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  founder_analysis: "Strategic Review",
  founder_chat: "Chat Exchange",
  artifact_generate: "Artifact Generated",
  iteration: "Iteration Run",
  simulation: "Audience Simulation",
  plan_init_free: "Free Plan Credits",
  plan_change: "Plan Change",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, getIdToken } = useAuth();
  const { billing, loading: billingLoading, refreshBilling } = useBilling();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }

    const fetchTransactions = async () => {
      const token = await getIdToken();
      if (!token) { setTxLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/api/billing/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions ?? []);
        }
      } catch {
        // non-fatal
      } finally {
        setTxLoading(false);
      }
    };
    fetchTransactions();
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const planMaxCredits = billing
    ? billing.credits_remaining + billing.credits_used_this_period
    : 1;
  const usedPct = billing
    ? Math.round((billing.credits_used_this_period / Math.max(planMaxCredits, 1)) * 100)
    : 0;
  const remainingPct = 100 - usedPct;

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <motion.div className="mb-10" {...fadeUp(0)}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-[var(--accent-amber)]" />
            <span className="section-label">Account & Billing</span>
          </div>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.03em" }}
          >
            {user?.displayName ?? user?.email?.split("@")[0] ?? "Your account"}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{user?.email}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Plan card */}
          <motion.div
            className="card rounded-xl p-5 col-span-1"
            {...fadeUp(0.05)}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-3)" }}>CURRENT PLAN</p>
            {billingLoading ? (
              <Loader2 size={16} className="animate-spin text-[var(--text-3)]" />
            ) : billing ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-bold text-lg tracking-tight"
                    style={{ color: "var(--text-1)" }}
                  >
                    {billing.plan_name}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: billing.plan_status === "active"
                        ? "rgba(52,211,153,0.1)"
                        : "var(--bg-2)",
                      color: billing.plan_status === "active"
                        ? "var(--accent-emerald)"
                        : "var(--text-3)",
                    }}
                  >
                    {billing.plan_status}
                  </span>
                </div>
                {billing.period_end && (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Renews {new Date(billing.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
                <Link
                  href="/pricing"
                  className="btn-secondary text-xs mt-4 w-full justify-center"
                >
                  View plans
                  <ArrowUpRight size={11} />
                </Link>
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>No billing data</p>
            )}
          </motion.div>

          {/* Credits card */}
          <motion.div
            className="card rounded-xl p-5 col-span-2"
            {...fadeUp(0.08)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>CREDITS</p>
              <button
                onClick={refreshBilling}
                className="nav-icon-btn"
                title="Refresh"
              >
                <RefreshCw size={11} />
              </button>
            </div>

            {billingLoading ? (
              <Loader2 size={16} className="animate-spin text-[var(--text-3)]" />
            ) : billing ? (
              <>
                <div className="flex items-end gap-2 mb-1">
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      fontSize: "2.5rem",
                      letterSpacing: "-0.03em",
                      color: billing.credits_remaining < 20
                        ? "var(--accent-red, #f87171)"
                        : "var(--text-1)",
                    }}
                  >
                    {billing.credits_remaining}
                  </span>
                  <span className="text-sm mb-1.5" style={{ color: "var(--text-3)" }}>
                    credits remaining
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full rounded-full overflow-hidden mb-3"
                  style={{ height: "6px", background: "var(--bg-2)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${remainingPct}%`,
                      background: billing.credits_remaining < 20
                        ? "var(--accent-red, #f87171)"
                        : "var(--accent-amber)",
                    }}
                  />
                </div>

                <div className="flex gap-4 text-xs" style={{ color: "var(--text-3)" }}>
                  <span>{billing.credits_used_this_period} used</span>
                  <span>{planMaxCredits} total</span>
                </div>

                {billing.credits_remaining < 20 && (
                  <div
                    className="mt-4 rounded-lg px-3 py-2 text-xs"
                    style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
                  >
                    Running low on credits.{" "}
                    <Link href="/pricing" className="underline">
                      Upgrade your plan
                    </Link>{" "}
                    to keep going.
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>No credit data</p>
            )}
          </motion.div>
        </div>

        {/* Transaction history */}
        <motion.div {...fadeUp(0.12)}>
          <div
            className="flex items-center justify-between mb-4 pb-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-2)" }}>
              Transaction History
            </h2>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Last 20</span>
          </div>

          {txLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={18} className="animate-spin text-[var(--text-3)]" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--text-3)" }}>
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx, i) => {
                const isDebit = tx.amount < 0;
                const label = REASON_LABELS[tx.reason] ?? tx.reason;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-1)" }}
                  >
                    <div
                      className="icon-box flex-shrink-0"
                      style={{
                        width: "1.75rem",
                        height: "1.75rem",
                        background: isDebit ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)",
                      }}
                    >
                      {isDebit
                        ? <TrendingDown size={11} style={{ color: "#f87171" }} />
                        : <TrendingUp size={11} style={{ color: "var(--accent-emerald)" }} />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--text-1)" }}>
                        {label}
                      </p>
                      {tx.reference_id && (
                        <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                          ref: {tx.reference_id}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isDebit ? "#f87171" : "var(--accent-emerald)" }}
                      >
                        {isDebit ? "" : "+"}{tx.amount} cr
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        → {tx.balance_after}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: "var(--text-3)" }}>
                        <Clock size={9} />
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
