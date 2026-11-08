export type CsvDelimiter = "," | ";";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

const BOM = "﻿";

function detectDelimiter(text: string): CsvDelimiter {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) {
      continue;
    }
    if (char === "\n") {
      break;
    }
    if (char === ",") {
      commas += 1;
    } else if (char === ";") {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ";" : ",";
}

function parseRecords(text: string, delimiter: CsvDelimiter): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char !== '"') {
        field += char;
      } else if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = false;
      }
      continue;
    }
    switch (char) {
      case '"':
        inQuotes = true;
        break;
      case delimiter:
        record.push(field);
        field = "";
        break;
      case "\n":
        record.push(field);
        records.push(record);
        record = [];
        field = "";
        break;
      default:
        field += char;
    }
  }

  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

export function parseCSV(text: string): ParsedCsv {
  const normalized = (text.startsWith(BOM) ? text.slice(BOM.length) : text).replace(/\r\n?/g, "\n");
  const records = parseRecords(normalized, detectDelimiter(normalized)).filter((record) =>
    record.some((value) => value.trim() !== ""),
  );
  const [headerRecord, ...dataRecords] = records;
  if (headerRecord === undefined) {
    return { headers: [], rows: [] };
  }
  const headers = headerRecord.map((header) => header.trim());
  const rows = dataRecords.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, (record[index] ?? "").trim()])),
  );
  return { headers, rows };
}

function escapeCsvValue(value: string): string {
  return /[",;\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCSV(headers: readonly string[], rows: readonly Readonly<Record<string, string>>[]): string {
  const lines = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  return lines.map((line) => line.map(escapeCsvValue).join(",")).join("\r\n");
}
