"use client";

import { useSyncExternalStore } from "react";

/** true after the first client render — use to gate persisted-store reads. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
