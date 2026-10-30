import { describe, expect, it } from "vitest";
import {
  emptySheetHistory,
  recordSheetEdit,
  redoSheetEdit,
  undoSheetEdit,
} from "./sheet-history";

describe("sheet history", () => {
  it("undoes and redoes the last edit", () => {
    const edited = recordSheetEdit(emptySheetHistory<string>(), "a");
    const undone = undoSheetEdit(edited, "b");
    expect(undone?.value).toBe("a");
    const redone = undone ? redoSheetEdit(undone.history, undone.value) : null;
    expect(redone?.value).toBe("b");
    expect(undoSheetEdit(emptySheetHistory<string>(), "a")).toBeNull();
    expect(redoSheetEdit(edited, "b")).toBeNull();
  });

  it("drops redo entries after a new edit", () => {
    const edited = recordSheetEdit(emptySheetHistory<string>(), "a");
    const undone = undoSheetEdit(edited, "b");
    const next = undone ? recordSheetEdit(undone.history, undone.value) : null;
    expect(next?.future).toEqual([]);
    expect(redoSheetEdit(next ?? emptySheetHistory<string>(), "c")).toBeNull();
  });
});
