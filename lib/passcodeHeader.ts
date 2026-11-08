export const PASSCODE_HEADER = "x-app-passcode";

export function passcodeHeaders(passcode: string): Record<string, string> {
  return { [PASSCODE_HEADER]: encodeURIComponent(passcode) };
}

export function decodePasscodeHeader(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
