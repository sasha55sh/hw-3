import type { Angle, LibraryItem, ScriptParts, Settings, VariantType } from "@/lib/types";

const SYSTEM_PROMPT_TEMPLATE = `You are a senior direct-response copywriter for Meta video ads.
Brand: SockLock — magnetic socks that never get lost in the laundry. A tiny magnet on the cuffs keeps each pair together.
Offer: subscription, 5 pairs for $29, then a new drop every quarter. Market: USA. Traffic: Meta (Reels/Feed), mostly mobile.

Your job: create MODIFICATIONS of a proven winning ad script. Keep the core idea and product truth of the winner; vary the words that grab attention in the first 3 seconds.

BRAND GUIDE:
{{brandGuide}}

RULES:
- Hooks: max 12 words, spoken in the first 3 seconds, concrete and visual.
- First lines: 1–2 sentences that continue the hook naturally into the winner's body.
- On-screen text: max 40 characters, readable without sound.
- Every variant must be meaningfully different from the original and from each other.
- Do not invent product facts, prices, discounts, reviews or statistics not given above.
- Meta policy: do not assert or imply personal attributes ("Are you…", "your weight/age/health"), no health claims, no guarantees, no fake scarcity, no before/after.
- Write in {{language}}.

ANGLES (tag every variant with exactly one):
pain, curiosity, social_proof, contrarian, specific_number, humor, demo, identity, urgency_soft

ALREADY TESTED — do not repeat or closely paraphrase:
{{libraryList}}

Return ONLY valid JSON, no markdown, matching:
{
  "analysis": {"winning_mechanism": "1 sentence: why the original works", "keep": ["elements to keep"]},
  "hooks":      [{"text": "...", "angle": "...", "rationale": "≤12 words"}],
  "firstLines": [{"text": "...", "angle": "...", "rationale": "≤12 words"}],
  "onScreen":   [{"text": "...", "angle": "...", "rationale": "≤12 words"}]
}`;

const SCRIPT_TEMPLATE = `WINNING SCRIPT
Hook: {{hook}}
First lines: {{firstLines}}
On-screen text: {{onScreen}}
Body: {{body}}
CTA: {{cta}}`;

const USER_PROMPT_TEMPLATE = `{{script}}

Generate {{nHooks}} hooks, {{nFirst}} first lines, {{nOnScreen}} on-screen texts.
Use only these angles, spread evenly: {{angles}}.`;

const ONE_PROMPT_TEMPLATE = `{{script}}

Generate exactly 1 new {{type}} with angle "{{angle}}" for the winning script above.
It must differ from all of these: {{avoid}}.
For this request, ignore the JSON format from the system prompt and do not include "analysis".
Return ONLY JSON: {"text": "...", "angle": "{{angle}}", "rationale": "..."}`;

const VARIANT_TYPE_NAMES: Readonly<Record<VariantType, string>> = {
  hook: "hook",
  firstLine: "first line",
  onScreen: "on-screen text",
};

const EMPTY_VALUE = "(none)";

function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => values[key] ?? placeholder);
}

function orNone(value: string): string {
  return value.trim() || EMPTY_VALUE;
}

function formatLibrary(library: readonly LibraryItem[]): string {
  if (library.length === 0) {
    return EMPTY_VALUE;
  }
  return library
    .map((item) => {
      const details = [item.angle, item.result].filter((detail) => detail !== undefined && detail !== "");
      return details.length === 0 ? `- ${item.hook}` : `- ${item.hook} (${details.join(", ")})`;
    })
    .join("\n");
}

function formatScript(script: ScriptParts): string {
  return fillTemplate(SCRIPT_TEMPLATE, {
    hook: orNone(script.hook),
    firstLines: orNone(script.firstLines),
    onScreen: orNone(script.onScreen),
    body: orNone(script.body),
    cta: orNone(script.cta),
  });
}

function formatAvoid(avoid: readonly string[]): string {
  if (avoid.length === 0) {
    return EMPTY_VALUE;
  }
  return avoid.map((text) => `"${text}"`).join("; ");
}

export function buildSystemPrompt(brandGuide: string, library: readonly LibraryItem[], language: string): string {
  return fillTemplate(SYSTEM_PROMPT_TEMPLATE, {
    brandGuide: orNone(brandGuide),
    language,
    libraryList: formatLibrary(library),
  });
}

export function buildUserPrompt(script: ScriptParts, settings: Settings): string {
  return fillTemplate(USER_PROMPT_TEMPLATE, {
    script: formatScript(script),
    nHooks: String(settings.counts.hooks),
    nFirst: String(settings.counts.firstLines),
    nOnScreen: String(settings.counts.onScreen),
    angles: settings.angles.join(", "),
  });
}

export function buildOnePrompt(
  script: ScriptParts,
  type: VariantType,
  angle: Angle,
  avoid: readonly string[],
): string {
  return fillTemplate(ONE_PROMPT_TEMPLATE, {
    script: formatScript(script),
    type: VARIANT_TYPE_NAMES[type],
    angle,
    avoid: formatAvoid(avoid),
  });
}
