"use client";

import { useState, type FormEvent } from "react";
import { Button, inputClassName, labelClassName } from "@/components/ui";
import { passcodeHeaders } from "@/lib/passcodeHeader";
import { errorResponseSchema } from "@/lib/schema";

interface PasscodeGateProps {
  message: string | null;
  onSubmit: (passcode: string) => void;
}

async function verifyPasscode(passcode: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth", { method: "POST", headers: passcodeHeaders(passcode) });
  } catch {
    return "Network error. Check your connection and try again.";
  }
  if (response.ok) {
    return null;
  }
  const parsed = errorResponseSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.error : `Could not verify the passcode (${response.status}).`;
}

export function PasscodeGate({ message, onSubmit }: PasscodeGateProps) {
  const [value, setValue] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownError = error ?? message;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passcode = value.trim();
    if (passcode === "" || isChecking) {
      return;
    }
    setIsChecking(true);
    const verificationError = await verifyPasscode(passcode);
    setIsChecking(false);
    if (verificationError !== null) {
      setError(verificationError);
      return;
    }
    onSubmit(passcode);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-surface p-6"
      >
        <h1 className="font-playwrite text-2xl text-center text-ink">Hook Lab</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="passcode" className={labelClassName}>
            Team passcode
          </label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            aria-invalid={shownError !== null}
            aria-describedby={shownError ? "passcode-error" : undefined}
            className={inputClassName}
          />
        </div>
        {shownError && (
          <p id="passcode-error" role="alert" className="text-sm text-flag-red">
            {shownError}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={value.trim() === "" || isChecking} aria-busy={isChecking}>
          {isChecking ? "Checking…" : "Enter"}
        </Button>
      </form>
    </main>
  );
}
