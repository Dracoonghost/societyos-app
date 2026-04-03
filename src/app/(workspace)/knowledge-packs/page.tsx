"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface KnowledgePack {
  id: string;
  name: string;
  status: "created" | "processing" | "complete" | "failed";
  files: { id: string; filename: string; status: string }[];
  topics: string[];
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: Clock, label: "Draft", color: "var(--text-3)" },
  processing: { icon: Loader2, label: "Processing", color: "var(--accent-amber)" },
  complete: { icon: CheckCircle2, label: "Ready", color: "var(--accent-emerald)" },
  failed: { icon: AlertCircle, label: "Failed", color: "var(--accent-coral)" },
};

export default function KnowledgePacksPage() {
  const { getIdToken, user } = useAuth();
  const [packs, setPacks] = useState<KnowledgePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPacks = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/knowledge-packs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPacks(data.packs ?? []);
    } catch {
      toast.error("Failed to load knowledge packs.");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user !== null) fetchPacks();
    else setLoading(false);
  }, [user, fetchPacks]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this knowledge pack? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const token = await getIdToken();
      await fetch(`${API_URL}/api/knowledge-packs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      setPacks((prev) => prev.filter((p) => p.id !== id));
      toast.success("Knowledge pack deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent-amber)" }} />
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-10 py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}
          >
            Knowledge Packs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Upload documents and build searchable knowledge bases for your reviews.
          </p>
        </div>
        <Link
          href="/knowledge-packs/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--accent-amber)",
            color: "var(--bg-0)",
          }}
        >
          <Plus size={16} /> Create pack
        </Link>
      </div>

      {/* Empty state */}
      {packs.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
        >
          <Layers size={40} style={{ color: "var(--text-3)" }} />
          <p className="mt-4 text-sm" style={{ color: "var(--text-3)" }}>
            No knowledge packs yet. Create one to get started.
          </p>
          <Link
            href="/knowledge-packs/new"
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-amber)", color: "var(--bg-0)" }}
          >
            <Plus size={16} /> Create your first pack
          </Link>
        </div>
      )}

      {/* Pack cards grid */}
      {packs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packs.map((pack) => {
            const statusCfg = STATUS_CONFIG[pack.status] ?? STATUS_CONFIG.created;
            const StatusIcon = statusCfg.icon;

            return (
              <Link
                key={pack.id}
                href={`/knowledge-packs/${pack.id}`}
                className="block rounded-xl p-5 transition-all hover:translate-y-[-1px]"
                style={{
                  backgroundColor: "var(--bg-1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-2)" }}
                    >
                      <Brain size={18} style={{ color: "var(--accent-amber)" }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: "var(--text-1)" }}>
                        {pack.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon
                          size={12}
                          style={{ color: statusCfg.color }}
                          className={pack.status === "processing" ? "animate-spin" : ""}
                        />
                        <span className="text-xs" style={{ color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, pack.id)}
                    disabled={deletingId === pack.id}
                    className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                    style={{ color: "var(--text-3)" }}
                  >
                    {deletingId === pack.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* File count + topics */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1">
                    <FileText size={12} style={{ color: "var(--text-3)" }} />
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {pack.files?.length ?? 0} file{(pack.files?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {pack.topics && pack.topics.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {pack.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                        >
                          {t}
                        </span>
                      ))}
                      {pack.topics.length > 3 && (
                        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          +{pack.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[11px] mt-3" style={{ color: "var(--text-3)" }}>
                  Updated {new Date(pack.updated_at).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
