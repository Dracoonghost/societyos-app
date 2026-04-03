"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, MoveRight, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AudienceDocument {
  id: string;
  name: string;
  description: string;
  geography: string;
  age_band: string;
  role: string;
  company_size: string;
  spending_power: string;
  product_familiarity: string;
  channels: string[];
  values_behaviors: string[];
  pain_points: string[];
  notes: string;
  assumptions: string;
  generated_personas: unknown[];
  generated_personas_count?: number;
  persona_generation_status?: "idle" | "running" | "complete" | "failed";
  persona_generation_completed?: number;
  persona_generation_total?: number;
  persona_generation_error?: string | null;
  run_history: unknown[];
  createdAt: string | null;
  updatedAt: string | null;
}

const AGE_GROUP_OPTIONS = [
  "Under 18",
  "18 – 24",
  "25 – 34",
  "35 – 44",
  "45 – 54",
  "55 – 64",
  "65+",
];

const CHANNEL_OPTIONS = [
  "Instagram", "LinkedIn", "TikTok", "Twitter / X", "YouTube",
  "Email", "Facebook", "Reddit", "Podcast", "Search / SEO",
];

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const addTag = (val: string) => {
    const t = val.trim();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput("");
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-xs border border-white/10">
            <span>{tag}</span>
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== tag))} className="text-white/40 hover:text-white/80">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <input
        type="text"
        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
        placeholder={placeholder ?? "Type and press Enter..."}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(input);
          }
        }}
        onBlur={() => {
          if (input) addTag(input);
        }}
      />
    </div>
  );
}

