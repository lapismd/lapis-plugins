type Contact = Pick<
  PointerEvent,
  "pointerId" | "pointerType" | "clientX" | "clientY"
>;

export function createCanvasLongPress(
  open: (point: { x: number; y: number }) => void,
  allowed: () => boolean,
) {
  const active = new Set<number>();
  let pending: { id: number; x: number; y: number } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    pending = null;
  }
  return {
    start(event: Contact, pane: boolean) {
      if (disposed || event.pointerType !== "touch") return;
      active.add(event.pointerId);
      cancel();
      if (!pane || active.size !== 1 || !allowed()) return;
      pending = { id: event.pointerId, x: event.clientX, y: event.clientY };
      timer = setTimeout(() => {
        const point = pending;
        cancel();
        if (!disposed && point && active.size === 1 && allowed())
          open({ x: point.x, y: point.y });
      }, 500);
    },
    move(event: Contact) {
      if (
        pending?.id === event.pointerId &&
        Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 10
      )
        cancel();
    },
    end(event: Contact) {
      active.delete(event.pointerId);
      cancel();
    },
    dispose() {
      disposed = true;
      cancel();
      active.clear();
    },
  };
}
