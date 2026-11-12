import type { CanvasBoardOperation } from "./canvas-board-controller";

export function canvasNoteFilename(name: string): string {
  const stem = name.trim().replace(/\.md$/i, "");
  if (!stem || /^\.+$/.test(stem) || /[\\/:*?"<>|\u0000-\u001f]/.test(stem)) {
    throw new Error(
      "Choose a note name without folder separators or reserved characters.",
    );
  }
  return `${stem}.md`;
}

/** A failed or stale conversion never removes the original card or created file. */
export async function convertCanvasTextToNote(
  board: CanvasBoardOperation,
  id: string,
  create: (text: string) => Promise<string>,
): Promise<string> {
  board.assertCurrent();
  await board.flush();
  board.assertCurrent();
  const original = board.read().nodes?.find((node) => node.id === id);
  if (original?.type !== "text")
    throw new Error("The text card is no longer available.");
  const snapshot = JSON.stringify(original);
  const path = await create(original.text);
  try {
    board.assertCurrent();
    const current = board.read();
    const target = current.nodes?.find((node) => node.id === id);
    if (JSON.stringify(target) !== snapshot)
      throw new Error("The card changed during conversion.");
    const { text: _text, type: _type, ...fields } = original;
    board.apply(
      {
        ...current,
        nodes: current.nodes!.map((node) =>
          node.id === id ? { ...fields, type: "file", file: path } : node,
        ),
      },
      new Set([id]),
    );
    await board.flush();
    return path;
  } catch (error) {
    throw new Error(
      `Note ${path} was created and retained. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
