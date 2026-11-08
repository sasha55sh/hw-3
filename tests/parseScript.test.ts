import { describe, expect, it } from "vitest";
import { parseScript } from "@/lib/parseScript";
import { DEMO_SCRIPTS } from "@/lib/sampleData";

describe("parseScript with labels", () => {
  it("splits a labeled script into five parts", () => {
    const result = parseScript(`HOOK: Hook text.
FIRST LINES: First lines text.
ON-SCREEN: Screen text
BODY: Body text.
CTA: Buy now.`);
    expect(result).toEqual({
      hook: "Hook text.",
      firstLines: "First lines text.",
      onScreen: "Screen text",
      body: "Body text.",
      cta: "Buy now.",
    });
  });

  it("matches labels case-insensitively and accepts TEXT ON SCREEN", () => {
    const result = parseScript("hook: a\nFirst Lines: b\ntext on screen: c\nbody: d\ncta: e");
    expect(result).toEqual({ hook: "a", firstLines: "b", onScreen: "c", body: "d", cta: "e" });
  });

  it("keeps multi-line sections and handles Windows line endings", () => {
    const result = parseScript("HOOK: a\r\nBODY: line one\r\nline two\r\nCTA: c");
    expect(result.body).toBe("line one\nline two");
    expect(result.cta).toBe("c");
  });

  it("leaves missing sections empty", () => {
    const result = parseScript("HOOK: only a hook");
    expect(result).toEqual({ hook: "only a hook", firstLines: "", onScreen: "", body: "", cta: "" });
  });

  it("does not treat a label inside a sentence as a section", () => {
    expect(parseScript("HOOK: The best hook: socks.").hook).toBe("The best hook: socks.");
  });

  it.each(DEMO_SCRIPTS.map((demo) => [demo.id, demo.raw]))("parses demo %s into non-empty parts", (_id, raw) => {
    const result = parseScript(raw);
    expect(Object.values(result).every((part) => part.length > 0)).toBe(true);
  });
});

describe("parseScript without labels", () => {
  it("uses the first sentence as the hook, the next one as first lines and the rest as body", () => {
    const result = parseScript("Socks vanish. Every load. Magnets fix it.");
    expect(result).toEqual({
      hook: "Socks vanish.",
      firstLines: "Every load.",
      onScreen: "",
      body: "Magnets fix it.",
      cta: "",
    });
  });

  it("takes two sentences of first lines when the script is long enough", () => {
    const result = parseScript("One. Two. Three. Four. Five.");
    expect(result.hook).toBe("One.");
    expect(result.firstLines).toBe("Two. Three.");
    expect(result.body).toBe("Four. Five.");
  });

  it("returns empty parts for empty input", () => {
    expect(parseScript("   ")).toEqual({ hook: "", firstLines: "", onScreen: "", body: "", cta: "" });
  });
});
