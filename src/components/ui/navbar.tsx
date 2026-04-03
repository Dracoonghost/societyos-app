"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Activity,
  LayoutDashboard,
  LogIn,
  LogOut,
  Compass,
  Zap,
  Search,
  BookOpen,
  BarChart2,
} from "lucide-react";
import { useBilling } from "@/contexts/BillingContext";

interface NavUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface NavbarProps {
  user: NavUser | null;
  onLogout: () => void;
  // Legacy props kept for backwards compat — no longer used in new design
  onStrategicReview?: () => void;
  onSimulation?: () => void;
}

const MARKETING_ROUTES = ["/", "/pricing", "/methodology", "/demo", "/login"];

function isMarketingRoute(pathname: string) {
  return (
    MARKETING_ROUTES.includes(pathname) ||
    pathname.startsWith("/demo/")
  );
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const { billing } = useBilling();
  const creditsLow = billing !== null && billing.credits_remaining < 20;
  const pathname = usePathname();
  const isMarketing = isMarketingRoute(pathname);

  const initials = user
    ? (user.displayName ?? user.email ?? "U")[0].toUpperCase()
    : "U";

  return (
    <nav className="navbar">
      <div className="max-w-[1280px] mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href={user ? "/dashboard" : "/"} className="navbar-logo shrink-0">
          <img src="/logo.svg" alt="SocietyOS" className="h-10 w-auto" />
        </Link>

        {/* ── Marketing center nav ── */}
        {isMarketing && (
          <div className="flex items-center gap-1">
            <a href="/#product" className="nav-btn-ghost border-none text-xs hidden sm:flex">Product</a>
            <a href="/#use-cases" className="nav-btn-ghost border-none text-xs hidden sm:flex">Use Cases</a>
            <a href="/#methodology" className="nav-btn-ghost border-none text-xs hidden md:flex">Methodology</a>
            <a href="/#sample-outputs" className="nav-btn-ghost border-none text-xs hidden md:flex">Sample Outputs</a>
            <a href="/#pricing" className="nav-btn-ghost border-none text-xs hidden sm:flex">Pricing</a>
          </div>
        )}

        {/* ── Right section ── */}
        <div className="flex items-center gap-2 shrink-0">
          {isMarketing ? (
            user ? (
              <>
                <Link href="/dashboard" className="nav-btn-ghost text-xs">
                  Dashboard
                </Link>
                <div className="avatar-chip cursor-pointer" onClick={onLogout} title="Sign out">
                  {initials}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-btn-ghost text-xs">
                  <LogIn size={13} />
                  Log in
                </Link>
                <Link href="/reviews/new" className="nav-btn-amber text-xs">
                  Start a Review
                </Link>
              </>
            )
          ) : (
            <>
              {billing !== null && (
                <Link
                  href="/account"
                  className="nav-icon-btn flex items-center gap-1"
                  title="Credits remaining"
                >
                  <Zap size={11} style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }}
                  >
                    {billing.credits_remaining}
                  </span>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "Profile"}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--border-default)] cursor-pointer"
                  />
                ) : (
                  <Link href="/account">
                    <div className="avatar-chip" title="Account">{initials}</div>
                  </Link>
                )}
                {user && (
                  <button onClick={onLogout} className="nav-icon-btn" title="Sign out">
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
