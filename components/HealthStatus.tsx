"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { healthResponseSchema } from "@/lib/schema";
import type { HealthResponse } from "@/lib/types";

type HealthState = { kind: "loading" } | { kind: "ready"; health: HealthResponse } | { kind: "error" };

interface HealthView {
  dotClassName: string;
  label: string;
}

function describeHealth(state: HealthState): HealthView {
  switch (state.kind) {
    case "loading":
      return { dotClassName: "bg-ink-muted", label: "Checking…" };
    case "error":
      return { dotClassName: "bg-flag-red", label: "Server unavailable" };
    case "ready":
      return state.health.keyConfigured
        ? { dotClassName: "bg-ok", label: `${state.health.model} · ok` }
        : { dotClassName: "bg-flag-red", label: `${state.health.model} · no API key` };
  }
}

export function HealthStatus() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    let isCancelled = false;
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: unknown) => {
        const parsed = healthResponseSchema.safeParse(data);
        if (!isCancelled) {
          setState(parsed.success ? { kind: "ready", health: parsed.data } : { kind: "error" });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setState({ kind: "error" });
        }
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const view = describeHealth(state);

  return (
    <p className="flex items-center gap-2 text-xs text-ink-muted" role="status">
      <span aria-hidden="true" className={cn("size-2.5 rounded-full", view.dotClassName)} />
      {view.label}
    </p>
  );
}