export default function AudienceBuilderModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (doc: AudienceDocument) => void;
  initialData?: AudienceDocument | null;
}) {
  const { user } = useAuth();

  const getErrorMessage = (err: unknown, fallback: string) => {
    return err instanceof Error ? err.message : fallback;
  };
  
  // Steps: 1: brief | 2: profile | 3: generate
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [brief, setBrief] = useState("");
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [createdId, setCreatedId] = useState<string | null>(initialData?.id || null);
  const [panelSize, setPanelSize] = useState(5);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    geography: "",
    age_band: "",
    role: "",
    company_size: "",
    spending_power: "",
    product_familiarity: "",
    channels: [] as string[],
    values_behaviors: [] as string[],
    pain_points: [] as string[],
    notes: "",
    assumptions: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStep(2);
        setCreatedId(initialData.id);
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
          geography: initialData.geography || "",
          age_band: initialData.age_band || "",
          role: initialData.role || "",
          company_size: initialData.company_size || "",
          spending_power: initialData.spending_power || "",
          product_familiarity: initialData.product_familiarity || "",
          channels: initialData.channels || [],
          values_behaviors: initialData.values_behaviors || [],
          pain_points: initialData.pain_points || [],
          notes: initialData.notes || "",
          assumptions: initialData.assumptions || "",
        });
      } else {
        setStep(1);
        setBrief("");
        setCreatedId(null);
        setFormData({
          name: "", description: "", geography: "", age_band: "", role: "",
          company_size: "", spending_power: "", product_familiarity: "",
          channels: [], values_behaviors: [], pain_points: [], notes: "", assumptions: "",
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  async function handleParseBrief() {
    if (!brief.trim()) return toast.error("Please enter a brief description.");
    if (!user) return toast.error("Must be logged in.");

    setParsing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/audience-library/parse-brief`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ brief })
      });
      if (!res.ok) throw new Error("Failed to parse brief");
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.summary || prev.description,
        geography: data.geography || prev.geography,
        age_band: data.age_band || prev.age_band,
        role: data.role || prev.role,
        company_size: data.company_size || prev.company_size,
        spending_power: data.spending_power || prev.spending_power,
        product_familiarity: data.product_familiarity || prev.product_familiarity,
        channels: data.channels?.length ? data.channels : prev.channels,
        values_behaviors: data.values_behaviors?.length ? data.values_behaviors : prev.values_behaviors,
        pain_points: data.pain_points?.length ? data.pain_points : prev.pain_points,
      }));
      setStep(2);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to parse"));
    } finally {
      setParsing(false);
    }
  }

  async function handleSaveProfile() {
    if (!formData.name.trim()) return toast.error("Please provide a name for this audience.");
    if (!user) return toast.error("Not logged in");
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const url = createdId 
        ? `${API_URL}/api/audience-library/${createdId}`
        : `${API_URL}/api/audience-library`;
      
      const method = createdId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to save audience");
      const payload = await res.json() as { audience?: AudienceDocument } & Partial<AudienceDocument>;
      const doc = payload.audience ?? payload;
      setCreatedId(doc.id ?? null);
      
      toast.success("Audience profile saved!");
      if (onSaved) onSaved(doc as AudienceDocument);
      
      setStep(3);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error saving audience"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePanel() {
    if (!user || !createdId) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/audience-library/${createdId}/generate-personas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count: panelSize })
      });
      if (!res.ok) throw new Error("Failed to generate panel");
      const payload = await res.json() as { audience?: AudienceDocument } & Partial<AudienceDocument>;
      const doc = payload.audience ?? payload;
      if (onSaved) onSaved(doc as AudienceDocument);
      toast.success(`Started generating ${panelSize} personas.`);
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to generate panel"));
    } finally {
      setGenerating(false);
    }
  }

  const handleUpdate = (field: keyof typeof formData, val: string | string[]) => {
    setFormData((p) => ({ ...p, [field]: val }));
  };

  const toggleChannel = (ch: string) => {
    setFormData((p) => {
      if (p.channels.includes(ch)) return { ...p, channels: p.channels.filter((c) => c !== ch) };
      return { ...p, channels: [...p.channels, ch] };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white">
              {step === 1 && "Describe Your Audience"}
              {step === 2 && "Review Audience Profile"}
              {step === 3 && "Generate Panel"}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
               <span className={step >= 1 ? "text-white" : "text-white/30"}>1. Brief</span>
               <span className="text-white/20">-</span>
               <span className={step >= 2 ? "text-white" : "text-white/30"}>2. Profile</span>
               <span className="text-white/20">-</span>
               <span className={step >= 3 ? "text-white" : "text-white/30"}>3. Panel</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto mt-4">
              <div className="text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-80" />
                <h3 className="text-xl font-medium text-white">Who are we talking to?</h3>
                <p className="text-sm text-white/50">
                  Describe your target audience in plain English. Our AI will automatically structure the profile.
                </p>
              </div>
              <textarea
                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                placeholder="e.g., We are targeting millennial software engineers living in the US who make over $100k. They are frustrated by slow build times and care deeply about open-source tooling..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParseBrief}
                  disabled={parsing || !brief.trim()}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {parsing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <>Next: Review Profile <MoveRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
              <div className="text-center">
                 <button onClick={() => setStep(2)} className="text-xs text-white/40 hover:text-white/80 transition-colors">or skip and fill out manually</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-white/60">Audience Name <span className="text-red-400">*</span></label>
                    <input autoFocus type="text" value={formData.name} onChange={(e) => handleUpdate("name", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. Millennial Devs" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-white/60">Description Summary</label>
                    <textarea value={formData.description} onChange={(e) => handleUpdate("description", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white min-h-[60px] resize-none focus:outline-none focus:border-white/30" />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-2">Demographics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Geography</label>
                    <input type="text" value={formData.geography} onChange={(e) => handleUpdate("geography", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. US, UK, Global" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Age Group</label>
                    <select value={formData.age_band} onChange={(e) => handleUpdate("age_band", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 appearance-none">
                      <option value="" className="bg-[#0a0a0a]">Select age group</option>
                      {AGE_GROUP_OPTIONS.map((ag) => (
                        <option key={ag} value={ag} className="bg-[#0a0a0a]">{ag}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Role / Title</label>
                    <input type="text" value={formData.role} onChange={(e) => handleUpdate("role", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. Platform Engineer" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Background</label>
                    <input type="text" value={formData.company_size} onChange={(e) => handleUpdate("company_size", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. Enterprise, Freelancer, Household" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Spending Power</label>
                    <input type="text" value={formData.spending_power} onChange={(e) => handleUpdate("spending_power", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. High, Budget-conscious" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Product Familiarity</label>
                    <input type="text" value={formData.product_familiarity} onChange={(e) => handleUpdate("product_familiarity", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g. Beginner, Power User" />
                  </div>
                </div>
              </div>

              {/* Advanced Arrays */}
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-2">Psychographics & Channels</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Media Channels</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          formData.channels.includes(ch)
                            ? "bg-white text-black border-white"
                            : "bg-black/40 text-white/60 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                  <TagInput
                    tags={formData.channels.filter((c) => !CHANNEL_OPTIONS.includes(c))}
                    onChange={(customTags) => {
                      const standard = formData.channels.filter((c) => CHANNEL_OPTIONS.includes(c));
                      handleUpdate("channels", [...standard, ...customTags]);
                    }}
                    placeholder="Add custom channel..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Values & Behaviors</label>
                    <TagInput tags={formData.values_behaviors} onChange={(v) => handleUpdate("values_behaviors", v)} placeholder="e.g. Buys open-source first..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Pain Points</label>
                    <TagInput tags={formData.pain_points} onChange={(v) => handleUpdate("pain_points", v)} placeholder="e.g. Too much boilerplate..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-lg mx-auto mt-8 text-center">
              <Users className="w-12 h-12 text-green-400 mx-auto opacity-80" />
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Generate Your Audience Panel</h3>
                <p className="text-sm text-white/50">
                  Your audience profile is saved! Choose the panel size — more personas give a richer, more diverse simulation.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {([
                  { label: "Small", range: "4 – 5", count: 5, desc: "Quick test" },
                  { label: "Medium", range: "7 – 8", count: 8, desc: "Balanced panel" },
                  { label: "Large", range: "10 – 12", count: 12, desc: "Deep coverage" },
                ] as const).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setPanelSize(opt.count)}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all cursor-pointer ${
                      panelSize === opt.count
                        ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className={`text-2xl font-light ${panelSize === opt.count ? "text-green-400" : "text-white"}`}>{opt.range}</span>
                    <span className={`text-sm font-medium ${panelSize === opt.count ? "text-green-300" : "text-white/80"}`}>{opt.label}</span>
                    <span className="text-xs text-white/40">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGeneratePanel}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-black px-6 py-3 rounded-lg text-sm font-semibold hover:bg-green-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating Personas...</>
                ) : (
                  <><Users className="w-5 h-5" /> Generate {panelSize} Personas</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* FOOTER (Only for step 2) */}
        {step === 2 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20 shrink-0">
            <button onClick={() => setStep(1)} className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
              Back to Brief
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
