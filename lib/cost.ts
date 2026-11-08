import type { TokenUsage } from "@/lib/types";

export const INPUT_PRICE_PER_MILLION_USD = 2;
export const OUTPUT_PRICE_PER_MILLION_USD = 10;

const TOKENS_PER_MILLION = 1_000_000;

export function estimateCost(usage: TokenUsage): number {
  return (
    (usage.input_tokens * INPUT_PRICE_PER_MILLION_USD + usage.output_tokens * OUTPUT_PRICE_PER_MILLION_USD) /
    TOKENS_PER_MILLION
  );
}
