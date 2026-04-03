"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import KnowledgePackChat from "@/components/knowledge-pack/KnowledgePackChat";
import {
  ArrowLeft,
  Brain,
  Loader2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Upload,
  LayoutDashboard,
  FolderOpen,
  MessageSquareQuote,
} from "lucide-react";

const MindMapView = dynamic(
  () => import("@/components/knowledge-pack/MindMapView"),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type TabId = "overview" | "files" | "chat";

interface KnowledgePackFile {
  id: string;
  filename: string;
  content_type: string;
  status: string;
  chunk_count: number;
  error_message?: string;
  uploaded_at: string;
}

interface MindMapData {
  nodes: { id: string; label: string; type: string; summary?: string }[];
  edges: { source: string; target: string; label?: string }[];
}

interface KnowledgePack {
  id: string;
  name: string;
  product_summary: string;
  primary_user: string;
  product_stage: string;
  core_workflow: string;
  business_model: string;
  constraints: string;
  pasted_notes: string;
  context_summary: string;
  status: "created" | "processing" | "complete" | "failed";
  files: KnowledgePackFile[];
  mind_map: MindMapData;
  topics: string[];
  rag_strategy: string | null;
  total_chunks: number;
  created_at: string;
  updated_at: string;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "chat", label: "Chat", icon: MessageSquareQuote },
];

const FILE_STATUS: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  queued: { icon: Clock, label: "Queued", color: "var(--text-3)" },
  extracting: { icon: Loader2, label: "Extracting", color: "var(--accent-amber)" },
  chunking: { icon: Loader2, label: "Chunking", color: "var(--accent-amber)" },
  embedding: { icon: Loader2, label: "Embedding", color: "var(--accent-amber)" },
  complete: { icon: CheckCircle2, label: "Ready", color: "var(--accent-emerald)" },
  failed: { icon: AlertCircle, label: "Failed", color: "var(--accent-coral)" },
};

