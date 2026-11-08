"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_CHANGE_EVENT = "hook-lab:storage";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onChange);
  };
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    return;
  } finally {
    window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
  }
}

export function useLocalStorageValue(key: string): [string | null | undefined, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readItem(key),
    () => undefined,
  );
  const setValue = useCallback((next: string | null) => writeItem(key, next), [key]);
  return [value, setValue];
}
