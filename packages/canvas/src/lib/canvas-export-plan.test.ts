import { expect, it } from "vitest";
import { canvasExportPlan } from "./canvas-export-plan";

it("exports the complete board independently of its current camera", () => {
  expect(
    canvasExportPlan({
      scope: "board",
      bounds: { x: -100, y: 30, width: 600, height: 300 },
      viewport: { x: 400, y: -20, zoom: 0.5 },
      size: { width: 800, height: 500 },
      ratio: 2,
    }),
  ).toEqual({
    width: 696,
    height: 396,
    pixelWidth: 1392,
    pixelHeight: 792,
    transform: "translate(148px, 18px) scale(1)",
  });
});
it("retains the current viewport crop and exact camera in viewport exports", () => {
  expect(
    canvasExportPlan({
      scope: "viewport",
      bounds: { x: 0, y: 0, width: 2000, height: 1000 },
      viewport: { x: -150, y: 75, zoom: 0.5 },
      size: { width: 800, height: 500 },
      ratio: 1,
    }),
  ).toEqual({
    width: 800,
    height: 500,
    pixelWidth: 800,
    pixelHeight: 500,
    transform: "translate(-150px, 75px) scale(0.5)",
  });
});
it("rejects invalid geometry and oversized quality requests without silent scaling", () => {
  const input = {
    scope: "board" as const,
    bounds: { x: 0, y: 0, width: 6000, height: 6000 },
    viewport: { x: 0, y: 0, zoom: 1 },
    size: { width: 800, height: 500 },
    ratio: 4,
  };
  expect(() => canvasExportPlan(input)).toThrow(/smaller|lower/);
  expect(() =>
    canvasExportPlan({ ...input, bounds: { ...input.bounds, width: NaN } }),
  ).toThrow(/geometry/);
  expect(() => canvasExportPlan({ ...input, ratio: 0 })).toThrow(/quality/);
});
