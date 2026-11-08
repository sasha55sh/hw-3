"use client";

import { useMemo, useState } from "react";
import { checkVariant, runChecks } from "@/lib/checks";
import { pickTopLibrary } from "@/lib/library";
import { logEvent } from "@/lib/logger";
import { parseScript } from "@/lib/parseScript";
import { passcodeHeaders } from "@/lib/passcodeHeader";
import { SAMPLE_BRAND_GUIDE, SAMPLE_LIBRARY, type DemoScript } from "@/lib/sampleData";
import {
  DEFAULT_SETTINGS,
  errorResponseSchema,
  generateOneResponseSchema,
  generateResponseSchema,
  libraryItemSchema,
  scriptPartsSchema,
  settingsSchema,
  type GenerateRequest,
} from "@/lib/schema";
import { z } from "zod";
import type {
  GeneratedVariant,
  LibraryItem,
  ModelOutput,
  ScriptParts,
  Settings,
  TokenUsage,
  Variant,
  VariantType,
} from "@/lib/types";
import { useLocalStorageValue } from "@/lib/useLocalStorageValue";

const PASSCODE_KEY = "hook-lab_passcode";
const SETTINGS_KEY = "hook-lab_settings";
const BRAND_GUIDE_KEY = "hook-lab_brand_guide";
const LIBRARY_KEY = "hook-lab_library";
const SCRIPT_KEY = "hook-lab_script";
const SCRIPT_RAW_KEY = "hook-lab_script_raw";
const WINNER_NAME_KEY = "hook-lab_winner_name";

const storedLibrarySchema = z.array(libraryItemSchema);
const DEFAULT_WINNER_NAME = "winner";

const EMPTY_SCRIPT: ScriptParts = { hook: "", firstLines: "", onScreen: "", body: "", cta: "" };

export type GenerationStatus = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

export interface Run {
  id: string;
  winnerName: string;
  original: ScriptParts;
  analysis: ModelOutput["analysis"];
  variants: Variant[];
  usage: TokenUsage;
  ms: number;
}

type ApiResult = { ok: true; data: unknown } | { ok: false; status: number; message: string };

function parseStoredSettings(raw: string | null | undefined): Settings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function parseStoredLibrary(raw: string | null | undefined): readonly LibraryItem[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = storedLibrarySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function parseStoredScript(raw: string | null | undefined): ScriptParts {
  if (!raw) {
    return EMPTY_SCRIPT;
  }
  try {
    const parsed = scriptPartsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_SCRIPT;
  } catch {
    return EMPTY_SCRIPT;
  }
}

function toVariants(generated: readonly GeneratedVariant[], type: VariantType): Variant[] {
  return generated.map((variant) => ({
    ...variant,
    id: crypto.randomUUID(),
    type,
    flags: [],
    selected: false,
    edited: false,
  }));
}

function addUsage(first: TokenUsage, second: TokenUsage): TokenUsage {
  return {
    input_tokens: first.input_tokens + second.input_tokens,
    output_tokens: first.output_tokens + second.output_tokens,
  };
}

function updateVariant(run: Run, variantId: string, update: (variant: Variant) => Variant): Run {
  return {
    ...run,
    variants: run.variants.map((variant) => (variant.id === variantId ? update(variant) : variant)),
  };
}

async function postGenerate(passcode: string, body: GenerateRequest): Promise<ApiResult> {
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...passcodeHeaders(passcode) },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, message: "Network error. Check your connection and try again." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (response.ok) {
    return { ok: true, data };
  }
  const parsedError = errorResponseSchema.safeParse(data);
  return {
    ok: false,
    status: response.status,
    message: parsedError.success ? parsedError.data.error : `Request failed (${response.status}).`,
  };
}

