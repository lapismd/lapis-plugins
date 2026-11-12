import { afterEach, expect, it, vi } from "vitest";
import { createCanvasLongPress } from "./canvas-long-press";

afterEach(() => vi.useRealTimers());
const point = (pointerId = 1, x = 40, y = 70) => ({
  pointerId,
  pointerType: "touch",
  clientX: x,
  clientY: y,
});
it("opens one creation menu after a stationary touch hold", () => {
  vi.useFakeTimers();
  const open = vi.fn();
  const hold = createCanvasLongPress(open, () => true);
  hold.start(point(), true);
  vi.advanceTimersByTime(499);
  expect(open).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(open).toHaveBeenCalledExactlyOnceWith({ x: 40, y: 70 });
  vi.advanceTimersByTime(1000);
  expect(open).toHaveBeenCalledTimes(1);
});
it("cancels panning, ended touches, pinch and non-pane starts", () => {
  vi.useFakeTimers();
  const open = vi.fn();
  const hold = createCanvasLongPress(open, () => true);
  hold.start(point(), true);
  hold.move(point(1, 51));
  vi.advanceTimersByTime(600);
  hold.end(point());
  hold.start(point(), true);
  hold.end(point());
  vi.advanceTimersByTime(600);
  hold.start(point(), true);
  hold.start(point(2), true);
  hold.end(point(2));
  vi.advanceTimersByTime(600);
  hold.end(point());
  hold.start(point(), false);
  vi.advanceTimersByTime(600);
  expect(open).not.toHaveBeenCalled();
});
it("rechecks input protection when the timer completes", () => {
  vi.useFakeTimers();
  let allowed = true;
  const open = vi.fn();
  const hold = createCanvasLongPress(open, () => allowed);
  hold.start(point(), true);
  allowed = false;
  vi.advanceTimersByTime(600);
  expect(open).not.toHaveBeenCalled();
});
it("disposal cancels pending work and prevents new timers", () => {
  vi.useFakeTimers();
  const open = vi.fn();
  const hold = createCanvasLongPress(open, () => true);
  hold.start(point(), true);
  hold.dispose();
  hold.start(point(), true);
  vi.advanceTimersByTime(600);
  expect(open).not.toHaveBeenCalled();
});
