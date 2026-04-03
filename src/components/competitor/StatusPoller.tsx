"use client";

import { useEffect, useRef } from "react";

interface StatusData {
  id: string;
  status: string;
  current_step?: string | null;
  error_message?: string | null;
  sections_generated?: string[] | null;
}

interface StatusPollerProps {
  reportId: string;
  apiBase: string;
  token: string;
  onComplete: () => void;
  onFailed: (error: string) => void;
  onStatusUpdate: (data: StatusData) => void;
}

export function StatusPoller({
  reportId,
  apiBase,
  token,
  onComplete,
  onFailed,
  onStatusUpdate,
}: StatusPollerProps) {
  const esRef = useRef<EventSource | null>(null);
  const stoppedRef = useRef(false);
  // Keep a lightweight polling loop running as a safety net in case the
  // EventSource connection stays open but progress events stop arriving.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    stoppedRef.current = false;

    // ── SSE via EventSource ────────────────────────────────────────────────
    // EventSource doesn't support custom headers, so we pass the token as a
    // query param. The backend validates it the same way.
    const url = `${apiBase}/api/jobs/competitor/${reportId}/progress?token=${encodeURIComponent(token)}`;

    const startSSE = () => {
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (event) => {
        if (stoppedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          // Forward status / progress events to parent
          if (msg.status || msg.step) {
            onStatusUpdate({
              id: reportId,
              status: msg.status ?? "",
              current_step: msg.step ?? null,
              sections_generated: msg.sections_generated ?? null,
            });
          }

          // Terminal states
          if (msg.type === "done" || msg.status === "complete") {
            stoppedRef.current = true;
            es.close();
            onComplete();
          } else if (msg.status === "failed") {
            stoppedRef.current = true;
            es.close();
            onFailed(msg.error ?? "Analysis failed");
          }
        } catch {
          // malformed event — ignore
        }
      };

      es.onerror = () => {
        if (stoppedRef.current) return;
        es.close();
      };
    };

    // ── Polling fallback ──────────────────────────────────────────────────
    const poll = async () => {
      if (stoppedRef.current) return;
      try {
        const pollUrl = new URL(`${apiBase}/api/competitor-analysis/${reportId}/status`);
        pollUrl.searchParams.set("_ts", String(Date.now()));
        const res = await fetch(
          pollUrl.toString(),
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        if (!res.ok) return;
        const data: StatusData = await res.json();
        onStatusUpdate(data);
        if (data.status === "complete") {
          stoppedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete();
        } else if (data.status === "failed") {
          stoppedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onFailed(data.error_message || "Analysis failed");
        }
      } catch {
        // single failed poll — keep going
      }
    };

    const startPolling = () => {
      if (stoppedRef.current || intervalRef.current) return;
      poll();
      intervalRef.current = setInterval(poll, 3000);
    };

    startPolling();
    startSSE();

    return () => {
      stoppedRef.current = true;
      esRef.current?.close();
      esRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reportId, apiBase, token, onComplete, onFailed, onStatusUpdate]);

  return null; // logic only — UI is rendered by parent
}
