import { rejectInvalidPasscode } from "@/lib/passcode";

export async function POST(request: Request): Promise<Response> {
  const rejection = rejectInvalidPasscode(request);
  if (rejection !== null) {
    return rejection;
  }
  return new Response(null, { status: 204 });
}
