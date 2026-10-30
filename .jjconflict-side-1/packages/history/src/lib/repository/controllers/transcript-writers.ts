// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
type Guard = <T>(
  path: string | undefined,
  apply: () => Promise<T>
) => Promise<T>;
const writers = new WeakMap<App, { guard: Guard }>();
type GuardObserver = (path: string | undefined) => () => void;
const observers = new WeakMap<App, { enter: GuardObserver }>();
/** Observe protection already acquired by the shared controller; grants no authority. */
export function bindReplacementGuardObserver(
  app: App,
  enter: GuardObserver
): () => void {
  if (observers.has(app))
    throw new Error("Replacement observer is already bound");
  const lease = { enter };
  observers.set(app, lease);
  return () => {
    if (observers.get(app) === lease) observers.delete(app);
  };
}
/** Optional AI writer admission augments replacement, not ordinary App teardown. */
export function bindTranscriptWriters(app: App, guard: Guard): () => void {
  if (writers.has(app)) throw new Error("Transcript writers are already bound");
  const lease = { guard };
  writers.set(app, lease);
  return () => {
    if (writers.get(app) === lease) writers.delete(app);
  };
}
export function guardTranscriptReplacement<T>(
  app: App,
  path: string | undefined,
  apply: () => Promise<T>
): Promise<T> {
  const guard = writers.get(app)?.guard;
  const run = async () => {
    const leave = observers.get(app)?.enter(path);
    try {
      return await apply();
    } finally {
      leave?.();
    }
  };
  return guard ? guard(path, run) : app.fileEditingSessions.guard(path, run);
}
