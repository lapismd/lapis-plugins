import { availableParallelism } from "node:os";

export function resolveTurboConcurrency(
  env = process.env,
  processorCount = availableParallelism(),
) {
  const override = env.TURBO_CONCURRENCY?.trim();
  if (override) {
    if (!/^[1-9]\d*$/.test(override) && !/^(?:100|[1-9]\d?)%$/.test(override)) {
      throw new Error("TURBO_CONCURRENCY must be a positive integer or 1%-100%.");
    }
    return override;
  }
  return String(Math.min(4, Math.max(1, Math.floor(processorCount / 2))));
}

export function resolveWorkerLimit(envName, maximum, env = process.env) {
  const override = env[envName]?.trim();
  if (!override) return maximum;
  if (!/^[1-9]\d*$/.test(override)) {
    throw new Error(`${envName} must be a positive integer.`);
  }
  return Math.min(maximum, Number(override));
}

export async function runBoundedWorkers(items, limit, worker) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Worker limit must be a positive integer.");
  }
  const input = [...items];
  const results = new Array(input.length);
  let nextIndex = 0;
  let firstError;

  async function runWorker() {
    while (!firstError) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= input.length) return;
      try {
        results[index] = await worker(input[index], index);
      } catch (error) {
        firstError ??= error;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, input.length) }, () => runWorker()),
  );
  if (firstError) throw firstError;
  return results;
}
