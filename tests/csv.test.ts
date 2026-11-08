import { describe, expect, it } from "vitest";
import { parseCSV, toCSV } from "@/lib/csv";
import { SAMPLE_TESTED_HOOKS_CSV } from "@/lib/sampleData";

describe("parseCSV", () => {
  it("parses headers and rows", () => {
    expect(parseCSV("hook,angle\nA,pain\nB,humor")).toEqual({
      headers: ["hook", "angle"],
      rows: [
        { hook: "A", angle: "pain" },
        { hook: "B", angle: "humor" },
      ],
    });
  });

  it("keeps commas, escaped quotes and newlines inside quoted fields", () => {
    const { rows } = parseCSV('hook,angle\n"Socks, but better","say ""hi"""\n"two\nlines",x');
    expect(rows).toEqual([
      { hook: "Socks, but better", angle: 'say "hi"' },
      { hook: "two\nlines", angle: "x" },
    ]);
  });

  it("handles CRLF line endings and a UTF-8 BOM", () => {
    const { headers, rows } = parseCSV("﻿hook,angle\r\nA,pain\r\n");
    expect(headers).toEqual(["hook", "angle"]);
    expect(rows).toEqual([{ hook: "A", angle: "pain" }]);
  });

  it("detects a semicolon delimiter", () => {
    const { headers, rows } = parseCSV("hook;romi\nSocks, finally;1,5");
    expect(headers).toEqual(["hook", "romi"]);
    expect(rows).toEqual([{ hook: "Socks, finally", romi: "1,5" }]);
  });

  it("skips blank lines and fills missing cells with empty strings", () => {
    const { rows } = parseCSV("hook,angle,result\n\nA,pain\n   \n");
    expect(rows).toEqual([{ hook: "A", angle: "pain", result: "" }]);
  });

  it("returns empty results for empty input", () => {
    expect(parseCSV("")).toEqual({ headers: [], rows: [] });
  });

  it("parses the sample tested hooks file", () => {
    const { headers, rows } = parseCSV(SAMPLE_TESTED_HOOKS_CSV);
    expect(headers).toEqual(["hook", "angle", "result"]);
    expect(rows).toHaveLength(30);
    expect(rows.find((row) => row.hook === "Socks, but they never break up.")).toBeUndefined();
    expect(rows.some((row) => row.hook === "Laundry day, minus the sock hunt.")).toBe(true);
  });
});

describe("toCSV", () => {
  it("quotes values containing delimiters, quotes or newlines", () => {
    const csv = toCSV(["a", "b"], [{ a: 'say "hi", ok', b: "line\nbreak" }]);
    expect(csv).toBe('a,b\r\n"say ""hi"", ok","line\nbreak"');
  });

  it("writes empty strings for missing values", () => {
    expect(toCSV(["a", "b"], [{ a: "1" }])).toBe("a,b\r\n1,");
  });

  it("round-trips through parseCSV without shifting columns", () => {
    const rows = [
      { run_id: "r1", text: "Socks, but magnetic", flags: "too_long|policy_risk" },
      { run_id: "r1", text: 'He said "click"\nand left', flags: "" },
    ];
    const headers = ["run_id", "text", "flags"];
    expect(parseCSV(toCSV(headers, rows))).toEqual({ headers, rows });
  });
});
