import type { ScriptParts } from "@/lib/types";

type ScriptField = keyof ScriptParts;

const LABEL_PATTERN =
  /^[ \t]*(hook|first[ \t]+lines?|on[- \t]?screen(?:[ \t]+text)?|text[ \t]+on[ \t]+screen|body|cta)[ \t]*:/gim;

const LABEL_FIELDS: Readonly<Record<string, ScriptField>> = {
  hook: "hook",
  "first line": "firstLines",
  "first lines": "firstLines",
  "on screen": "onScreen",
  onscreen: "onScreen",
  "on screen text": "onScreen",
  "onscreen text": "onScreen",
  "text on screen": "onScreen",
  body: "body",
  cta: "cta",
};

const SENTENCE_SPLIT = /(?<=[.!?…])\s+|\n+/;
const SENTENCES_FOR_TWO_FIRST_LINES = 4;

function emptyScript(): ScriptParts {
  return { hook: "", firstLines: "", onScreen: "", body: "", cta: "" };
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[\s-]+/g, " ").trim();
}

function parseUnlabeled(text: string): ScriptParts {
  const sentences = text
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  const firstLinesCount = sentences.length >= SENTENCES_FOR_TWO_FIRST_LINES ? 2 : 1;
  return {
    ...emptyScript(),
    hook: sentences[0] ?? "",
    firstLines: sentences.slice(1, 1 + firstLinesCount).join(" "),
    body: sentences.slice(1 + firstLinesCount).join(" "),
  };
}

export function parseScript(raw: string): ScriptParts {
  const text = raw.replace(/\r\n?/g, "\n").trim();
  const matches = [...text.matchAll(LABEL_PATTERN)];
  if (matches.length === 0) {
    return parseUnlabeled(text);
  }

  const parts = emptyScript();
  matches.forEach((match, index) => {
    const field = LABEL_FIELDS[normalizeLabel(match[1] ?? "")] ?? "body";
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const value = text.slice(start, end).trim();
    parts[field] = parts[field] === "" ? value : `${parts[field]}\n${value}`;
  });
  return parts;
}
