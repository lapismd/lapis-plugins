export type SheetHistory<T> = {
  past: T[];
  future: T[];
};

export function emptySheetHistory<T>(): SheetHistory<T> {
  return { past: [], future: [] };
}

export function recordSheetEdit<T>(history: SheetHistory<T>, before: T): SheetHistory<T> {
  const past = [...history.past, before];
  if (past.length > 100) past.shift();
  return { past, future: [] };
}

export function undoSheetEdit<T>(
  history: SheetHistory<T>,
  current: T,
): { history: SheetHistory<T>; value: T } | null {
  const value = history.past.at(-1);
  if (value === undefined) return null;
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [...history.future, current],
    },
    value,
  };
}

export function redoSheetEdit<T>(
  history: SheetHistory<T>,
  current: T,
): { history: SheetHistory<T>; value: T } | null {
  const value = history.future.at(-1);
  if (value === undefined) return null;
  return {
    history: {
      past: [...history.past, current],
      future: history.future.slice(0, -1),
    },
    value,
  };
}
