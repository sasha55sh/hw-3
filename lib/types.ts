export type Angle =
  | "pain"
  | "curiosity"
  | "social_proof"
  | "contrarian"
  | "specific_number"
  | "humor"
  | "demo"
  | "identity"
  | "urgency_soft";

export type VariantType = "hook" | "firstLine" | "onScreen";

export interface ScriptParts {
  hook: string;
  firstLines: string;
  onScreen: string;
  body: string;
  cta: string;
}

export interface LibraryItem {
  hook: string;
  angle?: string;
  result?: string;
}

export type FlagKind = "similar_tested" | "near_copy" | "too_long" | "policy_risk";

export interface Flag {
  kind: FlagKind;
  message: string;
  score?: number;
  match?: string;
}

export interface Variant {
  id: string;
  type: VariantType;
  text: string;
  angle: Angle;
  rationale: string;
  flags: Flag[];
  selected: boolean;
  edited: boolean;
}

export type GeneratedVariant = Omit<Variant, "id" | "type" | "flags" | "selected" | "edited">;

export interface Settings {
  language: string;
  counts: { hooks: number; firstLines: number; onScreen: number };
  angles: Angle[];
  similarityThreshold: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface GenerateResponse {
  analysis: { winning_mechanism: string; keep: string[] };
  hooks: GeneratedVariant[];
  firstLines: GeneratedVariant[];
  onScreen: GeneratedVariant[];
  usage: TokenUsage;
  ms: number;
}

export type ModelOutput = Omit<GenerateResponse, "usage" | "ms">;

export interface GenerateOneResponse {
  variant: GeneratedVariant;
  usage: TokenUsage;
  ms: number;
}

export interface HealthResponse {
  ok: boolean;
  model: string;
  keyConfigured: boolean;
}

export interface GenerateErrorResponse {
  error: string;
}
