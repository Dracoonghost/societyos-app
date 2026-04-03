"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BrandReport } from "@/components/brand/BrandReport";
import { BrandProgressScreen } from "@/components/brand/BrandProgressScreen";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type PagePhase = "loading" | "in_progress" | "complete" | "failed" | "not_found";

interface Brand {
  id: string;
  brand_url: string;
  brand_name?: string | null;
  industry?: string | null;
  status: string;
  current_step?: string | null;
  error_message?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  sections_generated?: string[];
  competitors_discovered?: Competitor[];
  socials_discovered?: Record<string, string | null>;
  competitor_report_ids?: string[];
  analysis?: Record<string, Record<string, unknown> | null>;
  brand_logo_url?: string | null;
  extracted_signals?: {
    seo_signals?: { sitemap_route_count?: number | null; [key: string]: unknown } | null;
    pagespeed?: unknown;
    tech_signals?: unknown;
  } | null;
  share_token?: string | null;
}

interface Competitor {
  name: string;
  url?: string | null;
  description?: string | null;
  why_competitive?: string | null;
  evidence_source?: string | null;
}

interface CompetitorReport {
  id: string;
  competitor_url: string;
  competitor_name?: string | null;
  status: string;
  created_at: string;
}

interface StatusData {
  status: string;
  current_step?: string | null;
  sections_generated?: string[];
  competitors_discovered?: Competitor[];
  socials_discovered?: Record<string, string | null>;
  brand_logo_url?: string | null;
}


