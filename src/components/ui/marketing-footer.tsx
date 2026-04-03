import Link from "next/link";
import { Compass } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-0)]">
      <div className="max-w-[1280px] mx-auto px-5 py-14">
        {/* Top: logo + trust line */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-12">
          <div className="max-w-xs">
            <div className="mb-3">
              <img src="/logo.svg" alt="SocietyOS" className="h-6 w-auto" />
            </div>
            <p className="text-xs text-[var(--text-3)] leading-relaxed">
              Research-backed briefs, expert-lens critique, and audience simulation in one workspace.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="section-label mb-4">Product</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/reviews/new?mode=review" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Strategic Review
                  </Link>
                </li>
                <li>
                  <Link href="/simulations/new" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Audience Simulation
                  </Link>
                </li>
                <li>
                  <Link href="/simulations/new?use_case=analyze-competitor" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Competitor Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/audiences" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Audience Library
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="section-label mb-4">Resources</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/demo" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Sample Outputs
                  </Link>
                </li>
                <li>
                  <Link href="/methodology" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Methodology
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="section-label mb-4">Company</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/login" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/reviews/new" className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                    Start a Review
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-[var(--text-3)]">
            © {new Date().getFullYear()} SocietyOS. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-3)]">
            AI decision workspace for operators and builders.
          </p>
        </div>
      </div>
    </footer>
  );
}
