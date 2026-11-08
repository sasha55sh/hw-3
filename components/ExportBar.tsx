"use client";

import { useState } from "react";
import { Button, VARIANT_TYPE_LABELS } from "@/components/ui";
import { estimateCost } from "@/lib/cost";
import { copyToClipboard, downloadCSV, downloadMarkdown, toBriefMarkdown, toVariantsCSV } from "@/lib/export";
import { exportLogCSV, logEvent, secondsSinceGenerate, type LogPayloads } from "@/lib/logger";
import type { Run } from "@/lib/useHookLab";

type CopyState = "idle" | "copied" | "failed";

const COPY_MESSAGES: Readonly<Record<CopyState, string>> = {
  idle: "",
  copied: "Copied to clipboard.",
  failed: "Could not copy. Check browser permissions.",
};

const MS_PER_SECOND = 1000;

function toFileBase(winnerName: string): string {
  return winnerName.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "winner";
}

interface ExportBarProps {
  run: Run;
}

export function ExportBar({ run }: ExportBarProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const selected = run.variants.filter((variant) => variant.selected);
  const fileBase = toFileBase(run.winnerName);
  const hasSelection = selected.length > 0;

  function logExport(format: LogPayloads["export"]["format"]) {
    logEvent("export", {
      runId: run.id,
      format,
      selectedCount: selected.length,
      secondsSinceGenerate: secondsSinceGenerate(run.id),
    });
  }

  function handleCsvExport() {
    downloadCSV(`${fileBase}_variants.csv`, toVariantsCSV(run.id, run.variants, run.original));
    logExport("csv");
  }

  function handleBriefExport() {
    downloadMarkdown(`${fileBase}_brief.md`, toBriefMarkdown(run.winnerName, run.variants, run.original.hook));
    logExport("brief");
  }

  async function handleCopy() {
    const text = selected.map((variant) => `[${VARIANT_TYPE_LABELS[variant.type]}] ${variant.text}`).join("\n");
    const isCopied = await copyToClipboard(text);
    setCopyState(isCopied ? "copied" : "failed");
    if (isCopied) {
      logExport("copy");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm font-semibold text-ink">Selected: {selected.length}</p>
        <Button onClick={handleCsvExport}>CSV</Button>
        <Button onClick={handleBriefExport} disabled={!hasSelection}>
          Brief .md
        </Button>
        <Button onClick={handleCopy} disabled={!hasSelection}>
          Copy
        </Button>
        <Button onClick={exportLogCSV} variant="ghost">
          Log CSV
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <p>
          ≈ ${estimateCost(run.usage).toFixed(2)} · {Math.round(run.ms / MS_PER_SECOND)} s
        </p>
        <p role="status" aria-live="polite">
          {COPY_MESSAGES[copyState]}
        </p>
      </div>
    </div>
  );
}
