import Anthropic from "@anthropic-ai/sdk";
import type { TokenUsage } from "@/lib/types";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 8000;
const OVERLOAD_RETRY_DELAY_MS = 3000;
const OVERLOAD_STATUSES: ReadonlySet<number> = new Set([429, 529]);

export const INVALID_JSON_RETRY_MESSAGE = "Your previous answer was not valid JSON. Return only valid JSON.";

export type GenerationErrorStatus = 400 | 401 | 429 | 500 | 529;

export class GenerationError extends Error {
  constructor(
    readonly status: GenerationErrorStatus,
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

interface ClaudeReply {
  text: string;
  usage: TokenUsage;
}

export interface JsonGenerationRequest<T> {
  system: string;
  prompt: string;
  parse: (value: unknown) => T | null;
}

export interface JsonGenerationResult<T> {
  output: T;
  usage: TokenUsage;
}

export function resolveModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
}

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError(500, "Server is not configured: ANTHROPIC_API_KEY is missing.");
  }
  return new Anthropic({ apiKey, maxRetries: 0 });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function overloadStatus(error: unknown): 429 | 529 | null {
  if (!(error instanceof Anthropic.APIError) || error.status === undefined) {
    return null;
  }
  if (!OVERLOAD_STATUSES.has(error.status)) {
    return null;
  }
  return error.status === 529 ? 529 : 429;
}

function describeApiError(error: InstanceType<typeof Anthropic.APIError>): string {
  switch (error.status) {
    case 401:
      return "ANTHROPIC_API_KEY is invalid. Check the value in the environment variables.";
    case 403:
      return "ANTHROPIC_API_KEY has no access to this model or API.";
    case 404:
      return `Model "${resolveModel()}" was not found. Check ANTHROPIC_MODEL.`;
    case 400:
      return /credit balance/i.test(error.message)
        ? "The Anthropic account is out of credits. Top up at console.anthropic.com → Settings → Billing."
        : `Claude rejected the request: ${error.message}`;
    default:
      return `Anthropic API error (${error.status ?? "no status"}): ${error.message}`;
  }
}

function toGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationError) {
    return error;
  }
  const status = overloadStatus(error);
  if (status !== null) {
    return new GenerationError(status, "Claude is overloaded right now. Try again in a minute.");
  }
  console.error("[anthropic]", error);
  if (error instanceof Anthropic.APIConnectionError) {
    return new GenerationError(500, "Could not connect to the Anthropic API. Check the server's internet connection.");
  }
  if (error instanceof Anthropic.APIError) {
    return new GenerationError(500, describeApiError(error));
  }
  return new GenerationError(500, "Could not get a response from Claude. Try again.");
}

async function sendOnce(
  client: Anthropic,
  system: string,
  messages: readonly Anthropic.MessageParam[],
): Promise<ClaudeReply> {
  const message = await client.messages.create({
    model: resolveModel(),
    max_tokens: MAX_TOKENS,
    system,
    messages: [...messages],
  });
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  return {
    text,
    usage: { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens },
  };
}

async function callClaude(
  client: Anthropic,
  system: string,
  messages: readonly Anthropic.MessageParam[],
): Promise<ClaudeReply> {
  try {
    return await sendOnce(client, system, messages);
  } catch (error) {
    if (overloadStatus(error) === null) {
      throw toGenerationError(error);
    }
  }
  await wait(OVERLOAD_RETRY_DELAY_MS);
  try {
    return await sendOnce(client, system, messages);
  } catch (error) {
    throw toGenerationError(error);
  }
}

export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    switch (char) {
      case '"':
        inString = true;
        break;
      case "{":
        depth += 1;
        break;
      case "}":
        depth -= 1;
        if (depth === 0) {
          return text.slice(start, index + 1);
        }
        break;
    }
  }
  return null;
}

function parseReply<T>(text: string, parse: (value: unknown) => T | null): T | null {
  const block = extractFirstJsonObject(text);
  if (block === null) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(block);
  } catch {
    return null;
  }
  return parse(value);
}

function addUsage(first: TokenUsage, second: TokenUsage): TokenUsage {
  return {
    input_tokens: first.input_tokens + second.input_tokens,
    output_tokens: first.output_tokens + second.output_tokens,
  };
}

export async function generateJson<T>(request: JsonGenerationRequest<T>): Promise<JsonGenerationResult<T>> {
  const client = createClient();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: request.prompt }];

  const first = await callClaude(client, request.system, messages);
  const firstOutput = parseReply(first.text, request.parse);
  if (firstOutput !== null) {
    return { output: firstOutput, usage: first.usage };
  }

  const second = await callClaude(client, request.system, [
    ...messages,
    { role: "assistant", content: first.text.trim() || "(empty answer)" },
    { role: "user", content: INVALID_JSON_RETRY_MESSAGE },
  ]);
  const usage = addUsage(first.usage, second.usage);
  const secondOutput = parseReply(second.text, request.parse);
  if (secondOutput === null) {
    throw new GenerationError(500, "Claude returned an invalid answer twice. Try again.");
  }
  return { output: secondOutput, usage };
}