function BrandStatusPoller({
  brandId,
  token,
  onComplete,
  onFailed,
  onStatusUpdate,
}: {
  brandId: string;
  token: string;
  onComplete: () => void;
  onFailed: (err: string) => void;
  onStatusUpdate: (data: StatusData) => void;
}) {
  const stoppedRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  // Keep a lightweight polling loop running as a safety net in case the
  // EventSource connection stays open but progress events stop arriving.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;
    stoppedRef.current = false;

    // ── SSE primary ──────────────────────────────────────────────────────
    const url = `${API_URL}/api/jobs/brand/${brandId}/progress?token=${encodeURIComponent(token)}`;

    const startSSE = () => {
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (event) => {
        if (stoppedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.status || msg.step) {
            onStatusUpdate({
              status: msg.status ?? "",
              current_step: msg.step ?? null,
              sections_generated: msg.sections_generated ?? null,
            });
          }
          if (msg.type === "done" || msg.status === "complete") {
            stoppedRef.current = true;
            es.close();
            onComplete();
          } else if (msg.status === "failed") {
            stoppedRef.current = true;
            es.close();
            onFailed(msg.error ?? "Analysis failed");
          }
        } catch {
          // malformed — ignore
        }
      };

      es.onerror = () => {
        if (stoppedRef.current) return;
        es.close();
      };
    };

    // ── Polling fallback ─────────────────────────────────────────────────
    const poll = async () => {
      if (stoppedRef.current) return;
      try {
        const statusUrl = new URL(`${API_URL}/api/brands/${brandId}/status`);
        statusUrl.searchParams.set("_ts", String(Date.now()));
        const res = await fetch(statusUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: StatusData = await res.json();
        onStatusUpdate(data);
        if (data.status === "complete") {
          stoppedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete();
        } else if (data.status === "failed") {
          stoppedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onFailed(data.status);
        }
      } catch {
        // network blip — keep going
      }
    };

    const startPolling = () => {
      if (stoppedRef.current || intervalRef.current) return;
      poll();
      intervalRef.current = setInterval(poll, 3000);
    };

    startPolling();
    startSSE();

    return () => {
      stoppedRef.current = true;
      esRef.current?.close();
      esRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [brandId, token, onComplete, onFailed, onStatusUpdate]);

  return null;
}

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<PagePhase>("loading");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [linkedReports, setLinkedReports] = useState<CompetitorReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const tokenRef = useRef<string>("");

  const getToken = useCallback(async () => {
    if (!user) return "";
    const { getIdToken } = await import("firebase/auth");
    const t = await getIdToken(user as Parameters<typeof getIdToken>[0]);
    tokenRef.current = t;
    return t;
  }, [user]);

  const fetchBrand = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const brandUrl = new URL(`${API_URL}/api/brands/${id}`);
      brandUrl.searchParams.set("_ts", String(Date.now()));
      const res = await fetch(brandUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 404) { setPhase("not_found"); return; }
      if (!res.ok) throw new Error("fetch failed");
      const data: Brand = await res.json();
      setBrand(data);
      if (data.status === "complete") {
        setPhase("complete");
      } else if (data.status === "failed") {
        setPhase("failed");
      } else {
        setPhase("in_progress");
        setStatusData({ status: data.status, current_step: data.current_step });
      }
    } catch {
      setPhase("failed");
    }
  }, [id, getToken]);

  const fetchLinkedReports = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/brands/${id}/competitors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: CompetitorReport[] = await res.json();
        setLinkedReports(data);
      }
    } catch {
      // non-critical
    }
  }, [id, getToken]);

  useEffect(() => { fetchBrand(); }, [fetchBrand]);
  useEffect(() => { getToken(); }, [getToken]);

  const handleStatusUpdate = useCallback((data: StatusData) => {
    setStatusData(data);
    if (data.status === "analyzing") {
      fetchBrand();
    }
  }, [fetchBrand]);

  const handleComplete = useCallback(() => {
    fetchBrand();
    fetchLinkedReports();
  }, [fetchBrand, fetchLinkedReports]);

  const handleFailed = useCallback((error: string) => {
    setBrand((prev) => prev ? { ...prev, status: "failed", error_message: error } : null);
    setPhase("failed");
  }, []);

  async function handleRefresh() {
    if (!brand) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/brands/${id}/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402 && err.detail?.error === "insufficient_credits") {
          setRefreshError(`Not enough credits — need ${err.detail.credits_required}, have ${err.detail.credits_remaining}.`);
          return;
        }
        throw new Error("refresh failed");
      }
      setPhase("loading");
      await fetchBrand();
    } catch {
      setRefreshError("Refresh failed. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleResume() {
    if (!brand) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/brands/${id}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("resume failed");
      setPhase("loading");
      await fetchBrand();
    } catch {
      setRefreshError("Resume failed. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${brand?.brand_name || brand?.brand_url}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/brands/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/my-brand");
      }
    } catch {
      // stay on page
    } finally {
      setDeleting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-[var(--text-3)] animate-spin" />
      </div>
    );
  }

  if (phase === "not_found") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle size={24} className="text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-3)]">Brand not found.</p>
        <Link href="/my-brand" className="text-xs text-[var(--accent-amber)] hover:underline">
          ← Back to My Brand
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // In-progress
  // -------------------------------------------------------------------------
  if (phase === "in_progress") {
    const currentStatus = statusData?.status ?? brand?.status ?? "queued";
    const currentStep = statusData?.current_step ?? brand?.current_step;
    const generatedSections = statusData?.sections_generated ?? brand?.sections_generated ?? [];
    const logoUrl = statusData?.brand_logo_url ?? brand?.brand_logo_url;

    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/my-brand" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-3)] uppercase tracking-wider">Analysing Brand</p>
            <h1 className="text-base font-bold text-[var(--text-1)] truncate">
              {brand?.brand_name || brand?.brand_url}
            </h1>
          </div>
        </div>

        {tokenRef.current && (
          <BrandStatusPoller
            brandId={id}
            token={tokenRef.current}
            onComplete={handleComplete}
            onFailed={handleFailed}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        <BrandProgressScreen
          status={currentStatus}
          currentStep={currentStep}
          sectionsGenerated={generatedSections}
          brandName={brand?.brand_name}
          brandUrl={brand?.brand_url}
          brandLogoUrl={logoUrl}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Failed
  // -------------------------------------------------------------------------
  if (phase === "failed") {
    const generatedSections = statusData?.sections_generated ?? brand?.sections_generated ?? [];
    const logoUrl = statusData?.brand_logo_url ?? brand?.brand_logo_url;
    const checkpoint = generatedSections.length > 0;

    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/my-brand" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-base font-bold text-[var(--text-1)]">
            {brand?.brand_name || brand?.brand_url || "Brand Analysis"}
          </h1>
        </div>
        {refreshError && (
          <p className="text-xs text-red-400 text-center mb-4">{refreshError}</p>
        )}
        <BrandProgressScreen
          status="failed"
          sectionsGenerated={generatedSections}
          brandName={brand?.brand_name}
          brandUrl={brand?.brand_url}
          brandLogoUrl={logoUrl}
          errorMessage={brand?.error_message}
          onRetry={handleRefresh}
          onResume={checkpoint ? handleResume : undefined}
          retrying={refreshing}
          hasCheckpoint={checkpoint}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Complete
  // -------------------------------------------------------------------------
  return (
    <BrandReport
      brand={brand!}
      linkedReports={linkedReports}
      brandId={id}
      token={tokenRef.current ?? ""}
      apiBase={API_URL}
      onRefresh={handleRefresh}
      onDelete={handleDelete}
      onNavigate={(reportId) => router.push(`/competitor-analysis/${reportId}`)}
      refreshing={refreshing}
      deleting={deleting}
      refreshError={refreshError}
    />
  );
}
