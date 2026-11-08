import { connection } from "next/server";
import { resolveModel } from "@/lib/anthropic";
import type { HealthResponse } from "@/lib/types";

export async function GET(): Promise<Response> {
  await connection();
  const keyConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const passcodeConfigured = Boolean(process.env.APP_PASSCODE);
  const body: HealthResponse = {
    ok: keyConfigured && passcodeConfigured,
    model: resolveModel(),
    keyConfigured,
  };
  return Response.json(body);
}
