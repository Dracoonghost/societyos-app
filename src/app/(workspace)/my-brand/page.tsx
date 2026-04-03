"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Users,
  Globe,
  TrendingUp,
  FlaskConical,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BrandSummary {
  id: string;
  brand_url: string;
  brand_name?: string;
  status: string;
  category?: string;
  created_at?: string;
  completed_at?: string;
  sections_generated?: string[];
  competitors_count?: number;
  socials_count?: number;
  health_label?: string;
  brand_logo_url?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    complete:   { label: "Complete",    color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",         icon: <CheckCircle size={11} /> },
    failed:     { label: "Failed",      color: "text-red-400 bg-red-950/40 border-red-800/40",                     icon: <XCircle size={11} /> },
    analyzing:  { label: "Analysing…",  color: "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30",   icon: <Loader2 size={11} className="animate-spin" /> },
    scraping:   { label: "Crawling…",   color: "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30",   icon: <Loader2 size={11} className="animate-spin" /> },
    classifying:{ label: "Classifying…",color: "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30",   icon: <Loader2 size={11} className="animate-spin" /> },
    queued:     { label: "Queued",       color: "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]", icon: <Clock size={11} /> },
  };
  const cfg = map[status] ?? { label: status, color: "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]", icon: <AlertCircle size={11} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function HealthBadge({ label }: { label?: string }) {
  if (!label) return null;
  const colorMap: Record<string, string> = {
    "Excellent":    "text-emerald-400 bg-emerald-950/30 border-emerald-800/30",
    "Good":         "text-[var(--accent-cyan)] bg-cyan-950/30 border-cyan-800/30",
    "Needs Work":   "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30",
    "Critical":     "text-red-400 bg-red-950/30 border-red-800/30",
  };
  const color = colorMap[label] ?? "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${color}`}>
      <TrendingUp size={9} />
      {label}
    </span>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function MyBrandPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [phase, setPhase] = useState<"loading" | "loaded" | "error">("loading");

  const fetchBrands = useCallback(async () => {
    if (!user) return;
    try {
      const { getIdToken } = await import("firebase/auth");
      const token = await getIdToken(user as Parameters<typeof getIdToken>[0]);
      const res = await fetch(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      setBrands(data.brands ?? []);
      setPhase("loaded");
    } catch {
      setPhase("error");
    }
  }, [user]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-[var(--accent-cyan)]" />
            <h1 className="text-xl font-bold text-[var(--text-1)]">My Brand</h1>
          </div>
          <p className="text-sm text-[var(--text-3)]">
            Full self-analysis: SEO audit, technical review, social profiles, competitor landscape, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/my-brand/lab"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-2)] text-sm font-semibold hover:bg-[var(--bg-1)] hover:text-[var(--text-1)] transition-all"
          >
            <FlaskConical size={14} />
            Lab
          </Link>
          <Link
            href="/my-brand/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={14} />
            Add Brand
          </Link>
        </div>
      </div>

      {/* States */}
      {phase === "loading" && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="text-[var(--text-3)] animate-spin" />
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-[var(--text-3)]">Failed to load brands.</p>
          <button onClick={fetchBrands} className="text-xs text-[var(--accent-amber)] hover:underline">
            Try again
          </button>
        </div>
      )}

      {phase === "loaded" && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Building2 size={22} className="text-[var(--text-3)]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--text-1)]">No brands added yet</p>
            <p className="text-sm text-[var(--text-3)] mt-1 max-w-xs">
              Add your brand&apos;s URL to get a complete analysis — SEO, technical health, social presence, and competitive landscape.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2 text-center max-w-xs">
            {[
              { icon: Globe, label: "SEO & Technical" },
              { icon: Users, label: "Social Media" },
              { icon: TrendingUp, label: "Competitors" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl border"
                style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
              >
                <Icon size={14} className="text-[var(--text-3)]" />
                <p className="text-[10px] text-[var(--text-3)] font-medium">{label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/my-brand/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={14} />
            Add Your First Brand
          </Link>
        </div>
      )}

      {phase === "loaded" && brands.length > 0 && (
        <div className="flex flex-col gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/my-brand/${brand.id}`}
              className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-[var(--bg-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
            >
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
                {brand.brand_logo_url ? (
                  <img
                    src={brand.brand_logo_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-base font-bold text-[var(--text-2)]">
                    {(brand.brand_name || brand.brand_url)[0].toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--text-1)] truncate">
                    {brand.brand_name || brand.brand_url}
                  </p>
                  <StatusBadge status={brand.status} />
                  <HealthBadge label={brand.health_label} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-[var(--text-3)] flex items-center gap-1 truncate">
                    <ExternalLink size={9} className="shrink-0" />
                    {brand.brand_url}
                  </span>
                  {brand.status === "complete" && (
                    <>
                      {brand.competitors_count != null && brand.competitors_count > 0 && (
                        <span className="text-[10px] text-[var(--text-3)]">
                          {brand.competitors_count} competitor{brand.competitors_count !== 1 ? "s" : ""}
                        </span>
                      )}
                      {brand.socials_count != null && brand.socials_count > 0 && (
                        <span className="text-[10px] text-[var(--text-3)]">
                          {brand.socials_count} social{brand.socials_count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right hidden sm:flex flex-col items-end gap-1">
                {brand.completed_at ? (
                  <p className="text-xs text-[var(--text-3)]">Analysed {formatDate(brand.completed_at)}</p>
                ) : (
                  <p className="text-xs text-[var(--text-3)]">Added {formatDate(brand.created_at)}</p>
                )}
                {brand.category && (
                  <span className="text-[10px] text-[var(--text-3)] px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--border-subtle)] capitalize">
                    {brand.category.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <RefreshCw
                size={13}
                className="text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
