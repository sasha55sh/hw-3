"use client";

import { AnalysisCard } from "@/components/AnalysisCard";
import { ExportBar } from "@/components/ExportBar";
import { GenerateButton } from "@/components/GenerateButton";
import { HealthStatus } from "@/components/HealthStatus";
import { LibraryUpload } from "@/components/LibraryUpload";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PasscodeGate } from "@/components/PasscodeGate";
import { ResultsTabs } from "@/components/ResultsTabs";
import { ScriptInput } from "@/components/ScriptInput";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useHookLab } from "@/lib/useHookLab";

export default function Home() {
  const lab = useHookLab();

  if (lab.passcode === undefined) {
    return null;
  }
  if (lab.passcode === null) {
    return <PasscodeGate message={lab.gateMessage} onSubmit={lab.handlePasscodeSubmit} />;
  }

  return (
    <MaxWidthWrapper className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h1 className="font-playwrite text-2xl text-ink">Hook Lab</h1>
        <HealthStatus />
      </header>

      <main className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-label="Input" className="flex flex-col gap-4">
          <ScriptInput
            script={lab.script}
            winnerName={lab.winnerName}
            onScriptChange={lab.handleScriptChange}
            onWinnerNameChange={lab.handleWinnerNameChange}
            onDemoSelect={lab.handleDemoSelect}
          />
          <LibraryUpload library={lab.library} onLibraryChange={lab.handleLibraryChange} />
          <SettingsPanel
            settings={lab.settings}
            brandGuide={lab.brandGuide}
            onSettingsChange={lab.handleSettingsChange}
            onBrandGuideChange={lab.handleBrandGuideChange}
          />
          <GenerateButton
            isLoading={lab.status.kind === "loading"}
            disabled={!lab.canGenerate}
            onGenerate={lab.handleGenerate}
          />
          {lab.status.kind === "error" && (
            <p role="alert" className="rounded-lg border border-flag-red p-3 text-sm text-flag-red">
              {lab.status.message}
            </p>
          )}
        </section>

        <section aria-label="Results" className="flex flex-col gap-4">
          {lab.run === null ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-muted">
              Paste a winning script or pick a demo, then press Generate variants. Results appear here.
            </p>
          ) : (
            <>
              <AnalysisCard analysis={lab.run.analysis} />
              {lab.regenerateError && (
                <p role="alert" className="rounded-lg border border-flag-red p-3 text-sm text-flag-red">
                  {lab.regenerateError}
                </p>
              )}
              <ResultsTabs
                variants={lab.run.variants}
                regeneratingIds={lab.regeneratingIds}
                onToggleSelect={lab.handleToggleSelect}
                onTextChange={lab.handleTextChange}
                onRegenerate={lab.handleRegenerate}
              />
              <ExportBar run={lab.run} />
            </>
          )}
        </section>
      </main>
    </MaxWidthWrapper>
  );
}
