"use client";

/**
 * ============================================================
 * InputForm.tsx — Phase 1: Campaign Input
 * ============================================================
 * Full-page centered layout with:
 *  - Large textarea for ad copy
 *  - Drag-and-drop image upload zone (UI only)
 *  - Glowing "Run Simulation" button
 * ============================================================
 */

import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Upload,
    X,
    ImageIcon,
    Zap,
    Video,
    Loader2,
    Users,
    FileText,
    Target,
    AlertTriangle,
    Eye,
    Shield
} from "lucide-react";

interface CreatorIntent {
    objective: string;
    target_audience: string;
    intended_takeaway: string;
    must_not_miss: string;
    misread_risks: string;
}

interface InputFormProps {
    onSubmit: (content: string, scenarioType: string, creatorIntent: CreatorIntent) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
    const [adText, setAdText] = useState(`**VIDEO AD CAMPAIGN ANALYSIS**\n\n**Visual Scene Descriptions:**\n[Timecode ~0s]: In a formal boardroom, a serious executive sits at a table with an employee standing attentively behind him as they both face a screen displaying the Flipkart logo.\n[Timecode ~5s]: Five Namibia rugby players gather intensely around a wooden conference table, leaning in to review documents during a serious strategic meeting.\n[Timecode ~10s]: A cheerful employee wearing a Taylors lanyard claps his hands in satisfaction while a serious man in a suit sits beside him and replies, "Yes."\n[Timecode ~15s]: Five men wearing matching Namibia jerseys gather seriously around a wooden conference table in a boardroom, engaging in an intense discussion where one man gestures with his thumb while the others look on attentively.\n[Timecode ~20s]: A team of male athletes wearing "Namibia" jerseys sit and stand around a conference table with serious, determined expressions, declaring their national identity to an unseen group.\n[Timecode ~25s]: Several Chelsea FC players lean intensely over a conference table, watching a businessman address a seated executive in a formal boardroom meeting.\n[Timecode ~30s]: An enthusiastic employee wearing a WorldAir ID lanyard excitedly points upward while explaining details to a bored-looking, suit-wearing supervisor seated beside him in front of international time zone clocks.\n[Timecode ~35s]: In a boardroom setting, five male soccer players wearing Namibia jerseys display focused intensity as one member stands playing a hand drum while the others sit around a large wooden conference table.\n[Timecode ~40s]: A smiling employee proudly holds up his Flipkart ID badge while standing beside a seated executive in front of a digital display showing Flipkart as an official sponsor.\n[Timecode ~45s]: Four serious athletes in Namibia jerseys look on intently as a caption humorously highlights that the brand Flipkart is not actually available in their country.\n[Timecode ~50s]: A group of five serious-looking athletes in matching "Namibia" jerseys stand around a conference table with skeptical and confused expressions, reacting to the subtitle question, "Then, why sponsor Namibia?!?"\n[Timecode ~55s]: In this Google advertisement, a standing employee wearing a branded lanyard smiles encouragingly behind a seated businessman who gazes thoughtfully ahead, conveying a sense of confident professional collaboration.\n[Timecode ~60s]: In a corporate office setting featuring the Twitter logo on a screen, a smiling executive sits at a table while his standing colleague looks on approvingly as the seated man notes they have achieved the "same viewership, same logo size."\n[Timecode ~65s]: A smiling Flipkart employee stands attentively behind an enthusiastic man in a suit who gestures expressively while speaking passionately about finding great deals.\n[Timecode ~70s]: Four smiling Namibian rugby players proudly display a team jersey together in front of a branded Flipkart backdrop.\n[Timecode ~75s]: Corporate executives and members of the Namibia national cricket team smile and wave warmly while jointly presenting a blue Flipkart-sponsored jersey against a branded backdrop.\n\n**Audio Spoken Transcript:**\n"So, Flipkart wants to sponsor the Namibian cricket team? Yes. But Flipkart is in India. Yes. We are Namibia. Yes, yes. India. Namibia. Namibia. Yes. India. Oh, wow, bozerous. But Flipkart is not in Namibia. Yes. Then why sponsor Namibia? Because we got a great deal. Same group, same matches, same viewership, same logo sites. And who knows, great deals better than us. And we give great deals to every Indian. We are Namibian. Doesn't matter bro, just smile away."`);
    const [scenarioType, setScenarioType] = useState("ad");
    const [creatorIntent, setCreatorIntent] = useState<CreatorIntent>({
        objective: "PR + Brand Love (sponsorship announcement). Reinforce Flipkart’s “great deals” positioning while making the sponsorship feel clever/funny.",
        target_audience: "18–35, India (Gen Z + millennials), mainstream e-commerce shoppers; platforms: YouTube + Instagram (Reels/Shorts).",
        intended_takeaway: "Flipkart gets “smart deals” even in sponsorships—same visibility/value as bigger teams—so Flipkart = best deals for Indians (and a playful, confident brand).",
        must_not_miss: "* The core joke: “Flipkart isn’t in Namibia” → “Why sponsor them?”\n* Punchline logic: “Great deal / same group / same matches / same viewership / same logo size.”\n* Flipkart’s brand promise line: “We give great deals to every Indian.”\n* Closing beat: Namibia team smiling/posing with the Flipkart-sponsored jersey (sponsorship reveal).",
        misread_risks: "* Confusion about the sport/team (frames say rugby/football; transcript says cricket) → viewers think it’s sloppy.\n* People may read it as “Flipkart is expanding to Namibia” or “global shipping,” which the ad doesn’t claim.\n* “Same logo size / same viewership” can sound like cheaping out or exploiting a smaller team instead of genuine support.\n* Cultural tone risk: the “doesn’t matter bro, just smile” line may feel dismissive.\n* Too boardroom-y: could feel like an internal corporate skit vs a consumer-facing message.",
    });
    const [showIntent, setShowIntent] = useState(false);
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---- Drag & Drop handlers ---- */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);

        const videoFile = files.find(f => f.type.startsWith("video/"));
        if (videoFile) {
            uploadVideoAndAnalyze(videoFile);
            return;
        }

        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        addImages(imageFiles);
    }, []);

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                const files = Array.from(e.target.files);

                const videoFile = files.find(f => f.type.startsWith("video/"));
                if (videoFile) {
                    uploadVideoAndAnalyze(videoFile);
                    return;
                }

                const imageFiles = files.filter((f) => f.type.startsWith("image/"));
                addImages(imageFiles);
            }
        },
        []
    );

    const uploadVideoAndAnalyze = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://localhost:8000/api/analyze-video", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Video analysis failed");

            const data = await res.json();
            if (data.status === "success" && data.summary) {
                setAdText(prev => prev ? `${prev}\n\n${data.summary}` : data.summary);
            }
        } catch (error) {
            console.error(error);
            alert("Error analyzing video. Make sure the backend is running and the file is valid.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    /** Add images and generate previews */
    const addImages = (files: File[]) => {
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...newImages].slice(0, 4)); // max 4 images
    };

    /** Remove a single image */
    const removeImage = (index: number) => {
        setImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const intentComplete =
        creatorIntent.objective.trim().length > 0 &&
        creatorIntent.target_audience.trim().length > 0 &&
        creatorIntent.intended_takeaway.trim().length > 0 &&
        creatorIntent.must_not_miss.trim().length > 0 &&
        creatorIntent.misread_risks.trim().length > 0;
    const canSubmit = adText.trim().length >= 10 && intentComplete;

    const updateIntent = (field: keyof CreatorIntent, value: string) => {
        setCreatorIntent(prev => ({ ...prev, [field]: value.slice(0, 400) }));
    };

    const intentFields: { key: keyof CreatorIntent; label: string; placeholder: string; icon: React.ReactNode }[] = [
        { key: "objective", label: "Objective", placeholder: "awareness / brand love / conversion / PR", icon: <Target className="h-3.5 w-3.5" /> },
        { key: "target_audience", label: "Target Audience", placeholder: "18-25, India, Instagram + YouTube", icon: <Users className="h-3.5 w-3.5" /> },
        { key: "intended_takeaway", label: "Intended Takeaway", placeholder: "What viewers should remember from this ad", icon: <Eye className="h-3.5 w-3.5" /> },
        { key: "must_not_miss", label: "Must-Not-Miss Elements", placeholder: "Joke, twist, CTA to highlight", icon: <FileText className="h-3.5 w-3.5" /> },
        { key: "misread_risks", label: "Misread Risks", placeholder: "Sensitive topics, likely visual/audio misreadings", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex min-h-screen items-center justify-center px-4 py-12"
        >
            <div className="w-full max-w-2xl space-y-8">
                {/* ---- Header ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-3"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm text-purple-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI-Powered Focus Group
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        <span className="shimmer-text">SocietyOS</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Run your D2C campaign through a focus group of 10 AI agents.
                        Get a vibe check in seconds.
                    </p>
                </motion.div>

                {/* ---- Scenario Type Selection ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center flex-wrap gap-2"
                >
                    {[
                        { id: "ad", label: "Ad" },
                        { id: "social_post", label: "Social Post" },
                        { id: "launch_copy", label: "Launch Copy" },
                        { id: "press_statement", label: "Press Statement" }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setScenarioType(type.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${scenarioType === type.id
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </motion.div>

                {/* ---- Creator Intent (collapsible) ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                >
                    <button
                        onClick={() => setShowIntent(!showIntent)}
                        className="w-full flex items-center justify-between glass-card rounded-xl px-5 py-3 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            Creator Intent
                            {intentComplete ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ Complete</span>
                            ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Required</span>
                            )}
                        </span>
                        <span className={`transition-transform duration-200 ${showIntent ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {showIntent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-3"
                        >
                            {intentFields.map((field) => (
                                <div key={field.key} className="glass-card rounded-xl p-3">
                                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                                        {field.icon}
                                        {field.label}
                                        <span className="ml-auto text-[10px] text-zinc-600">
                                            {creatorIntent[field.key].length}/400
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={creatorIntent[field.key]}
                                        onChange={(e) => updateIntent(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        maxLength={400}
                                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-0"
                                    />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* ---- Textarea ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="glass-card rounded-2xl p-1">
                        <Textarea
                            value={adText}
                            onChange={(e) => setAdText(e.target.value)}
                            placeholder="Enter your D2C Ad Copy or Campaign Idea..."
                            className="min-h-[180px] resize-none border-0 bg-transparent text-base placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-5"
                        />
                        <div className="flex items-center justify-between px-5 pb-3 pt-1">
                            <span className="text-xs text-zinc-500">
                                {adText.length} characters
                                {adText.length > 0 && adText.length < 10 && (
                                    <span className="text-amber-400/70 ml-2">
                                        (min. 10 characters)
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ---- Image Upload Zone ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-6
              transition-all duration-300 text-center
              ${isDragging
                                ? "border-purple-400 bg-purple-500/10 scale-[1.01]"
                                : "border-zinc-700/50 hover:border-purple-500/40 hover:bg-purple-500/5"
                            }
            `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/mp4,video/quicktime,video/webm"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {isAnalyzing ? (
                            <div className="space-y-4 py-4">
                                <Loader2 className="h-10 w-10 mx-auto text-purple-400 animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-purple-300 font-medium">Extracting Frames & Audio...</p>
                                    <p className="text-xs text-zinc-500">Transcribing and passing through Qwen Vision models.</p>
                                </div>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="space-y-2">
                                <Upload className="h-8 w-8 mx-auto text-zinc-500" />
                                <p className="text-sm text-zinc-400">
                                    Drag & drop campaign images or a <strong>Video Ad</strong>, or{" "}
                                    <span className="text-purple-400 font-medium">browse</span>
                                </p>
                                <p className="text-xs text-zinc-600">Images (PNG/JPG) or Video (MP4/MOV)</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 justify-center">
                                {images.map((img, i) => (
                                    <div key={i} className="relative group">
                                        <img
                                            src={img.preview}
                                            alt={`Campaign image ${i + 1}`}
                                            className="h-20 w-20 rounded-lg object-cover border border-zinc-700/50"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(i);
                                            }}
                                            className="absolute -top-2 -right-2 rounded-full bg-zinc-800 border border-zinc-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3 text-zinc-300" />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 4 && (
                                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-zinc-700/50 flex items-center justify-center hover:border-purple-500/40 transition-colors">
                                        <ImageIcon className="h-5 w-5 text-zinc-600" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ---- Run Simulation Button ---- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="flex justify-center"
                >
                    <Button
                        onClick={() => onSubmit(adText, scenarioType, creatorIntent)}
                        disabled={!canSubmit}
                        size="lg"
                        className={`
              relative group px-10 py-6 text-base font-semibold rounded-xl
              transition-all duration-300
              ${canSubmit
                                ? "bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }
            `}
                    >
                        {/* Glow ring behind button */}
                        {canSubmit && (
                            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                        )}
                        <Zap className="h-5 w-5 mr-2" />
                        Continue Setup
                    </Button>
                </motion.div>

                {/* ---- Footer hint ---- */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center text-xs text-zinc-600"
                >
                    Powered by CrewAI · Hugging Face · ChromaDB
                </motion.p>
            </div>
        </motion.div>
    );
}
