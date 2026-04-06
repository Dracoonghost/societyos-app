"use client";

import { useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AnalysisPollEvent {
  seq: number;
  type: string;
  data: Record<string, unknown>;
  ts: string;
}

interface AnalysisPollResponse {
  status: string;
  events: AnalysisPollEvent[];
  total: number;
}

const TERMINAL_STATUSES = new Set(["ready", "error"]);
const TERMINAL_EVENT_TYPES = new Set(["done", "error"]);

/**
 * Polls GET /api/founder/analyze/{reviewId}/events?after={cursor} every
 * `intervalMs` milliseconds and calls `onEvents` with each batch of new events.
 *
 * Stops automatically when a terminal event type (done/error) is received
 * or when the review document status reaches "ready" or "error".
 *
 * @param reviewId  The review_id returned by POST /analyze/job.
 * @param enabled   Set to true to start polling, false to pause/stop.
 * @param onEvents  Callback invoked with each batch of new AnalysisPollEvents.
 * @param getToken  Async function that returns a Firebase auth token (or null).
 * @param intervalMs  Polling interval in milliseconds (default 1000).
 */
export function useAnalysisPoller({
  reviewId,
  enabled,
  onEvents,
  getToken,
  intervalMs = 1000,
}: {
  reviewId: string | null;
  enabled: boolean;
  onEvents: (events: AnalysisPollEvent[]) => void;
  getToken: () => Promise<string | null>;
  intervalMs?: number;
}): void {
  const cursorRef = useRef<number>(0);
  const activeRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const onEventsRef = useRef(onEvents);
  onEventsRef.current = onEvents;

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!reviewId || !enabled) {
      stop();
      return;
    }

    cursorRef.current = 0;
    activeRef.current = true;

    const poll = async () => {
      if (!activeRef.current) return;

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = `${API_URL}/api/founder/analyze/${reviewId}/events?after=${cursorRef.current}`;
        const res = await fetch(url, { headers, signal: ctrl.signal });

        if (!res.ok) {
          console.warn(`[useAnalysisPoller] HTTP ${res.status} for ${reviewId}`);
        } else {
          const data: AnalysisPollResponse = await res.json();

          if (data.events && data.events.length > 0) {
            cursorRef.current = data.total;
            onEventsRef.current(data.events);

            const hasTerminal = data.events.some((e) => TERMINAL_EVENT_TYPES.has(e.type));
            if (hasTerminal || TERMINAL_STATUSES.has(data.status)) {
              stop();
              return;
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.warn("[useAnalysisPoller] fetch error:", err);
      }

      if (activeRef.current) {
        timerRef.current = setTimeout(poll, intervalMs);
      }
    };

    poll();

    return stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId, enabled]);
}
