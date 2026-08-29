export type HarperLanguage = "markdown" | "plaintext" | "typst";

export interface HarperSpan {
  start: number;
  end: number;
}

export interface HarperSuggestionLike {
  get_replacement_text(): string;
}

export interface HarperLintLike {
  span(): HarperSpan;
  message(): string;
  lint_kind?(): string;
  lintKind?(): string;
  get_lint_kind?(): string;
  suggestions(): HarperSuggestionLike[];
}

export interface HarperLintOptions {
  language?: HarperLanguage;
  isolateEnglish?: boolean;
  ignore_link_title?: boolean;
  regex_mask?: string;
}

export interface HarperLinterLike {
  setup(): Promise<void>;
  lint(text: string, options?: HarperLintOptions): Promise<HarperLintLike[]>;
  organizedLints?(
    text: string,
    options?: HarperLintOptions,
  ): Promise<Record<string, HarperLintLike[]>>;
  applySuggestion(
    text: string,
    lint: HarperLintLike,
    suggestion: HarperSuggestionLike,
  ): Promise<string>;
  setDialect(dialect: number): Promise<void>;
  getDefaultLintConfig(): Promise<Record<string, boolean | null | undefined>>;
  setLintConfig(
    config: Record<string, boolean | null | undefined>,
  ): Promise<void>;
  importWords(words: string[]): Promise<void>;
  clearWords(): Promise<void>;
  importIgnoredLints(json: string): Promise<void>;
  clearIgnoredLints(): Promise<void>;
  contextHash(source: string, lint: HarperLintLike): Promise<bigint>;
  dispose?(): Promise<void>;
}

export interface HarperRuntimeLinterFactories {
  createLocal(): HarperLinterLike;
  createWorker(): HarperLinterLike;
  nodeRuntime: boolean;
  workerAvailable: boolean;
  workerSetupTimeoutMs?: number;
}

const HARPER_WORKER_SETUP_TIMEOUT_MS = 5_000;

export const HARPER_DIALECT = {
  american: 0,
  british: 1,
  australian: 2,
  canadian: 3,
  indian: 4,
} as const;

export function lintKind(lint: HarperLintLike): string {
  if (typeof lint.lint_kind === "function") {
    return String(lint.lint_kind());
  }
  if (typeof lint.lintKind === "function") {
    return String(lint.lintKind());
  }
  if (typeof lint.get_lint_kind === "function") {
    return String(lint.get_lint_kind());
  }
  return "Miscellaneous";
}

export function isNodeHarperRuntime(): boolean {
  const nodeProcess = (globalThis as {
    process?: { versions?: { node?: string } };
  }).process;
  return Boolean(nodeProcess?.versions?.node) && typeof window === "undefined";
}

export function shouldUseHarperWorker(environment: {
  nodeRuntime: boolean;
  workerAvailable: boolean;
}): boolean {
  return !environment.nodeRuntime && environment.workerAvailable;
}

async function setupBeforeDeadline(
  linter: HarperLinterLike,
  timeoutMs: number,
): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      linter.setup().then(
        () => true,
        () => false,
      ),
      new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function createHarperLinterForRuntime(
  factories: HarperRuntimeLinterFactories,
): Promise<HarperLinterLike> {
  if (shouldUseHarperWorker(factories)) {
    let workerLinter: HarperLinterLike | undefined;
    try {
      workerLinter = factories.createWorker();
      const workerReady = await setupBeforeDeadline(
        workerLinter,
        factories.workerSetupTimeoutMs ?? HARPER_WORKER_SETUP_TIMEOUT_MS,
      );
      if (workerReady) {
        return workerLinter;
      }
    } catch {
      // Some renderers expose Worker but cannot construct Harper's module worker.
    }
    await workerLinter?.dispose?.().catch(() => undefined);
  }

  const localLinter = factories.createLocal();
  await localLinter.setup();
  return localLinter;
}

export async function createHarperLinter(): Promise<HarperLinterLike> {
  const harper = await import("harper.js");
  const { binary } = await import("harper.js/binary");
  return createHarperLinterForRuntime({
    nodeRuntime: isNodeHarperRuntime(),
    workerAvailable: typeof Worker === "function",
    createLocal: () => new harper.LocalLinter({ binary }) as HarperLinterLike,
    createWorker: () => new harper.WorkerLinter({ binary }) as HarperLinterLike,
  });
}
