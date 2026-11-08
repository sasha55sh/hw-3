import { z } from "zod";
import type {
  Angle,
  GenerateErrorResponse,
  GenerateOneResponse,
  GenerateResponse,
  GeneratedVariant,
  HealthResponse,
  LibraryItem,
  ModelOutput,
  ScriptParts,
  Settings,
  TokenUsage,
  VariantType,
} from "@/lib/types";

export const BRAND_GUIDE_MAX_LENGTH = 8000;
export const LIBRARY_MAX_ITEMS = 40;
export const VARIANT_COUNT_MAX = 30;

export const angleSchema = z.enum([
  "pain",
  "curiosity",
  "social_proof",
  "contrarian",
  "specific_number",
  "humor",
  "demo",
  "identity",
  "urgency_soft",
]) satisfies z.ZodType<Angle>;

export const ALL_ANGLES: readonly Angle[] = angleSchema.options;

export const variantTypeSchema =z.enum(["hook", "firstLine", "onScreen"]) satisfies z.ZodType<VariantType>;

export const scriptPartsSchema = z.object({
  hook: z.string(),
  firstLines: z.string(),
  onScreen: z.string(),
  body: z.string(),
  cta: z.string(),
}) satisfies z.ZodType<ScriptParts>;

const variantCountSchema = z.number().int().min(1).max(VARIANT_COUNT_MAX);

export const settingsSchema = z.object({
  language: z.string().min(1),
  counts: z.object({
    hooks: variantCountSchema,
    firstLines: variantCountSchema,
    onScreen: variantCountSchema,
  }),
  angles: z.array(angleSchema).min(1),
  similarityThreshold: z.number().min(0).max(1),
}) satisfies z.ZodType<Settings>;

export const DEFAULT_SETTINGS: Settings = {
  language: "English",
  counts: { hooks: 15, firstLines: 10, onScreen: 10 },
  angles: [...ALL_ANGLES],
  similarityThreshold: 0.6,
};

export const libraryItemSchema =z.object({
  hook: z.string(),
  angle: z.string().optional(),
  result: z.string().optional(),
}) satisfies z.ZodType<LibraryItem>;

const requestBaseSchema = z.object({
  script: scriptPartsSchema,
  settings: settingsSchema,
  brandGuide: z.string().max(BRAND_GUIDE_MAX_LENGTH),
  library: z.array(libraryItemSchema).max(LIBRARY_MAX_ITEMS),
});

export const generateRequestSchema = z.discriminatedUnion("mode", [
  requestBaseSchema.extend({ mode: z.literal("full") }),
  requestBaseSchema.extend({
    mode: z.literal("one"),
    one: z.object({
      type: variantTypeSchema,
      angle: angleSchema,
      avoid: z.array(z.string()),
    }),
  }),
]);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

const generatedVariantSchema = z.object({
  text: z.string(),
  angle: angleSchema,
  rationale: z.string(),
}) satisfies z.ZodType<GeneratedVariant>;

const tokenUsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
}) satisfies z.ZodType<TokenUsage>;

export const generateResponseSchema = z.object({
  analysis: z.object({ winning_mechanism: z.string(), keep: z.array(z.string()) }),
  hooks: z.array(generatedVariantSchema),
  firstLines: z.array(generatedVariantSchema),
  onScreen: z.array(generatedVariantSchema),
  usage: tokenUsageSchema,
  ms: z.number(),
}) satisfies z.ZodType<GenerateResponse>;

export const generateOneResponseSchema = z.object({
  variant: generatedVariantSchema,
  usage: tokenUsageSchema,
  ms: z.number(),
}) satisfies z.ZodType<GenerateOneResponse>;

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  model: z.string(),
  keyConfigured: z.boolean(),
}) satisfies z.ZodType<HealthResponse>;

export const errorResponseSchema = z.object({
  error: z.string(),
}) satisfies z.ZodType<GenerateErrorResponse>;

const ANGLE_MIN_MATCH_LENGTH = 3;

const rawVariantSchema = z.object({
  text: z.string().trim().min(1),
  angle: z.string(),
  rationale: z.string(),
});

type RawVariant = z.infer<typeof rawVariantSchema>;

export const modelOutputSchema = z.object({
  analysis: z.object({
    winning_mechanism: z.string(),
    keep: z.array(z.string()),
  }),
  hooks: z.array(rawVariantSchema),
  firstLines: z.array(rawVariantSchema),
  onScreen: z.array(rawVariantSchema),
});

export const oneModelOutputSchema = rawVariantSchema;

export function resolveAngle(raw: string, allowed: readonly Angle[]): Angle | null {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized.length < ANGLE_MIN_MATCH_LENGTH) {
    return null;
  }
  const exact = allowed.find((angle) => angle === normalized);
  if (exact) {
    return exact;
  }
  return allowed.find((angle) => angle.includes(normalized) || normalized.includes(angle)) ?? null;
}

function resolveVariants(variants: readonly RawVariant[], allowed: readonly Angle[]): GeneratedVariant[] {
  return variants.flatMap((variant) => {
    const angle = resolveAngle(variant.angle, allowed);
    return angle === null ? [] : [{ text: variant.text, angle, rationale: variant.rationale }];
  });
}

export function parseModelOutput(value: unknown, allowed: readonly Angle[]): ModelOutput | null {
  const parsed = modelOutputSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return {
    analysis: parsed.data.analysis,
    hooks: resolveVariants(parsed.data.hooks, allowed),
    firstLines: resolveVariants(parsed.data.firstLines, allowed),
    onScreen: resolveVariants(parsed.data.onScreen, allowed),
  };
}

const FULL_OUTPUT_LISTS: Readonly<Record<VariantType, "hooks" | "firstLines" | "onScreen">> = {
  hook: "hooks",
  firstLine: "firstLines",
  onScreen: "onScreen",
};

const partialFullOutputSchema = z.object({
  hooks: z.array(rawVariantSchema).optional(),
  firstLines: z.array(rawVariantSchema).optional(),
  onScreen: z.array(rawVariantSchema).optional(),
});

function findOneVariant(value: unknown, requestedType: VariantType): RawVariant | null {
  const flat = oneModelOutputSchema.safeParse(value);
  if (flat.success) {
    return flat.data;
  }
  const full = partialFullOutputSchema.safeParse(value);
  if (!full.success) {
    return null;
  }
  return full.data[FULL_OUTPUT_LISTS[requestedType]]?.[0] ?? null;
}

export function parseOneModelOutput(
  value: unknown,
  requestedType: VariantType,
  requestedAngle: Angle,
): GeneratedVariant | null {
  const variant = findOneVariant(value, requestedType);
  if (variant === null) {
    return null;
  }
  return { text: variant.text, angle: requestedAngle, rationale: variant.rationale };
}
