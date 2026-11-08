import { createHash, timingSafeEqual } from "node:crypto";
import { PASSCODE_HEADER, decodePasscodeHeader } from "@/lib/passcodeHeader";
import type { GenerateErrorResponse } from "@/lib/types";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function errorResponse(status: number, error: string): Response {
  const body: GenerateErrorResponse = { error };
  return Response.json(body, { status });
}

export function rejectInvalidPasscode(request: Request): Response | null {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    return errorResponse(500, "Server is not configured: APP_PASSCODE is missing.");
  }
  const received = decodePasscodeHeader(request.headers.get(PASSCODE_HEADER));
  if (received === null || !timingSafeEqual(sha256(received), sha256(expected))) {
    return errorResponse(401, "Invalid passcode.");
  }
  return null;
}
