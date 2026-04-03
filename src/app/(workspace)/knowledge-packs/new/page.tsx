"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Brain } from "lucide-react";
import Link from "next/link";
import FileUploadZone from "@/components/knowledge-pack/FileUploadZone";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ADVANCED_FIELDS = [
  { key: "product_summary", label: "What does the product do?", placeholder: "2-3 sentences describing the product and the problem it solves.", textarea: true, rows: 3 },
  { key: "primary_user", label: "Primary user", placeholder: "e.g. Operations managers at mid-market logistics companies", textarea: false },
  { key: "product_stage", label: "Product stage", placeholder: "e.g. Post-launch, ~300 paying customers, Series A", textarea: false },
  { key: "core_workflow", label: "Core workflow", placeholder: "The main job the product does for users day-to-day.", textarea: true, rows: 3 },
  { key: "business_model", label: "Business model", placeholder: "e.g. SaaS, $299/mo per team, annual contracts", textarea: false },
  { key: "constraints", label: "Known constraints", placeholder: "e.g. Cannot break existing CSV export, enterprise SSO required", textarea: false },
  { key: "pasted_notes", label: "Paste notes or docs", placeholder: "Paste any additional context, PRDs, or notes here.", textarea: true, rows: 4 },
];

interface FormState {
  name: string;
  [key: string]: string;
}

export default function NewKnowledgePackPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: "",
    product_summary: "",
    primary_user: "",
    product_stage: "",
    core_workflow: "",
    business_model: "",
    constraints: "",
    pasted_notes: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a name for your knowledge pack.");
      return;
    }
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      // 1. Create pack
      const body: Record<string, string> = { name: form.name };
      for (const f of ADVANCED_FIELDS) {
        if (form[f.key]?.trim()) body[f.key] = form[f.key];
      }

      const createRes = await fetch(`${API_URL}/api/knowledge-packs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) throw new Error("Create failed");
      const { pack } = await createRes.json();

      // 2. Upload files (if any)
      if (files.length > 0) {
        const fd = new FormData();
        for (const f of files) fd.append("files", f);

        await fetch(`${API_URL}/api/knowledge-packs/${pack.id}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      toast.success("Knowledge pack created!");
      router.push(`/knowledge-packs/${pack.id}`);
    } catch {
      toast.error("Failed to create knowledge pack.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 sm:px-10 py-8 w-full max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/knowledge-packs"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: "var(--text-3)" }}
      >
        <ArrowLeft size={14} /> Knowledge Packs
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
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
            Create Knowledge Pack
          </h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Add a name, upload files, and let AI process your documents.
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Name field (required) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
            Pack name <span style={{ color: "var(--accent-coral)" }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Acme Q2 Product Research"
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg-2)",
              color: "var(--text-1)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
            Upload documents
          </label>
          <FileUploadZone files={files} onFilesChange={setFiles} />
        </div>

        {/* Advanced features toggle */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80"
          style={{ color: "var(--text-3)" }}
        >
          {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced Features
        </button>

        {advancedOpen && (
          <div className="flex flex-col gap-4 mb-6">
            {ADVANCED_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>
                  {field.label}
                </label>
                {field.textarea ? (
                  <textarea
                    value={form[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows ?? 3}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{
                      backgroundColor: "var(--bg-2)",
                      color: "var(--text-1)",
                      border: "1px solid var(--border-default)",
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-2)",
                      color: "var(--text-1)",
                      border: "1px solid var(--border-default)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/knowledge-packs"
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: "var(--text-3)" }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              backgroundColor: "var(--accent-amber)",
              color: "var(--bg-0)",
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Creating..." : "Create Knowledge Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}
