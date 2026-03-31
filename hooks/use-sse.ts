"use client";

import { useEffect, useRef } from "react";

type SSEEventHandler = (data: unknown) => void;

export function useSSE(
  events: Record<string, SSEEventHandler>,
  enabled = true
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;

    es.addEventListener("heartbeat", () => {
      // Keep-alive, do nothing
    });

    for (const [event, handler] of Object.entries(events)) {
      es.addEventListener(event, (e: MessageEvent) => {
        try {
          handler(JSON.parse(e.data));
        } catch {
          handler(e.data);
        }
      });
    }

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [enabled]);

  return eventSourceRef;
}
