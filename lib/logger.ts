import { z } from "zod";
import { toCSV } from "@/lib/csv";
import { downloadCSV } from "@/lib/export";
import type { Angle, Settings, TokenUsage, VariantType } from "@/lib/types";

export const LOG_STORAGE_KEY = "hook-lab_log";
export const LOG_FILE_NAME = "hook-lab_log.csv";

const LOG_CSV_HEADERS = ["timestamp", "type", "run_id", "payload"] as const;
const MS_PER_SECOND = 1000;

export interface LogPayloads {
  generate: { runId: string; winner: string; counts: Settings["counts"]; usage: TokenUsage; ms: number };
  select: { runId: string; variantId: string; type: VariantType; selected: boolean };
  edit: { runId: string; variantId: string; type: VariantType };
  regenerate: { runId: string; variantId: string; type: VariantType; angle: Angle };
  export: {
    runId: string;
    format: "csv" | "brief" | "copy";
    selectedCount: number;
    secondsSinceGenerate: number | null;
  };
}

export type LogEventType = keyof LogPayloads;

const logEntrySchema = z.object({
  ts: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLog(): LogEntry[] {
  try {
    const raw = getStorage()?.getItem(LOG_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = z.array(logEntrySchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function logEvent<T extends LogEventType>(type: T, payload: LogPayloads[T]): void {
  const storage = getStorage();
  if (storage === null) {
    return;
  }
  const entry = { ts: new Date().toISOString(), type, payload };
  try {
    storage.setItem(LOG_STORAGE_KEY, JSON.stringify([...readLog(), entry]));
  } catch {
    return;
  }
}

function runIdOf(entry: LogEntry): string {
  const runId = entry.payload.runId;
  return typeof runId === "string" ? runId : "";
}

export function secondsSinceGenerate(runId: string, now: number = Date.now()): number | null {
  const generateEntry = readLog()
    .filter((entry) => entry.type === "generate" && runIdOf(entry) === runId)
    .at(-1);
  if (generateEntry === undefined) {
    return null;
  }
  return Math.round((now - Date.parse(generateEntry.ts)) / MS_PER_SECOND);
}

export function toLogCSV(entries: readonly LogEntry[]): string {
  return toCSV(
    LOG_CSV_HEADERS,
    entries.map((entry) => ({
      timestamp: entry.ts,
      type: entry.type,
      run_id: runIdOf(entry),
      payload: JSON.stringify(entry.payload),
    })),
  );
}

export function exportLogCSV(): void {
  downloadCSV(LOG_FILE_NAME, toLogCSV(readLog()));
}
