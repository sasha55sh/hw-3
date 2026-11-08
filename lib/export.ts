import { toCSV } from "@/lib/csv";
import type { ScriptParts, Variant } from "@/lib/types";

const VARIANT_CSV_HEADERS = [
  "run_id",
  "type",
  "angle",
  "text",
  "rationale",
  "flags",
  "selected",
  "edited",
  "original_hook",
] as const;

const MISSING_TEXT = "—";
const UTF8_BOM = "﻿";

export function toVariantsCSV(runId: string, variants: readonly Variant[], original: ScriptParts): string {
  return toCSV(
    VARIANT_CSV_HEADERS,
    variants.map((variant) => ({
      run_id: runId,
      type: variant.type,
      angle: variant.angle,
      text: variant.text,
      rationale: variant.rationale,
      flags: variant.flags.map((flag) => flag.kind).join("|"),
      selected: String(variant.selected),
      edited: String(variant.edited),
      original_hook: original.hook,
    })),
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function pickRoundRobin(variants: readonly Variant[], index: number): string {
  const variant = variants[index % Math.max(variants.length, 1)];
  return variant === undefined ? MISSING_TEXT : variant.text;
}

export function toBriefMarkdown(
  winnerName: string,
  variants: readonly Variant[],
  originalHook: string,
  date: Date = new Date(),
): string {
  const selected = variants.filter((variant) => variant.selected);
  const hooks = selected.filter((variant) => variant.type === "hook");
  const firstLines = selected.filter((variant) => variant.type === "firstLine");
  const onScreen = selected.filter((variant) => variant.type === "onScreen");

  const lines = [`# Brief: ${winnerName} — ${formatDate(date)}`, "", `Original hook: ${originalHook}`];
  if (hooks.length === 0) {
    lines.push("", "_No hooks selected._");
  }
  hooks.forEach((hook, index) => {
    lines.push(
      "",
      `## Modification ${index + 1} (angle: ${hook.angle})`,
      `Hook: ${hook.text}`,
      `First lines: ${pickRoundRobin(firstLines, index)}`,
      `On-screen text: ${pickRoundRobin(onScreen, index)}`,
    );
  });
  return `${lines.join("\n")}\n`;
}

export function downloadFile(fileName: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCSV(fileName: string, csv: string): void {
  downloadFile(fileName, `${UTF8_BOM}${csv}`, "text/csv;charset=utf-8");
}

export function downloadMarkdown(fileName: string, markdown: string): void {
  downloadFile(fileName, markdown, "text/markdown;charset=utf-8");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
