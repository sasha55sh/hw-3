import { GenerationError, generateJson } from "@/lib/anthropic";
import { errorResponse, rejectInvalidPasscode } from "@/lib/passcode";
import { buildOnePrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { generateRequestSchema, parseModelOutput, parseOneModelOutput } from "@/lib/schema";
import type { GenerateOneResponse, GenerateResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  const rejection = rejectInvalidPasscode(request);
  if (rejection !== null) {
    return rejection;
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
