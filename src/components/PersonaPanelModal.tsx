"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, Loader2, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Persona {
  name: string;
  age?: number | null;
  gender?: string;
  location?: string;
  role: string;
  education?: string;
  income_range?: string;
  spending_habits?: string;
  family_status?: string;
  bio?: string;
  personality_prompt?: string;
  decision_drivers?: string[];
  goals?: string[];
  frustrations?: string[];
  cultural_context?: string;
  media_diet?: string[];
  psychographics?: {
    slang_used?: string[];
    communication_style?: string;
    trust_signals?: string[];
    risk_tolerance?: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audienceId: string;
  audienceName: string;
  personas: Persona[];
  onSaved: (updated: Persona[]) => void;
}

// ── Small tag-input used for array fields ──────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== tag))}
              className="opacity-50 hover:opacity-100 ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="w-full rounded-md px-3 py-1.5 text-xs focus:outline-none"
        style={{
          backgroundColor: "var(--bg-2)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-1)",
        }}
        placeholder="Add and press Enter…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(input); }
        }}
        onBlur={() => { if (input) add(input); }}
      />
    </div>
  );
}

// ── Field wrappers ─────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20";
const inputStyle = {
  backgroundColor: "var(--bg-2)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-1)",
};
const textareaCls = `${inputCls} resize-none`;

