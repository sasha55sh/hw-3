import { LIBRARY_MAX_ITEMS } from "@/lib/schema";
import type { LibraryItem } from "@/lib/types";

const HOOK_COLUMNS = ["hook", "text", "headline"] as const;
const ANGLE_COLUMNS = ["angle", "type"] as const;
const RESULT_COLUMNS = ["result", "romi", "roas", "status"] as const;
const RESULT_SEPARATOR = " | ";
const WINNER_PATTERN = /\bwin(ner)?\b/i;
const NUMBER_PATTERN = /-?\d+(?:[.,]\d+)?/;

function findColumns(headers: readonly string[], candidates: readonly string[]): string[] {
  return candidates.flatMap((candidate) =>
    headers.filter((header) => header.trim().toLowerCase() === candidate),
  );
}

function cell(row: Readonly<Record<string, string>>, column: string): string {
  return (row[column] ?? "").trim();
}

export function loadLibrary(rows: readonly Readonly<Record<string, string>>[]): LibraryItem[] {
  const firstRow = rows[0];
  if (firstRow === undefined) {
    return [];
  }
  const headers = Object.keys(firstRow);
  const hookColumn = findColumns(headers, HOOK_COLUMNS)[0] ?? headers[0];
  if (hookColumn === undefined) {
    return [];
  }
  const angleColumn = findColumns(headers, ANGLE_COLUMNS)[0];
  const resultColumns = findColumns(headers, RESULT_COLUMNS);

  return rows.flatMap((row) => {
    const hook = cell(row, hookColumn);
    if (hook === "") {
      return [];
    }
    const item: LibraryItem = { hook };
    const angle = angleColumn === undefined ? "" : cell(row, angleColumn);
    if (angle !== "") {
      item.angle = angle;
    }
    const result = resultColumns
      .map((column) => cell(row, column))
      .filter((value) => value !== "")
      .join(RESULT_SEPARATOR);
    if (result !== "") {
      item.result = result;
    }
    return [item];
  });
}

function isWinner(result: string | undefined): boolean {
  return result !== undefined && WINNER_PATTERN.test(result);
}

function numericResult(result: string | undefined): number {
  const match = result?.match(NUMBER_PATTERN);
  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }
  return Number(match[0].replace(",", "."));
}

export function pickTopLibrary(items: readonly LibraryItem[], n: number = LIBRARY_MAX_ITEMS): LibraryItem[] {
  return items
    .map((item, index) => ({ item, index, winner: isWinner(item.result), score: numericResult(item.result) }))
    .sort((a, b) => {
      if (a.winner !== b.winner) {
        return a.winner ? -1 : 1;
      }
      if (a.score !== b.score) {
        return b.score > a.score ? 1 : -1;
      }
      return a.index - b.index;
    })
    .slice(0, n)
    .map((ranked) => ranked.item);
}
