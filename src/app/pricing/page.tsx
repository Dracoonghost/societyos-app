"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Plan {
  id: string;
  name: string;
  price_usd: number;
  billing_cycle: string;
  monthly_credits: number;
  credit_rollover: boolean;
  features: string[];
}

const PLAN_ORDER = ["free", "starter", "pro", "enterprise"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export default function PricingPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

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
      .finally(() => setLoading(false));
  }, []);

  function handleCta(plan: Plan) {
    if (plan.id === "free") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }
    if (plan.id === "enterprise") {
      window.location.href = "mailto:hello@societyos.ai?subject=Enterprise Plan";
      return;
    }
    toast.info("Paid plans coming soon — we'll notify you when billing is live.");
  }

  return (
    <div className="page-root dot-grid min-h-screen">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div className="text-center mb-16" {...fadeUp(0)}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={13} className="text-[var(--accent-amber)]" />
            <span className="section-label">Pricing</span>
          </div>
          <h1
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
          >
            Simple, credit-based pricing
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-2)" }}>
            Pay for what you use. Each analysis, simulation, and artifact costs credits.
            Plans reset monthly — no surprises.
          </p>
        </motion.div>

        {/* Credit cost reference */}
        <motion.div
          className="card rounded-xl px-6 py-5 mb-12 max-w-2xl mx-auto"
          {...fadeUp(0.05)}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-3)" }}>
            CREDIT COSTS
          </p>
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
        </motion.div>

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--accent-amber)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            {...fadeUp(0.1)}
          >
            {plans.map((plan, i) => {
              const isPro = plan.id === "pro";
              const isEnterprise = plan.id === "enterprise";
              return (
                <motion.div
                  key={plan.id}
                  {...fadeUp(0.1 + i * 0.05)}
                  className="relative rounded-2xl flex flex-col"
                  style={{
                    border: isPro
                      ? "1px solid var(--accent-amber)"
                      : "1px solid var(--border-subtle)",
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
                    <p className="font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                      {plan.name}
                    </p>
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
                            <span className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                              /mo
                            </span>
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
                    onClick={() => handleCta(plan)}
                    className={isPro ? "btn-primary text-xs w-full justify-center" : "btn-secondary text-xs w-full justify-center"}
                  >
                    {plan.id === "free"
                      ? "Get started free"
                      : plan.id === "enterprise"
                      ? "Contact us"
                      : "Coming soon"}
                    <ArrowRight size={12} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p
          className="text-center text-xs mt-12"
          style={{ color: "var(--text-3)" }}
          {...fadeUp(0.35)}
        >
          Credits reset monthly. Unused credits do not roll over on Starter and Pro plans.
          All prices in USD.
        </motion.p>

        <motion.p className="text-center text-xs mt-4" {...fadeUp(0.4)}>
          <Link href="/demo" style={{ color: "var(--accent-amber)" }}>
            See sample outputs →
          </Link>{" "}
          <span style={{ color: "var(--text-3)" }}>to understand what you get before committing.</span>
        </motion.p>

        {/* Final CTA */}
        <motion.div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(242,169,59,0.22)" }}
          {...fadeUp(0.45)}
        >
          <p
            className="font-bold mb-2"
            style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}
          >
            Ready to put a decision through the system?
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
            Start with 50 free credits. No card required.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/login" className="btn-primary">
              Start free
              <ArrowRight size={13} />
            </Link>
            <Link href="/demo" className="btn-secondary">
              See sample outputs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
