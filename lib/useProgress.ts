"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultState, loadState, saveState, STORAGE_KEY, type ProgressState } from "./storage";

// One progress store for the whole app. With Cache Components, Next keeps up to
// three visited pages mounted (hidden by <Activity>) instead of unmounting them,
// so per-page copies of progress went stale: a page you came back to still showed
// the checkboxes from your last visit. Every page now reads this single store, and
// writes go to it (and to localStorage) right away.

interface Snapshot {
  state: ProgressState;
  loaded: boolean;
}

// Server render and hydration always use the defaults, so markup matches;
// saved progress is read in an effect after mount.
const SERVER_SNAPSHOT: Snapshot = { state: defaultState(), loaded: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab saved progress: pick it up.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) emit({ state: loadState(), loaded: true });
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Load saved progress once per page load (the first component to mount does it). */
export function ensureLoaded() {
  if (!snapshot.loaded) emit({ state: loadState(), loaded: true });
}

export function updateProgress(fn: (s: ProgressState) => ProgressState) {
  // Load first, so a write can never replace saved progress with the defaults.
  if (!snapshot.loaded) ensureLoaded();
  const state = fn(snapshot.state);
  saveState(state);
  emit({ state, loaded: true });
}

export function useProgress() {
  const snap = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );

  useEffect(ensureLoaded, []);

  return { state: snap.state, loaded: snap.loaded, update: updateProgress };
}

export function getProgressSnapshot(): Snapshot {
  return snapshot;
}

/** For tests: forget the in-memory copy so the next load reads storage again. */
export function resetProgressStore() {
  snapshot = SERVER_SNAPSHOT;
}
