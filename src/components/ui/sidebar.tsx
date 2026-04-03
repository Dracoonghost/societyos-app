"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  Activity,
  Users,
  Layers,
  Zap,
  LogOut,
  BookOpen,
  Target,
  Building2,
  Plus,
  Megaphone,
  Eye,
  ChevronDown,
} from "lucide-react";
import { useBilling } from "@/contexts/BillingContext";

interface SidebarUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface SidebarProps {
  user: SidebarUser | null;
  onLogout: () => void;
}

/* ── Nav group data ─────────────────────────────────────────── */
const WORKSPACE_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reviews", href: "/reviews", icon: Brain },
  { label: "Simulations", href: "/simulations", icon: Activity },
];

const INTELLIGENCE_ITEMS = [
  { label: "Competitor Intel", href: "/competitor-analysis", icon: Target },
  { label: "My Brand", href: "/my-brand", icon: Building2 },
];

const LIBRARY_ITEMS = [
  { label: "Audiences", href: "/audiences", icon: Users },
  { label: "Knowledge Packs", href: "/knowledge-packs", icon: Layers },
];

const RESOURCE_ITEMS = [
  { label: "Sample Outputs", href: "/demo", icon: Eye },
  { label: "Methodology", href: "/methodology", icon: BookOpen },
  { label: "Account & Billing", href: "/account", icon: Zap },
];

const NEW_MENU_ITEMS = [
  { label: "Strategic Review", href: "/reviews/new?mode=review", icon: Brain, color: "var(--accent-amber)" },
  { label: "Audience Simulation", href: "/simulations/new", icon: Activity, color: "var(--accent-cyan)" },
  { label: "Competitor Analysis", href: "/competitor-analysis/new", icon: Target, color: "var(--text-2)" },
  { label: "Build Audience", href: "/audiences", icon: Users, color: "var(--accent-emerald)" },
  { label: "Analyze My Brand", href: "/my-brand/new", icon: Building2, color: "var(--text-2)" },
];

/* ── Component ──────────────────────────────────────────────── */
export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { billing } = useBilling();
  const creditsLow = billing !== null && billing.credits_remaining < 20;
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? (user.displayName ?? user.email ?? "U")[0].toUpperCase()
    : "U";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false);
      }
    }
    if (newMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [newMenuOpen]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({ label, href, icon: Icon }: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-[var(--bg-2)] text-[var(--text-1)] border border-[var(--border-subtle)] shadow-sm"
            : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-1)] border border-transparent"
        }`}
      >
        <Icon size={14} className={active ? "text-[var(--accent-amber)]" : "text-[var(--text-3)]"} />
        {label}
      </Link>
    );
  }

  function SectionLabel({ text }: { text: string }) {
    return (
      <div className="px-2 mt-6 mb-2 first:mt-0">
        <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">{text}</p>
      </div>
    );
  }

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-0)] hidden md:flex flex-col h-screen sticky top-0 left-0">
      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-5 shrink-0 border-b border-[var(--border-subtle)]">
        <Link href={user ? "/dashboard" : "/"}>
          <img src="/logo.svg" alt="SocietyOS" className="h-6 w-auto" />
        </Link>
      </div>

      {/* ── + New button ── */}
      <div className="px-3 pt-4 pb-1 relative" ref={menuRef}>
        <button
          onClick={() => setNewMenuOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-[var(--accent-amber)] text-[#000] hover:opacity-90"
        >
          <Plus size={15} />
          New
          <ChevronDown size={12} className={`ml-auto transition-transform ${newMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {newMenuOpen && (
          <div
            className="absolute left-3 right-3 top-full mt-1 rounded-xl py-1 z-50 shadow-lg"
            style={{ background: "var(--panel-elevated)", border: "1px solid var(--border-default)" }}
          >
            {NEW_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => { setNewMenuOpen(false); router.push(item.href); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-2)] transition-colors text-left"
                >
                  <Icon size={14} style={{ color: item.color }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Nav ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5">
        <SectionLabel text="Workspace" />
        {WORKSPACE_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}

        <SectionLabel text="Intelligence" />
        {INTELLIGENCE_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}

        <SectionLabel text="Library" />
        {LIBRARY_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}

        {/* Separator */}
        <div className="mt-6 mb-2 border-t border-[var(--border-subtle)]" />

        <SectionLabel text="Resources" />
        {RESOURCE_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--bg-2)] text-[var(--text-1)] border border-[var(--border-subtle)] shadow-sm"
                  : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-1)] border border-transparent"
              }`}
            >
              <Icon size={14} className={active ? "text-[var(--text-1)]" : "text-[var(--text-3)]"} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ── User & Credits ── */}
      <div className="shrink-0 border-t border-[var(--border-subtle)] p-4 flex flex-col gap-3">
        {billing !== null && (
          <Link
            href="/account"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-1)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }} />
              <span className="text-xs font-medium text-[var(--text-1)]">Credits</span>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: creditsLow ? "#f87171" : "var(--accent-amber)" }}
            >
              {billing.credits_remaining}
            </span>
          </Link>
        )}

        <div className="flex items-center gap-3 group relative cursor-pointer" onClick={onLogout} title="Sign out">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? "Profile"}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border-default)]"
            />
          ) : (
            <div className="avatar-chip w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-2)] border border-[var(--border-strong)] text-xs font-medium text-[var(--text-1)]">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-1)] truncate">
              {user?.displayName || "User"}
            </p>
            <p className="text-[10px] text-[var(--text-3)] truncate">
              {user?.email || "Account"}
            </p>
          </div>
          <LogOut size={14} className="text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </aside>
  );
}