// ── Main component ─────────────────────────────────────────────────
export default function PersonaPanelModal({ isOpen, onClose, audienceId, audienceName, personas, onSaved }: Props) {
  const { user } = useAuth();
  const [list, setList] = useState<Persona[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Persona | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setList(personas.map((p) => ({
        ...p,
        decision_drivers: p.decision_drivers ?? [],
        goals: p.goals ?? [],
        frustrations: p.frustrations ?? [],
        media_diet: p.media_diet ?? [],
        psychographics: {
          slang_used: p.psychographics?.slang_used ?? [],
          communication_style: p.psychographics?.communication_style ?? "",
          trust_signals: p.psychographics?.trust_signals ?? [],
          risk_tolerance: p.psychographics?.risk_tolerance ?? "",
        },
      })));
      setSelectedIdx(null);
      setDraft(null);
      setDirty(false);
    }
  }, [isOpen, personas]);

  const selectPersona = (idx: number) => {
    if (dirty) {
      if (!confirm("You have unsaved changes. Discard them?")) return;
    }
    setSelectedIdx(idx);
    setDraft(JSON.parse(JSON.stringify(list[idx])));
    setDirty(false);
  };

  const update = (field: keyof Persona, value: unknown) => {
    setDraft((d) => d ? { ...d, [field]: value } : d);
    setDirty(true);
  };

  const updatePsycho = (field: string, value: unknown) => {
    setDraft((d) => d ? { ...d, psychographics: { ...(d.psychographics ?? {}), [field]: value } } : d);
    setDirty(true);
  };

  const savePersona = () => {
    if (!draft || selectedIdx === null) return;
    const updated = [...list];
    updated[selectedIdx] = draft;
    setList(updated);
    setDirty(false);
    toast.success("Changes saved locally — click Save all to persist.");
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/audience-library/${audienceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ generated_personas: list }),
      });
      if (!res.ok) throw new Error();
      onSaved(list);
      toast.success("Panel saved.");
      onClose();
    } catch {
      toast.error("Failed to save panel.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-0)",
          border: "1px solid var(--border-subtle)",
          maxHeight: "88vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            {selectedIdx !== null && (
              <button
                onClick={() => {
                  if (dirty && !confirm("Discard unsaved changes?")) return;
                  setSelectedIdx(null); setDraft(null); setDirty(false);
                }}
                className="p-1 rounded hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-3)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {selectedIdx !== null ? `Editing — ${list[selectedIdx]?.name}` : `Panel · ${audienceName}`}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {selectedIdx !== null
                  ? "Edit the persona details below"
                  : `${list.length} persona${list.length !== 1 ? "s" : ""} — click any to view or edit`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIdx !== null && dirty && (
              <button
                onClick={savePersona}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}
              >
                <Save className="w-3.5 h-3.5" /> Apply changes
              </button>
            )}
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save all
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:opacity-70 transition-opacity" style={{ color: "var(--text-3)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — persona list */}
          <div
            className="w-56 flex-shrink-0 overflow-y-auto"
            style={{ borderRight: "1px solid var(--border-subtle)" }}
          >
            {list.map((p, i) => (
              <button
                key={i}
                onClick={() => selectPersona(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
                style={{
                  backgroundColor: selectedIdx === i ? "var(--bg-2)" : "transparent",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                  style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)", color: "var(--text-2)" }}
                >
                  {p.name?.[0] ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>{p.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{p.role}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right — detail / edit */}
          <div className="flex-1 overflow-y-auto">
            {selectedIdx === null || !draft ? (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "var(--text-3)" }}>
                <User className="w-10 h-10 opacity-20" />
                <p className="text-sm">Select a persona to view or edit</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">

                {/* Identity */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Identity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full name">
                      <input className={inputCls} style={inputStyle} value={draft.name ?? ""} onChange={(e) => update("name", e.target.value)} />
                    </Field>
                    <Field label="Role / Life role">
                      <input className={inputCls} style={inputStyle} value={draft.role ?? ""} onChange={(e) => update("role", e.target.value)} />
                    </Field>
                    <Field label="Age">
                      <input type="number" className={inputCls} style={inputStyle} value={draft.age ?? ""} onChange={(e) => update("age", e.target.value ? Number(e.target.value) : null)} />
                    </Field>
                    <Field label="Gender">
                      <input className={inputCls} style={inputStyle} value={draft.gender ?? ""} onChange={(e) => update("gender", e.target.value)} placeholder="Male / Female / Non-binary" />
                    </Field>
                    <Field label="Location">
                      <input className={inputCls} style={inputStyle} value={draft.location ?? ""} onChange={(e) => update("location", e.target.value)} placeholder="City, Country" />
                    </Field>
                    <Field label="Education">
                      <input className={inputCls} style={inputStyle} value={draft.education ?? ""} onChange={(e) => update("education", e.target.value)} placeholder="e.g. B.Tech CS, Self-taught" />
                    </Field>
                  </div>
                </section>

                {/* Socioeconomic */}
                <section className="space-y-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Socioeconomic</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Income range">
                      <input className={inputCls} style={inputStyle} value={draft.income_range ?? ""} onChange={(e) => update("income_range", e.target.value)} placeholder="e.g. $60k–$80k / ₹6L–₹8L" />
                    </Field>
                    <Field label="Family status">
                      <input className={inputCls} style={inputStyle} value={draft.family_status ?? ""} onChange={(e) => update("family_status", e.target.value)} placeholder="e.g. Married, 2 kids / Single" />
                    </Field>
                    <Field label="Spending habits">
                      <textarea rows={2} className={textareaCls} style={inputStyle} value={draft.spending_habits ?? ""} onChange={(e) => update("spending_habits", e.target.value)} />
                    </Field>
                    <Field label="Cultural context">
                      <textarea rows={2} className={textareaCls} style={inputStyle} value={draft.cultural_context ?? ""} onChange={(e) => update("cultural_context", e.target.value)} />
                    </Field>
                  </div>
                </section>

                {/* Narrative */}
                <section className="space-y-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Narrative</h3>
                  <Field label="Bio / Backstory">
                    <textarea rows={4} className={textareaCls} style={inputStyle} value={draft.bio ?? ""} onChange={(e) => update("bio", e.target.value)} />
                  </Field>
                  <Field label="Personality & decision style">
                    <textarea rows={3} className={textareaCls} style={inputStyle} value={draft.personality_prompt ?? ""} onChange={(e) => update("personality_prompt", e.target.value)} />
                  </Field>
                </section>

                {/* Drivers */}
                <section className="space-y-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Decision drivers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Decision drivers">
                      <TagInput tags={draft.decision_drivers ?? []} onChange={(v) => update("decision_drivers", v)} />
                    </Field>
                    <Field label="Goals">
                      <TagInput tags={draft.goals ?? []} onChange={(v) => update("goals", v)} />
                    </Field>
                    <Field label="Frustrations">
                      <TagInput tags={draft.frustrations ?? []} onChange={(v) => update("frustrations", v)} />
                    </Field>
                    <Field label="Media diet">
                      <TagInput tags={draft.media_diet ?? []} onChange={(v) => update("media_diet", v)} />
                    </Field>
                  </div>
                </section>

                {/* Psychographics */}
                <section className="space-y-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Psychographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Communication style">
                      <input className={inputCls} style={inputStyle} value={draft.psychographics?.communication_style ?? ""} onChange={(e) => updatePsycho("communication_style", e.target.value)} placeholder="e.g. blunt and skeptical" />
                    </Field>
                    <Field label="Risk tolerance">
                      <input className={inputCls} style={inputStyle} value={draft.psychographics?.risk_tolerance ?? ""} onChange={(e) => updatePsycho("risk_tolerance", e.target.value)} placeholder="e.g. early adopter / risk-averse" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Slang used">
                      <TagInput tags={draft.psychographics?.slang_used ?? []} onChange={(v) => updatePsycho("slang_used", v)} />
                    </Field>
                    <Field label="Trust signals">
                      <TagInput tags={draft.psychographics?.trust_signals ?? []} onChange={(v) => updatePsycho("trust_signals", v)} />
                    </Field>
                  </div>
                </section>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
