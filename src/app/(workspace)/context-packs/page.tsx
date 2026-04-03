"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  ArrowLeft,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ContextPackFile {
  id: string;
  filename: string;
  content_type: string;
  status: "extracted" | "failed";
  uploaded_at: string;
}

interface ContextPack {
  id: string;
  name: string;
  product_summary: string;
  primary_user: string;
  product_stage: string;
  core_workflow: string;
  business_model?: string;
  constraints?: string;
  pasted_notes?: string;
  files?: ContextPackFile[];
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = {
  name: "",
  product_summary: "",
  primary_user: "",
  product_stage: "",
  core_workflow: "",
  business_model: "",
  constraints: "",
  pasted_notes: "",
};

const FIELDS = [
  { key: "name", label: "Pack name *", placeholder: "e.g. Acme — B2B Analytics Dashboard", textarea: false },
  { key: "product_summary", label: "What does the product do? *", placeholder: "2–3 sentences describing the product and the problem it solves.", textarea: true, rows: 3 },
  { key: "primary_user", label: "Primary user *", placeholder: "e.g. Operations managers at mid-market logistics companies", textarea: false },
  { key: "product_stage", label: "Product stage *", placeholder: "e.g. Post-launch, ~300 paying customers, Series A", textarea: false },
  { key: "core_workflow", label: "Core workflow *", placeholder: "The main job the product does for users day-to-day.", textarea: true, rows: 3 },
  { key: "business_model", label: "Business model (optional)", placeholder: "e.g. SaaS, $299/mo per team, annual contracts", textarea: false },
  { key: "constraints", label: "Known constraints (optional)", placeholder: "e.g. Cannot break existing CSV export, enterprise SSO required", textarea: false },
];

export default function ContextPacksPage() {
  const { getIdToken, user } = useAuth();
  const [packs, setPacks] = useState<ContextPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPack, setEditingPack] = useState<ContextPack | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fileToAttach, setFileToAttach] = useState<File | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  const fetchPacks = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/context-packs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPacks(data.packs ?? []);
    } catch {
      toast.error("Failed to load context packs.");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user !== null) fetchPacks();
    else setLoading(false);
  }, [user, fetchPacks]);

  const openCreate = () => {
    setEditingPack(null);
    setForm({ ...EMPTY_FORM });
    setFileToAttach(null);
    setShowForm(true);
  };

  const openEdit = (pack: ContextPack) => {
    setEditingPack(pack);
    setForm({
      name: pack.name,
      product_summary: pack.product_summary,
      primary_user: pack.primary_user,
      product_stage: pack.product_stage,
      core_workflow: pack.core_workflow,
      business_model: pack.business_model ?? "",
      constraints: pack.constraints ?? "",
      pasted_notes: pack.pasted_notes ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_summary || !form.primary_user || !form.product_stage || !form.core_workflow) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const token = await getIdToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let savedPack: ContextPack;
      if (editingPack) {
        const res = await fetch(`${API_URL}/api/context-packs/${editingPack.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Update failed");
        const data = await res.json();
        savedPack = data.pack;
        setPacks((prev) => prev.map((p) => p.id === savedPack.id ? { ...p, ...savedPack } : p));
        toast.success("Context pack updated.");
      } else {
        const res = await fetch(`${API_URL}/api/context-packs`, {
          method: "POST",
          headers,
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Create failed");
        const data = await res.json();
        savedPack = data.pack;
        // Upload attached file if any
        if (fileToAttach && token) {
          const fd = new FormData();
          fd.append("file", fileToAttach);
          await fetch(`${API_URL}/api/context-packs/${savedPack.id}/files`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        }
        setPacks((prev) => [savedPack, ...prev]);
        toast.success("Context pack created.");
      }

      setShowForm(false);
      setEditingPack(null);
      setFileToAttach(null);
    } catch {
      toast.error("Could not save context pack. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this context pack? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_URL}/api/context-packs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error();
      setPacks((prev) => prev.filter((p) => p.id !== id));
      toast.success("Context pack deleted.");
    } catch {
      toast.error("Failed to delete context pack.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadFile = async (packId: string, file: File) => {
    setUploadingFor(packId);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/context-packs/${packId}/files`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPacks((prev) =>
        prev.map((p) =>
          p.id === packId
            ? { ...p, files: [...(p.files ?? []), data.file] }
            : p
        )
      );
      toast.success(`"${file.name}" uploaded successfully.`);
    } catch {
      toast.error("File upload failed. Please try again.");
    } finally {
      setUploadingFor(null);
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-0)" }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Sign in to access your context packs.</p>
          <Link href="/login" className="text-sm underline" style={{ color: "var(--accent-amber)" }}>Sign in</Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    border: "1px solid var(--border-default)",
    backgroundColor: "var(--bg-2)",
    color: "var(--text-1)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold mb-1" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>
              Context Packs
            </h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Save product context so every Feature Review starts with full product grounding. Attach PDFs, PRDs, and notes.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0"
            style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
          >
            <Plus size={15} />
            Create pack
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-3)" }} />
          </div>
        ) : packs.length === 0 && !showForm ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ border: "1px dashed var(--border-default)", backgroundColor: "var(--bg-1)" }}
          >
            <Layers size={32} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No context packs yet</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
              Create your first pack to give Feature Reviews rich product context.
            </p>
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm rounded-lg font-medium"
              style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
            >
              Create a pack
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {packs.map((pack) => {
              const expanded = expandedId === pack.id;
              const fileCount = pack.files?.length ?? 0;
              return (
                <div
                  key={pack.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
                >
                  {/* Card header */}
                  <div className="p-5 flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--bg-2)" }}
                    >
                      <Layers size={16} style={{ color: "var(--text-3)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm mb-0.5 truncate">{pack.name}</p>
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-3)" }}>
                            {pack.product_summary}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {[pack.primary_user, pack.product_stage].filter(Boolean).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(pack)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(pack.id)}
                            disabled={deletingId === pack.id}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                            title="Delete"
                          >
                            {deletingId === pack.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center gap-3 mt-3">
                        {/* Upload file */}
                        <input
                          ref={uploadFileInputRef}
                          type="file"
                          accept=".pdf,.txt,.md"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadFile(pack.id, f);
                          }}
                        />
                        <button
                          onClick={() => uploadFileInputRef.current?.click()}
                          disabled={uploadingFor === pack.id}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                          style={{
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-3)",
                            backgroundColor: "var(--bg-2)",
                          }}
                        >
                          {uploadingFor === pack.id ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                          Upload file
                        </button>

                        {/* File count / expand */}
                        {fileCount > 0 && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : pack.id)}
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            <FileText size={11} />
                            {fileCount} file{fileCount !== 1 ? "s" : ""}
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}

                        <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>
                          Updated {new Date(pack.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded files */}
                  {expanded && fileCount > 0 && (
                    <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <p className="text-xs font-semibold tracking-widest uppercase pt-3 pb-2" style={{ color: "var(--text-3)" }}>
                        Uploaded files
                      </p>
                      <div className="space-y-1.5">
                        {pack.files!.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                            style={{ backgroundColor: "var(--bg-2)" }}
                          >
                            <FileText size={13} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                            <span className="text-xs truncate flex-1" style={{ color: "var(--text-2)" }}>{f.filename}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: f.status === "extracted" ? "var(--accent-emerald-dim)" : "rgba(223,107,87,0.12)",
                                color: f.status === "extracted" ? "var(--accent-emerald)" : "rgba(223,107,87,0.9)",
                              }}
                            >
                              {f.status === "extracted" ? "ready" : "failed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create / Edit form ── */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-xl rounded-2xl overflow-y-auto"
              style={{
                backgroundColor: "var(--bg-1)",
                border: "1px solid var(--border-subtle)",
                maxHeight: "90vh",
              }}
            >
              <div className="p-6 space-y-4">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold" style={{ color: "var(--text-1)" }}>
                    {editingPack ? "Edit context pack" : "New context pack"}
                  </p>
                  <button
                    onClick={() => { setShowForm(false); setEditingPack(null); setFileToAttach(null); }}
                    className="p-1 rounded-lg"
                    style={{ color: "var(--text-3)" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>{f.label}</label>
                    {f.textarea ? (
                      <textarea
                        rows={f.rows ?? 3}
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="resize-none outline-none"
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="outline-none"
                        style={inputStyle}
                      />
                    )}
                  </div>
                ))}

                {/* Paste notes */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>Paste notes or docs (optional)</label>
                  <textarea
                    rows={4}
                    value={form.pasted_notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, pasted_notes: e.target.value }))}
                    placeholder="Paste any relevant product notes, PRDs, design docs, or background context."
                    className="resize-none outline-none"
                    style={inputStyle}
                  />
                </div>

                {/* File upload — only on create */}
                {!editingPack && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>Upload a document (optional)</label>
                    <input
                      ref={newFileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="hidden"
                      onChange={(e) => setFileToAttach(e.target.files?.[0] ?? null)}
                    />
                    {fileToAttach ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: "1px solid var(--accent-amber)", backgroundColor: "rgba(242,169,59,0.06)" }}>
                        <FileText size={13} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
                        <span className="text-xs truncate flex-1" style={{ color: "var(--text-2)" }}>{fileToAttach.name}</span>
                        <button
                          onClick={() => { setFileToAttach(null); if (newFileInputRef.current) newFileInputRef.current.value = ""; }}
                          className="text-xs"
                          style={{ color: "var(--text-3)" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => newFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full transition-colors"
                        style={{ border: "1px dashed var(--border-default)", color: "var(--text-3)" }}
                      >
                        <Upload size={12} />
                        Upload PDF, .txt, or .md — extracted text will be injected into analysis
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setShowForm(false); setEditingPack(null); setFileToAttach(null); }}
                    className="text-xs px-4 py-2 rounded-lg"
                    style={{ color: "var(--text-3)", border: "1px solid var(--border-default)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
                    style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {saving ? "Saving…" : editingPack ? "Save changes" : "Create pack"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
