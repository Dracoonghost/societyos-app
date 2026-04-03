"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FOUNDER_API = "http://127.0.0.1:8000/api/founder";

export interface Persona {
  id: string;
  name: string;
  archetype: string;
  tagline: string;
  color: string;
  emoji: string;
  inspired_by?: string;
  strengths?: string[];
  expertise?: string[];
}

interface Message {
  id: number;
  type: "user" | "advisor";
  personaId?: string;
  text: string;
  timestamp: number;
}

interface Reply {
  persona_id: string;
  name: string;
  archetype: string;
  emoji: string;
  color: string;
  text: string;
}

interface FounderChatProps {
  sessionId: string;
  personas: Persona[];
}

export default function FounderChat({ sessionId, personas }: FounderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgId = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    // Add user message
    const userMsg: Message = {
      id: ++msgId.current,
      type: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`${FOUNDER_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const replies: Reply[] = data.replies || [];

      // Feed replies sequentially with a small delay between each
      replies.forEach((reply, i) => {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: ++msgId.current,
              type: "advisor",
              personaId: reply.persona_id,
              text: reply.text,
              timestamp: Date.now(),
            },
          ]);
        }, i * 800);
      });
    } catch (err) {
      toast.error("Failed to get response", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = activeFilter
    ? messages.filter((m) => m.type === "user" || m.personaId === activeFilter)
    : messages;

  const getPersona = (id: string) => personas.find((p) => p.id === id);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar — persona list */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-white/5 glass py-6 px-3 gap-2 overflow-y-auto">
        <div className="flex items-center gap-2 px-3 pb-3">
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">The Board</span>
        </div>

        {/* All button */}
        <button
          onClick={() => setActiveFilter(null)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            activeFilter === null
              ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
          }`}
        >
          <span className="text-base">🔮</span>
          <div className="text-left">
            <div className="font-medium">All Advisors</div>
          </div>
        </button>

        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveFilter(activeFilter === p.id ? null : p.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              activeFilter === p.id
                ? "border"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
            style={
              activeFilter === p.id
                ? {
                    background: `${p.color}12`,
                    borderColor: `${p.color}40`,
                    color: p.color,
                  }
                : {}
            }
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
              style={{
                background: `${p.color}20`,
                border: `1.5px solid ${p.color}50`,
              }}
            >
              {p.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium leading-tight truncate">{p.name.split(" ")[0]}</div>
              <div className="text-[10px] opacity-60 leading-tight">{p.archetype.replace("The ", "")}</div>
              {p.inspired_by && (
                <div className="text-[9px] text-zinc-600 leading-tight mt-0.5">
                  ↳ {p.inspired_by}
                </div>
              )}
              {activeFilter === p.id && (
                <div className="mt-1.5 space-y-1">
                  {p.expertise && p.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.expertise.map((d) => (
                        <span
                          key={d}
                          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${p.color}18`,
                            color: p.color,
                            border: `1px solid ${p.color}35`,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.strengths && p.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.strengths.map((s) => (
                        <span
                          key={s}
                          className="text-[8px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: "#52525b",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div className="flex-shrink-0 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Board Discussion</h2>
            <p className="text-xs text-zinc-500">
              {activeFilter
                ? `Filtered to ${getPersona(activeFilter)?.name}`
                : `${personas.length} advisors · Session active`}
            </p>
          </div>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          {visibleMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-3xl">💬</p>
                <p className="text-zinc-400 font-medium">The floor is open</p>
                <p className="text-sm text-zinc-600 max-w-xs">
                  Ask the board anything about your idea. Challenge their analysis. Dig deeper on any point.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {visibleMessages.map((msg) => {
              if (msg.type === "user") {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-end"
                  >
                    <div
                      className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-zinc-100"
                      style={{
                        background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.12))",
                        border: "1px solid rgba(168,85,247,0.25)",
                      }}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              }

              const persona = getPersona(msg.personaId || "");
              if (!persona) return null;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex gap-3 items-start"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${persona.color}50, ${persona.color}20)`,
                      border: `1.5px solid ${persona.color}60`,
                    }}
                  >
                    {persona.emoji}
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 min-w-0 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: persona.color }}>
                        {persona.name}
                      </span>
                      <span className="text-[10px] text-zinc-600">{persona.archetype}</span>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-300 leading-relaxed"
                      style={{
                        background: `${persona.color}08`,
                        border: `1px solid ${persona.color}20`,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {isSending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-zinc-500 text-sm"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Advisors are responding...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 glass border-t border-white/5 px-4 md:px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 glass-card rounded-xl p-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the board a question… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-0 px-4 py-3 max-h-36 overflow-y-auto"
                style={{ fieldSizing: "content" } as React.CSSProperties}
                disabled={isSending}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="flex-shrink-0 h-11 w-11 p-0 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white shadow-lg shadow-purple-500/20 transition-all duration-200"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-zinc-700 mt-2 pl-1">
            Enter to send · Shift+Enter for new line · Filter by advisor in the sidebar
          </p>
        </div>
      </div>
    </div>
  );
}