export default function KnowledgePackDetailPage() {
  const params = useParams();
  const packId = params.id as string;
  const { getIdToken, loading: authLoading } = useAuth();
  const [pack, setPack] = useState<KnowledgePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const packStatus = pack?.status;

  const fetchPack = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/knowledge-packs/${packId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPack(data.pack);
    } catch {
      toast.error("Failed to load knowledge pack.");
    } finally {
      setLoading(false);
    }
  }, [packId, getIdToken]);

  useEffect(() => {
    if (!authLoading) fetchPack();
  }, [fetchPack, authLoading]);

  // SSE for processing progress
  useEffect(() => {
    if (packStatus !== "processing") return;

    let es: EventSource | null = null;

    const connectSSE = async () => {
      const token = await getIdToken();
      if (!token) return;
      es = new EventSource(
        `${API_URL}/api/jobs/knowledge_pack/${packId}/progress?token=${encodeURIComponent(token)}`
      );
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "done" || data.status === "complete" || data.status === "failed") {
            es?.close();
            fetchPack();
          }
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => {
        es?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    return () => { es?.close(); };
  }, [packStatus, packId, getIdToken, fetchPack]);

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId);
    try {
      const token = await getIdToken();
      await fetch(`${API_URL}/api/knowledge-packs/${packId}/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      await fetchPack();
      toast.success("File deleted.");
    } catch {
      toast.error("Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleUploadMore = async (fileList: FileList) => {
    setUploading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const fd = new FormData();
      for (const f of Array.from(fileList)) fd.append("files", f);
      await fetch(`${API_URL}/api/knowledge-packs/${packId}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      toast.success("Files uploaded. Processing started.");
      await fetchPack();
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent-amber)" }} />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="px-6 sm:px-10 py-8 max-w-5xl mx-auto">
        <p style={{ color: "var(--text-3)" }}>Knowledge pack not found.</p>
      </div>
    );
  }

  const isProcessing = pack.status === "processing";

  return (
    <div className="px-6 sm:px-10 py-8 w-full max-w-5xl mx-auto">
      {/* Back + header */}
      <Link
        href="/knowledge-packs"
        className="inline-flex items-center gap-1 text-sm mb-4 transition-colors hover:opacity-80"
        style={{ color: "var(--text-3)" }}
      >
        <ArrowLeft size={14} /> Knowledge Packs
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-2)" }}
        >
          <Brain size={20} style={{ color: "var(--accent-amber)" }} />
        </div>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}
          >
            {pack.name}
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <StatusBadge status={pack.status} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {pack.files.length} file{pack.files.length !== 1 ? "s" : ""} &middot;{" "}
              {pack.total_chunks ?? 0} chunks
            </span>
            {pack.rag_strategy && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
              >
                {pack.rag_strategy.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Processing banner */}
      {isProcessing && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg mb-6 mt-4"
          style={{ backgroundColor: "rgba(242, 169, 59, 0.08)", border: "1px solid rgba(242, 169, 59, 0.2)" }}
        >
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
          <span className="text-sm" style={{ color: "var(--accent-amber)" }}>
            Processing files... This page will update automatically.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-6" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors relative"
              style={{ color: active ? "var(--accent-amber)" : "var(--text-3)" }}
            >
              <Icon size={14} />
              {tab.label}
              {active && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-amber)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab pack={pack} />}
      {activeTab === "files" && (
        <FilesTab
          pack={pack}
          onDeleteFile={handleDeleteFile}
          deletingFileId={deletingFileId}
          onUploadMore={handleUploadMore}
          uploading={uploading}
          fileInputRef={fileInputRef}
        />
      )}
      {activeTab === "chat" && (
        <KnowledgePackChat
          packId={pack.id}
          packName={pack.name}
          status={pack.status}
          totalChunks={pack.total_chunks ?? 0}
          getIdToken={getIdToken}
        />
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    created: { label: "Draft", color: "var(--text-3)" },
    processing: { label: "Processing", color: "var(--accent-amber)" },
    complete: { label: "Ready", color: "var(--accent-emerald)" },
    failed: { label: "Failed", color: "var(--accent-coral)" },
  };
  const c = cfg[status] ?? cfg.created;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-md font-medium"
      style={{ backgroundColor: `${c.color}15`, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function OverviewTab({ pack }: { pack: KnowledgePack }) {
  const fields = [
    { label: "Product Summary", value: pack.product_summary },
    { label: "Primary User", value: pack.primary_user },
    { label: "Product Stage", value: pack.product_stage },
    { label: "Core Workflow", value: pack.core_workflow },
    { label: "Business Model", value: pack.business_model },
    { label: "Constraints", value: pack.constraints },
    { label: "Notes", value: pack.pasted_notes },
  ].filter((f) => f.value);

  return (
    <div className="flex flex-col gap-5">
      {/* Topics */}
      {pack.topics && pack.topics.length > 0 && (
        <div>
          <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>
            Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {pack.topics.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "var(--bg-2)", color: "var(--text-2)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata fields */}
      {fields.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label}>
                <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>
                  {f.label}
                </h4>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>
              Knowledge Map
            </h3>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Quick view of how themes and source files connect inside this pack.
            </p>
          </div>

        </div>

        <MindMapView data={pack.mind_map} packName={pack.name} compact />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Files", value: pack.files.length },
          { label: "Chunks", value: pack.total_chunks ?? 0 },
          { label: "Strategy", value: pack.rag_strategy?.replace(/_/g, " ") ?? "—" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>
              {s.value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesTab({
  pack,
  onDeleteFile,
  deletingFileId,
  onUploadMore,
  uploading,
  fileInputRef,
}: {
  pack: KnowledgePack;
  onDeleteFile: (id: string) => void;
  deletingFileId: string | null;
  onUploadMore: (files: FileList) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isImage = (ct: string) => ct.startsWith("image/");

  return (
    <div>
      {/* Upload more button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "var(--bg-2)",
            color: "var(--text-2)",
            border: "1px solid var(--border-default)",
          }}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Upload more files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => e.target.files && onUploadMore(e.target.files)}
        />
      </div>

      {/* File list */}
      {pack.files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-xl"
          style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
        >
          <FileText size={32} style={{ color: "var(--text-3)" }} />
          <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>
            No files uploaded yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pack.files.map((f) => {
            const statusCfg = FILE_STATUS[f.status] ?? FILE_STATUS.queued;
            const StatusIcon = statusCfg.icon;
            const isSpinning = ["extracting", "chunking", "embedding"].includes(f.status);

            return (
              <div
                key={f.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isImage(f.content_type) ? (
                    <ImageIcon size={16} style={{ color: "var(--accent-cyan)" }} />
                  ) : (
                    <FileText size={16} style={{ color: "var(--accent-amber)" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-1)" }}>
                      {f.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusIcon
                        size={11}
                        style={{ color: statusCfg.color }}
                        className={isSpinning ? "animate-spin" : ""}
                      />
                      <span className="text-[11px]" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                      {f.status === "complete" && f.chunk_count > 0 && (
                        <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                          &middot; {f.chunk_count} chunks
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteFile(f.id)}
                  disabled={deletingFileId === f.id}
                  className="p-1.5 rounded-md transition-colors hover:bg-white/5 flex-shrink-0"
                  style={{ color: "var(--text-3)" }}
                >
                  {deletingFileId === f.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
