"use client";

import { useState, type ChangeEvent } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button, Card, buttonClassName, inputClassName, labelClassName, textareaClassName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { parseScript } from "@/lib/parseScript";
import { DEMO_SCRIPTS, type DemoScript } from "@/lib/sampleData";
import type { ScriptParts } from "@/lib/types";

interface PartField {
  key: keyof ScriptParts;
  label: string;
}

const PART_FIELDS: readonly PartField[] = [
  { key: "hook", label: "Hook" },
  { key: "firstLines", label: "First lines" },
  { key: "onScreen", label: "On-screen" },
  { key: "body", label: "Body" },
  { key: "cta", label: "CTA" },
];

interface ScriptInputProps {
  script: ScriptParts;
  rawScript: string;
  winnerName: string;
  onScriptChange: (script: ScriptParts) => void;
  onRawScriptChange: (raw: string) => void;
  onWinnerNameChange: (name: string) => void;
  onDemoSelect: (demo: DemoScript) => void;
  onClearAll: () => void;
}

export function ScriptInput({
  script,
  rawScript: raw,
  winnerName,
  onScriptChange,
  onRawScriptChange: setRaw,
  onWinnerNameChange,
  onDemoSelect,
  onClearAll,
}: ScriptInputProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  function handleClearConfirm() {
    setIsClearDialogOpen(false);
    setFileError(null);
    onClearAll();
  }

  function handleParse() {
    onScriptChange(parseScript(raw));
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    try {
      const text = await file.text();
      setRaw(text);
      setFileError(null);
      onScriptChange(parseScript(text));
      onWinnerNameChange(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setFileError("Could not read the file. Try a plain .txt file.");
    }
  }

  function handleDemoChange(event: ChangeEvent<HTMLSelectElement>) {
    const demo = DEMO_SCRIPTS.find((candidate) => candidate.id === event.target.value);
    if (demo === undefined) {
      return;
    }
    setFileError(null);
    onDemoSelect(demo);
  }

  function handlePartChange(key: keyof ScriptParts, value: string) {
    onScriptChange({ ...script, [key]: value });
  }

  return (
    <Card aria-labelledby="script-heading" className="flex flex-col gap-4">
      <h2 id="script-heading" className="text-base font-semibold text-ink">
        1. Winning script
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="script-raw" className={labelClassName}>
          Full script
        </label>
        <textarea
          id="script-raw"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={"HOOK: ...\nFIRST LINES: ...\nON-SCREEN: ...\nBODY: ...\nCTA: ..."}
          className={cn(textareaClassName, "min-h-32")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleParse} disabled={raw.trim() === ""}>
          Parse
        </Button>
        <label className={cn(buttonClassName(), "cursor-pointer")}>
          Upload .txt
          <input type="file" accept=".txt,text/plain" onChange={handleFileChange} className="sr-only" />
        </label>
        <label htmlFor="demo-select" className="sr-only">
          Load a demo script
        </label>
        <select id="demo-select" value="" onChange={handleDemoChange} className={cn(buttonClassName(), "cursor-pointer")}>
          <option value="" disabled>
            Demo script
          </option>
          {DEMO_SCRIPTS.map((demo) => (
            <option key={demo.id} value={demo.id}>
              {demo.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          onClick={() => setIsClearDialogOpen(true)}
          aria-haspopup="dialog"
          className="ml-auto hover:text-flag-red"
        >
          Clear all
        </Button>
      </div>
      <ConfirmDialog
        open={isClearDialogOpen}
        title="Clear everything?"
        confirmLabel="Clear all"
        onConfirm={handleClearConfirm}
        onCancel={() => setIsClearDialogOpen(false)}
      >
        <p>This removes the winning script, tested hooks library and brand guide, resets settings to defaults and clears the results.</p>
        <p className="text-ink">The pilot log and passcode are kept.</p>
      </ConfirmDialog>
      {fileError && (
        <p role="alert" className="text-sm text-flag-red">
          {fileError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="winner-name" className={labelClassName}>
          Winner name
        </label>
        <input
          id="winner-name"
          value={winnerName}
          onChange={(event) => onWinnerNameChange(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        {PART_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label htmlFor={`part-${field.key}`} className={labelClassName}>
              {field.label}
            </label>
            <textarea
              id={`part-${field.key}`}
              value={script[field.key]}
              onChange={(event) => handlePartChange(field.key, event.target.value)}
              className={textareaClassName}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
