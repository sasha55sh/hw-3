"use client";

import { useState, type FormEvent } from "react";
import { Button, inputClassName, labelClassName } from "@/components/ui";

interface PasscodeGateProps {
  message: string | null;
  onSubmit: (passcode: string) => void;
}

export function PasscodeGate({ message, onSubmit }: PasscodeGateProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passcode = value.trim();
    if (passcode !== "") {
      onSubmit(passcode);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-surface p-6"
      >
        <h1 className="font-playwrite text-2xl text-ink">Hook Lab</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="passcode" className={labelClassName}>
            Team passcode
          </label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby={message ? "passcode-error" : undefined}
            className={inputClassName}
          />
        </div>
        {message && (
          <p id="passcode-error" role="alert" className="text-sm text-flag-red">
            {message}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={value.trim() === ""}>
          Enter
        </Button>
      </form>
    </main>
  );
}
