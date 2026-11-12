import type { JsonCanvas } from "./json-canvas";

export type CanvasBoardController = {
  readonly inputBlocked: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  read(): JsonCanvas;
  apply(document: JsonCanvas, selected?: Set<string>, selectedEdges?: Set<string>): void;
  flush(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  beginGesture(): void;
  beginText(id: string): void;
};
