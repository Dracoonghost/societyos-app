"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, MessageSquareQuote, Quote, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ChatCitation {
  chunk_id: string;
  file_id: string;
  filename: string;
  text_snippet: string;
  page_number?: number | null;
  section_heading?: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

interface KnowledgePackChatProps {
  packId: string;
  packName: string;
  status: "created" | "processing" | "complete" | "failed";
  totalChunks: number;
  getIdToken: () => Promise<string | null>;
}

const SUGGESTED_PROMPTS = [
  "Summarize the most important facts in this pack.",
  "What does this pack say about the primary user and their workflow?",
  "What constraints or risks appear repeatedly in these documents?",
  "What information seems missing or still unsupported here?",
];

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\)]+\))/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--text-1)" }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--accent-amber)" }}
          className="underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMarkdownContent(content: string): React.ReactNode {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraphLines: string[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="leading-relaxed">
          {renderInlineMarkdown(text)}
        </p>
      );
    }
    paragraphLines = [];
  };

  const flushBulletList = () => {
    if (bulletItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1">
        {bulletItems.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushOrderedList = () => {
    if (orderedItems.length === 0) return;
    blocks.push(
      <ol key={`ol-${blocks.length}`} className="list-decimal pl-5 space-y-1">
        {orderedItems.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>
    );
    orderedItems = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBulletList();
    flushOrderedList();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      const Tag = headingMatch[1].length === 1 ? "h2" : headingMatch[1].length === 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={`h-${blocks.length}`} className="font-semibold text-[var(--text-1)]">
          {renderInlineMarkdown(headingMatch[2])}
        </Tag>
      );
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      flushOrderedList();
      bulletItems.push(bulletMatch[1]);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushBulletList();
      orderedItems.push(orderedMatch[1]);
      return;
    }

    paragraphLines.push(line);
  });

  flushAll();

  return <div className="space-y-3">{blocks}</div>;
}

export default function KnowledgePackChat({
  packId,
  packName,
  status,
  totalChunks,
  getIdToken,
}: KnowledgePackChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = useCallback(async (preset?: string) => {
    const message = (preset ?? input).trim();
    if (!message || isSending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}/api/knowledge-packs/${packId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const data = await res.json() as {
        session_id: string;
        answer: string;
        citations: ChatCitation[];
      };

      setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.answer,
          citations: data.citations ?? [],
        },
      ]);
    } catch (error) {
      toast.error("Knowledge pack chat failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setMessages((prev) => prev.filter((entry) => entry.id !== userMessage.id));
      setInput(message);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [getIdToken, input, isSending, packId, sessionId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const summaryMode = totalChunks === 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquareQuote size={16} style={{ color: "var(--accent-amber)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                Ask this knowledge pack
              </p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
              Ask questions about {packName}. Answers are grounded in the pack summary and indexed file excerpts.
            </p>
          </div>
          <div
            className="text-[11px] px-2 py-1 rounded-lg whitespace-nowrap"
            style={{ backgroundColor: "var(--bg-2)", color: "var(--text-3)" }}
          >
            {totalChunks} indexed chunk{totalChunks === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {summaryMode && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(242, 169, 59, 0.08)",
            border: "1px solid rgba(242, 169, 59, 0.22)",
            color: "var(--accent-amber)",
          }}
        >
          {status === "processing"
            ? "Files are still processing. Answers will rely mostly on the pack summary until indexing finishes."
            : "No indexed file excerpts are available yet. Answers will rely on the pack summary until files are uploaded and processed."}
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="h-[58vh] overflow-y-auto px-4 py-5 sm:px-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--bg-2)", color: "var(--accent-amber)" }}
              >
                <Sparkles size={22} />
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                Start a grounded conversation
              </p>
              <p className="text-sm max-w-xl mb-5" style={{ color: "var(--text-3)" }}>
                The assistant will answer from this pack’s content and show the excerpts it relied on.
              </p>
              <div className="w-full max-w-2xl grid gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    className="text-left rounded-xl px-4 py-3 text-sm transition-colors hover:opacity-85"
                    style={{ backgroundColor: "var(--bg-2)", color: "var(--text-2)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
                      <div
                        className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={isUser
                          ? {
                              backgroundColor: "rgba(242, 169, 59, 0.14)",
                              border: "1px solid rgba(242, 169, 59, 0.24)",
                              color: "var(--text-1)",
                            }
                          : {
                              backgroundColor: "var(--bg-2)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-2)",
                            }}
                      >
                        {isUser ? message.content : renderMarkdownContent(message.content)}
                      </div>

                      {!isUser && message.citations && message.citations.length > 0 && (
                        <div className="w-full rounded-xl p-3" style={{ backgroundColor: "var(--bg-2)" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Quote size={14} style={{ color: "var(--text-3)" }} />
                            <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                              Supporting excerpts
                            </p>
                          </div>
                          <div className="space-y-2">
                            {message.citations.map((citation, index) => (
                              <div
                                key={`${message.id}-${citation.chunk_id}`}
                                className="rounded-lg px-3 py-2 text-xs font-medium"
                                style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
                              >
                                <span style={{ color: "var(--text-2)" }}>
                                  [{index + 1}] {citation.filename}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm flex items-center gap-2"
                    style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)", color: "var(--text-3)" }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Thinking through the pack...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t px-4 py-4 sm:px-5" style={{ borderColor: "var(--border-subtle)" }}>
          <div
            className="rounded-2xl p-2"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-subtle)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Ask a question about this knowledge pack..."
              className="w-full bg-transparent resize-none outline-none text-sm px-2 py-1"
              style={{ color: "var(--text-1)" }}
            />
            <div className="flex items-center justify-between gap-3 px-2 pt-1">
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Press Enter to send. Shift+Enter adds a new line.
              </p>
              <button
                onClick={() => void sendMessage()}
                disabled={isSending || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-amber)", color: "#20170a" }}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}