export function useHookLab() {
  const [passcode, setPasscode] = useLocalStorageValue(PASSCODE_KEY);
  const [storedSettings, setStoredSettings] = useLocalStorageValue(SETTINGS_KEY);
  const [storedBrandGuide, setStoredBrandGuide] = useLocalStorageValue(BRAND_GUIDE_KEY);
  const [storedLibrary, setStoredLibrary] = useLocalStorageValue(LIBRARY_KEY);
  const [storedScript, setStoredScript] = useLocalStorageValue(SCRIPT_KEY);
  const [storedRawScript, setStoredRawScript] = useLocalStorageValue(SCRIPT_RAW_KEY);
  const [storedWinnerName, setStoredWinnerName] = useLocalStorageValue(WINNER_NAME_KEY);

  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>({ kind: "idle" });
  const [run, setRun] = useState<Run | null>(null);
  const [regeneratingIds, setRegeneratingIds] = useState<ReadonlySet<string>>(new Set());
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const settings = useMemo(() => parseStoredSettings(storedSettings), [storedSettings]);
  const library = useMemo(() => parseStoredLibrary(storedLibrary), [storedLibrary]);
  const brandGuide = storedBrandGuide ?? "";
  const script = useMemo(() => parseStoredScript(storedScript), [storedScript]);
  const rawScript = storedRawScript ?? "";
  const winnerName = storedWinnerName ?? DEFAULT_WINNER_NAME;
  const checkedRun = useMemo<Run | null>(() => {
    if (run === null) {
      return null;
    }
    return {
      ...run,
      variants: run.variants.map((variant) => ({
        ...variant,
        flags: checkVariant(variant, library, run.original, settings.similarityThreshold),
      })),
    };
  }, [run, library, settings.similarityThreshold]);
  const hasScript = Object.values(script).some((part) => part.trim() !== "");
  const canGenerate = hasScript && settings.language.trim() !== "" && status.kind !== "loading";

  function handlePasscodeSubmit(value: string) {
    setGateMessage(null);
    setPasscode(value);
  }

  function handleUnauthorized(message: string) {
    setPasscode(null);
    setGateMessage(message);
  }

  function handleSettingsChange(next: Settings) {
    setStoredSettings(JSON.stringify(next));
  }

  function handleBrandGuideChange(next: string) {
    setStoredBrandGuide(next);
  }

  function handleLibraryChange(next: readonly LibraryItem[]) {
    setStoredLibrary(JSON.stringify(next));
  }

  function handleScriptChange(next: ScriptParts) {
    setStoredScript(JSON.stringify(next));
  }

  function handleRawScriptChange(next: string) {
    setStoredRawScript(next);
  }

  function handleWinnerNameChange(next: string) {
    setStoredWinnerName(next);
  }

  function handleDemoSelect(demo: DemoScript) {
    handleRawScriptChange(demo.raw);
    handleScriptChange(parseScript(demo.raw));
    handleWinnerNameChange(demo.name);
    handleLibraryChange(SAMPLE_LIBRARY);
    if (brandGuide.trim() === "") {
      setStoredBrandGuide(SAMPLE_BRAND_GUIDE);
    }
  }

  function handleClearAll() {
    setStoredScript(null);
    setStoredRawScript(null);
    setStoredWinnerName(null);
    setStoredLibrary(null);
    setStoredBrandGuide(null);
    setStoredSettings(null);
    setRun(null);
    setStatus({ kind: "idle" });
    setRegenerateError(null);
  }

  function buildRequestBase() {
    return { script, settings, brandGuide, library: pickTopLibrary(library) };
  }

  async function handleGenerate() {
    if (!passcode || !canGenerate) {
      return;
    }
    setStatus({ kind: "loading" });
    setRegenerateError(null);
    const result = await postGenerate(passcode, { mode: "full", ...buildRequestBase() });
    if (!result.ok) {
      if (result.status === 401) {
        handleUnauthorized(result.message);
      }
      setStatus({ kind: "error", message: result.message });
      return;
    }
    const parsed = generateResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      setStatus({ kind: "error", message: "Unexpected response from the server. Try again." });
      return;
    }
    const response = parsed.data;
    const runId = crypto.randomUUID();
    const variants = runChecks(
      [
        ...toVariants(response.hooks, "hook"),
        ...toVariants(response.firstLines, "firstLine"),
        ...toVariants(response.onScreen, "onScreen"),
      ],
      library,
      script,
      settings.similarityThreshold,
    );
    setRun({
      id: runId,
      winnerName,
      original: script,
      analysis: response.analysis,
      variants,
      usage: response.usage,
      ms: response.ms,
    });
    setStatus({ kind: "idle" });
    logEvent("generate", {
      runId,
      winner: winnerName,
      counts: settings.counts,
      usage: response.usage,
      ms: response.ms,
    });
  }

  function handleToggleSelect(variantId: string) {
    if (run === null) {
      return;
    }
    const target = run.variants.find((variant) => variant.id === variantId);
    if (target === undefined) {
      return;
    }
    setRun(updateVariant(run, variantId, (variant) => ({ ...variant, selected: !variant.selected })));
    logEvent("select", { runId: run.id, variantId, type: target.type, selected: !target.selected });
  }

  function handleTextChange(variantId: string, text: string) {
    if (run === null) {
      return;
    }
    const target = run.variants.find((variant) => variant.id === variantId);
    if (target === undefined || target.text === text) {
      return;
    }
    setRun(
      updateVariant(run, variantId, (variant) => ({
        ...variant,
        text,
        edited: true,
      })),
    );
    logEvent("edit", { runId: run.id, variantId, type: target.type });
  }

  async function handleRegenerate(variantId: string) {
    if (run === null || !passcode) {
      return;
    }
    const target = run.variants.find((variant) => variant.id === variantId);
    if (target === undefined) {
      return;
    }
    const runId = run.id;
    setRegenerateError(null);
    setRegeneratingIds((current) => new Set(current).add(variantId));
    const result = await postGenerate(passcode, {
      mode: "one",
      ...buildRequestBase(),
      script: run.original,
      one: {
        type: target.type,
        angle: target.angle,
        avoid: run.variants.filter((variant) => variant.type === target.type).map((variant) => variant.text),
      },
    });
    setRegeneratingIds((current) => {
      const next = new Set(current);
      next.delete(variantId);
      return next;
    });
    if (!result.ok) {
      if (result.status === 401) {
        handleUnauthorized(result.message);
      }
      setRegenerateError(result.message);
      return;
    }
    const parsed = generateOneResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      setRegenerateError("Unexpected response from the server. Try again.");
      return;
    }
    const { variant: generated, usage } = parsed.data;
    setRun((current) => {
      if (current === null || current.id !== runId) {
        return current;
      }
      const updated = updateVariant(current, variantId, (variant) => ({
        ...variant,
        ...generated,
        edited: false,
      }));
      return { ...updated, usage: addUsage(current.usage, usage) };
    });
    logEvent("regenerate", { runId, variantId, type: target.type, angle: target.angle });
  }

  return {
    passcode,
    gateMessage,
    script,
    rawScript,
    winnerName,
    library,
    settings,
    brandGuide,
    status,
    run: checkedRun,
    regeneratingIds,
    regenerateError,
    canGenerate,
    handlePasscodeSubmit,
    handleScriptChange,
    handleRawScriptChange,
    handleWinnerNameChange,
    handleClearAll,
    handleLibraryChange,
    handleSettingsChange,
    handleBrandGuideChange,
    handleDemoSelect,
    handleGenerate,
    handleToggleSelect,
    handleTextChange,
    handleRegenerate,
  };
}
