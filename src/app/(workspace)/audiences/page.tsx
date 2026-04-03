"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import AudienceBuilderModal, { AudienceDocument } from "@/components/AudienceBuilderModal";
import PersonaPanelModal, { Persona } from "@/components/PersonaPanelModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RunHistoryEntry {
  review_id: string;
  date: string;
  use_case: string;
  title: string;
}

interface AudienceWithHistory extends AudienceDocument {
  run_history: RunHistoryEntry[];
}

export default function AudiencesPage() {
  const { getIdToken, user } = useAuth();
  const [audiences, setAudiences] = useState<AudienceWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAudience, setEditingAudience] = useState<AudienceDocument | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [personaPanelAudience, setPersonaPanelAudience] = useState<AudienceWithHistory | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAudiences = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const url = new URL(`${API_URL}/api/audience-library`);
      url.searchParams.set("_ts", String(Date.now()));
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { audiences: AudienceWithHistory[] };
      setAudiences(data.audiences);
    } catch {
      toast.error("Failed to load audiences.");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  const fetchAudienceById = useCallback(async (id: string) => {
    const token = await getIdToken();
    if (!token) return;

    const url = new URL(`${API_URL}/api/audience-library/${id}`);
    url.searchParams.set("_ts", String(Date.now()));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error();

    const data = await res.json() as { audience: AudienceWithHistory };
    setAudiences((prev) =>
      prev.map((aud) => (aud.id === id ? { ...aud, ...data.audience } : aud))
    );
  }, [getIdToken]);

  useEffect(() => {
    if (user !== null) fetchAudiences();
    else setLoading(false);
  }, [user, fetchAudiences]);

  useEffect(() => {
    const runningIds = audiences
      .filter((aud) => aud.persona_generation_status === "running")
      .map((aud) => aud.id);
    if (runningIds.length === 0) return;

    const intervalId = window.setInterval(() => {
      runningIds.forEach((id) => {
        void fetchAudienceById(id).catch(() => undefined);
      });
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [audiences, fetchAudienceById]);

  const handleSaved = (saved: AudienceDocument) => {
    setAudiences((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      const full = { ...saved, run_history: prev[idx]?.run_history ?? [] } as AudienceWithHistory;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = full;
        return next;
      }
      return [full, ...prev];
    });
    setShowModal(false);
    setEditingAudience(undefined);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this audience? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_URL}/api/audience-library/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error();
      setAudiences((prev) => prev.filter((a) => a.id !== id));
      toast.success("Audience deleted.");
    } catch {
      toast.error("Failed to delete audience.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGeneratePersonas = async (id: string) => {
    setGeneratingFor(id);
    setAudiences((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              persona_generation_status: "running",
              persona_generation_completed: 0,
              persona_generation_total: 5,
              persona_generation_error: null,
            }
          : a
      )
    );
    try {
      const token = await getIdToken();
      if (!token) throw new Error();
      const res = await fetch(`${API_URL}/api/audience-library/${id}/generate-personas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count: 5 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { status: string; audience?: AudienceWithHistory };
      if (data.audience) {
        setAudiences((prev) =>
          prev.map((aud) => (aud.id === id ? { ...aud, ...data.audience } : aud))
        );
      }
      toast.success("Persona generation started.");
    } catch {
      await fetchAudienceById(id);
      toast.error("Persona generation failed.");
    } finally {
      setGeneratingFor(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-0)" }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Sign in to access your audience library.</p>
          <Link href="/login" className="text-sm underline" style={{ color: "var(--accent-amber)" }}>Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold mb-1" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>
              Audience Library
            </h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Build and save custom audience profiles. Reuse them across simulations.
            </p>
          </div>
          <button
            onClick={() => { setEditingAudience(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
          >
            <Plus size={15} />
            Create audience
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-3)" }} />
          </div>
        ) : audiences.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ border: "1px dashed var(--border-default)", backgroundColor: "var(--bg-1)" }}
          >
            <Users size={32} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No saved audiences yet</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
              Build your first audience to reuse it across simulations.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm rounded-lg font-medium"
              style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
            >
              Build audience
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {audiences.map((aud) => {
              const expanded = expandedId === aud.id;
              const metaTags = [aud.geography, aud.age_band, aud.role].filter(Boolean);
              const isGenerating = generatingFor === aud.id || aud.persona_generation_status === "running";
              const generatedCount = aud.generated_personas?.length ?? 0;
              const progressCompleted = aud.persona_generation_completed ?? 0;
              const progressTotal = aud.persona_generation_total ?? 0;
              const progressPct = progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;
              return (
                <div
                  key={aud.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
                >
                  {/* Card header */}
                  <div className="p-5 flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--bg-2)" }}
                    >
                      <Users size={16} style={{ color: "var(--text-3)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm mb-1">{aud.name}</p>
                          {aud.description && (
                            <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>{aud.description}</p>
                          )}
                          {metaTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {metaTags.map((t) => (
                                <span
                                  key={t}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                                >
                                  {t}
                                </span>
                              ))}
                              {aud.channels.slice(0, 3).map((ch) => (
                                <span
                                  key={ch}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setEditingAudience(aud); setShowModal(true); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(aud.id)}
                            disabled={deletingId === aud.id}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: "var(--text-3)", border: "1px solid var(--border-subtle)" }}
                            title="Delete"
                          >
                            {deletingId === aud.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Persona count + expand */}
                      <div className="flex items-center gap-3 mt-3">
                        {generatedCount > 0 && !isGenerating ? (
                          <button
                            onClick={() => setPersonaPanelAudience(aud)}
                            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                            style={{ color: "var(--text-3)" }}
                          >
                            <Users size={11} />
                            {generatedCount} persona{generatedCount !== 1 ? "s" : ""} in panel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGeneratePersonas(aud.id)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-3)",
                              backgroundColor: "var(--bg-2)",
                            }}
                          >
                            {isGenerating ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Zap size={11} />
                            )}
                            {isGenerating ? `Generating ${progressCompleted}/${Math.max(progressTotal, 5)}` : "Generate personas"}
                          </button>
                        )}
                        {(aud.run_history.length > 0) && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : aud.id)}
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            {aud.run_history.length} run{aud.run_history.length !== 1 ? "s" : ""}
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>
                      {isGenerating && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-3)" }}>
                            <span>Generating detailed personas with real-life attributes</span>
                            <span>{progressCompleted}/{Math.max(progressTotal, 5)}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-2)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%`, backgroundColor: "var(--accent-amber)" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Run history — expanded */}
                  {expanded && aud.run_history.length > 0 && (
                    <div
                      className="px-5 pb-4"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <p className="section-label pt-3 pb-2">Run history</p>
                      <div className="space-y-1.5">
                        {aud.run_history.map((run) => (
                          <Link
                            key={run.review_id}
                            href={`/simulations/${run.review_id}`}
                            className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "var(--bg-2)" }}
                          >
                            <span className="text-xs font-medium truncate" style={{ color: "var(--text-2)" }}>
                              {run.title || run.use_case}
                            </span>
                            <span className="text-xs flex-shrink-0 ml-3" style={{ color: "var(--text-3)" }}>
                              {new Date(run.date).toLocaleDateString()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audience builder modal */}
      <AudienceBuilderModal
        isOpen={showModal}
        initialData={editingAudience}
        onClose={() => { setShowModal(false); setEditingAudience(undefined); }}
        onSaved={handleSaved}
      />

      {/* Persona panel modal */}
      {personaPanelAudience && (
        <PersonaPanelModal
          isOpen={true}
          audienceId={personaPanelAudience.id}
          audienceName={personaPanelAudience.name}
          personas={(personaPanelAudience.generated_personas ?? []) as Persona[]}
          onClose={() => setPersonaPanelAudience(null)}
          onSaved={(updated) => {
            setAudiences((prev) =>
              prev.map((a) =>
                a.id === personaPanelAudience.id ? { ...a, generated_personas: updated } : a
              )
            );
            setPersonaPanelAudience(null);
          }}
        />
      )}
    </>
  );
}
