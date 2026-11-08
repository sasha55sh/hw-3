import { Card } from "@/components/ui";
import type { ModelOutput } from "@/lib/types";

interface AnalysisCardProps {
  analysis: ModelOutput["analysis"];
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <Card aria-labelledby="analysis-heading" className="flex flex-col gap-2">
      <h2 id="analysis-heading" className="text-sm font-semibold text-ink-muted">
        Why the original works
      </h2>
      <p className="text-ink">«{analysis.winning_mechanism}»</p>
      {analysis.keep.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Elements to keep">
          {analysis.keep.map((element) => (
            <li key={element} className="rounded-full border border-line px-3 py-1 text-xs text-ink-muted">
              {element}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
