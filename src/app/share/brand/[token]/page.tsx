"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Building2 } from "lucide-react";
import { BrandReport } from "@/components/brand/BrandReport";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface SharedBrand {
  id: string;
  brand_url: string;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  category?: string | null;
  completed_at?: string;
  analysis?: Record<string, Record<string, unknown> | null>;
  extracted_signals?: {
    seo_signals?: unknown;
    pagespeed?: unknown;
    tech_signals?: unknown;
  } | null;
  sections_generated?: string[];
  competitors_discovered?: unknown[];
  share_token?: string | null;
}

export default function SharedBrandPage() {
  const { token } = useParams<{ token: string }>();
  const [brand, setBrand] = useState<SharedBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/share/brands/${token}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setBrand({ ...data, id: data.id ?? data._id });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-[var(--text-3)] animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <AlertCircle size={24} className="text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-3)]">This shared report is no longer available.</p>
        <Link href="/" className="text-xs text-[var(--accent-amber)] hover:underline">
          Back to SocietyOS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)" }}>
      {/* Shared-by banner */}
      <div className="border-b py-2 px-6 flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-1)" }}>
        <div className="flex items-center gap-2">
          <Building2 size={13} className="text-[var(--accent-amber)]" />
          <span className="text-xs font-semibold text-[var(--text-2)]">SocietyOS Brand Report</span>
          <span className="text-[10px] text-[var(--text-3)] ml-1">· Shared view (read-only)</span>
        </div>
        <Link href="https://societyos.ai" target="_blank" rel="noopener noreferrer"
          className="text-[10px] font-semibold text-[var(--accent-amber)] hover:underline whitespace-nowrap">
          Run your own brand analysis →
        </Link>
      </div>

      {/* Report — no actions (read-only) */}
      <BrandReport
        brand={brand as Parameters<typeof BrandReport>[0]["brand"]}
        linkedReports={[]}
        brandId={brand.id}
        token=""
        apiBase={API_URL}
        onRefresh={() => {}}
        onDelete={() => {}}
        onNavigate={() => {}}
        readOnly
      />
    </div>
  );
}
