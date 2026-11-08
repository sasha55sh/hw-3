"use client";

import { useState, type ChangeEvent } from "react";
import { Card, buttonClassName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { parseCSV } from "@/lib/csv";
import { loadLibrary } from "@/lib/library";
import type { LibraryItem } from "@/lib/types";

interface LibraryUploadProps {
  library: readonly LibraryItem[];
  onLibraryChange: (library: readonly LibraryItem[]) => void;
}

export function LibraryUpload({ library, onLibraryChange }: LibraryUploadProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    try {
      const items = loadLibrary(parseCSV(await file.text()).rows);
      if (items.length === 0) {
        setError("No hooks found. The CSV needs a hook, text or headline column.");
        return;
      }
      setError(null);
      onLibraryChange(items);
    } catch {
      setError("Could not read the CSV file.");
    }
  }

  const status =
    library.length > 0
      ? { className: "text-ok", label: `${library.length} ✓` }
      : { className: "text-ink-muted", label: "none" };

  return (
    <Card aria-labelledby="library-heading" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="library-heading" className="text-base font-semibold text-ink">
          2. Tested hooks library: <span className={status.className}>{status.label}</span>
        </h2>
        <label className={cn(buttonClassName(), "cursor-pointer")}>
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="sr-only" />
        </label>
      </div>
      <p className="text-xs text-ink-muted">
        Variants too close to these hooks get a yellow flag. Winners and the highest ROMI are sent to the model first.
      </p>
      {error && (
        <p role="alert" className="text-sm text-flag-red">
          {error}
        </p>
      )}
    </Card>
  );
}
