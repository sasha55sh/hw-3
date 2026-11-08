import { createHash, timingSafeEqual } from "node:crypto";
import { GenerationError, generateJson } from "@/lib/anthropic";
import { buildOnePrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { generateRequestSchema, parseModelOutput, parseOneModelOutput } from "@/lib/schema";
import type { GenerateErrorResponse, GenerateOneResponse, GenerateResponse } from "@/lib/types";

export const maxDuration = 60;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function isPasscodeValid(received: string | null, expected: string): boolean {
  if (received === null) {
    return false;
  }
  return timingSafeEqual(sha256(received), sha256(expected));
}

function errorResponse(status: number, error: string): Response {
  const body: GenerateErrorResponse = { error };
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  const expectedPasscode = process.env.APP_PASSCODE;
  if (!expectedPasscode) {
    return errorResponse(500, "Server is not configured: APP_PASSCODE is missing.");
  }
  if (!isPasscodeValid(request.headers.get("x-app-passcode"), expectedPasscode)) {
    return errorResponse(401, "Invalid passcode.");
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  const parsed = generateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".") || "(root)").join(", ");
    return errorResponse(400, `Invalid request data: ${fields}.`);
  }

  const input = parsed.data;
  const system = buildSystemPrompt(input.brandGuide, input.library, input.settings.language);

  try {
    switch (input.mode) {
      case "full": {
        const { output, usage } = await generateJson({
          system,
          prompt: buildUserPrompt(input.script, input.settings),
          parse: (value) => parseModelOutput(value, input.settings.angles),
        });
        const body: GenerateResponse = { ...output, usage, ms: Date.now() - startedAt };
        return Response.json(body);
      }
      case "one": {
        const { output, usage } = await generateJson({
          system,
          prompt: buildOnePrompt(input.script, input.one.type, input.one.angle, input.one.avoid),
          parse: (value) => parseOneModelOutput(value, input.one.type, input.one.angle),
        });
        const body: GenerateOneResponse = { variant: output, usage, ms: Date.now() - startedAt };
        return Response.json(body);
      }
    }
  } catch (error) {
    if (error instanceof GenerationError) {
      return errorResponse(error.status, error.message);
    }
    return errorResponse(500, "Unexpected server error. Try again.");
  }
}
