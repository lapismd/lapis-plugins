import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
const rootOf = (page: Page) =>
  page.locator(".canvas-view-root:not([data-canvas-embed])");
async function read(page: Page) {
  return page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Export.canvas");
    return app.vault.read(app.vault.getFileByPath("Export.canvas"));
  });
}
test.beforeEach(async ({ page }) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-export--native-export-fixture&viewMode=story",
  );
  await expect(rootOf(page).locator('[data-id="a"]')).toBeVisible();
  const zoom = () =>
    rootOf(page)
      .locator(".svelte-flow__viewport")
      .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
  await expect.poll(zoom).toBeLessThan(0.99);
  await rootOf(page)
    .getByRole("button", { name: "Reset zoom", exact: true })
    .click();
  await expect.poll(zoom).toBe(1);
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: any[]) {
      const image = args[0];
      if (
        image instanceof HTMLImageElement &&
        image.src.startsWith("data:image/svg+xml")
      )
        (window as any).__canvasExportSvg = decodeURIComponent(
          image.src.split(",").slice(1).join(","),
        );
      return (original as any).apply(this, args);
    };
  });
});
test("full-board PNG retains dimensions, privacy, camera and original source", async ({
  page,
}) => {
  const root = rootOf(page),
    before = await read(page),
    camera = await root.locator(".svelte-flow__viewport").getAttribute("style");
  const point = await root
    .locator(".canvas-flow-edge-path")
    .evaluate((element) => {
      const path = element as SVGPathElement,
        point = path.getPointAtLength(path.getTotalLength() / 2);
      const screen = new DOMPoint(point.x, point.y).matrixTransform(
        path.getScreenCTM()!,
      );
      return { x: screen.x, y: screen.y };
    });
  await page.mouse.click(point.x, point.y);
  await expect(root.locator(".canvas-edge-toolbar")).toBeVisible();
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("private.example.test"))
      requests.push(request.url());
  });
  await root.getByRole("button", { name: "Export PNG", exact: true }).click();
  const dialog = root.getByRole("dialog", {
    name: "Export Canvas as PNG",
    exact: true,
  });
  await dialog.getByLabel("Quality").selectOption("2");
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Export.png");
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.readUInt32BE(16)).toBe(2732);
  expect(bytes.readUInt32BE(20)).toBe(794);
  const colorCount = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data,
      colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 64)
      colors.add(Array.from(pixels.slice(index, index + 4)).join(","));
    return colors.size;
  }, bytes.toString("base64"));
  expect(colorCount).toBeGreaterThan(4);
  const svg = await page.evaluate(
    () => (window as any).__canvasExportSvg as string,
  );
  expect(svg).toContain("Export text");
  expect(svg).toContain("File card");
  expect(svg).toContain("Web page");
  expect(svg).not.toContain("PRIVATE FILE CONTENT");
  expect(svg).not.toContain("Private plan.md");
  expect(svg).not.toContain("secret-address");
  expect(svg).not.toContain("<iframe");
  expect(svg).not.toContain("<button");
  expect(svg).not.toContain("<select");
  expect(requests).toEqual([]);
  expect(
    await root.locator(".svelte-flow__viewport").getAttribute("style"),
  ).toBe(camera);
  expect(await read(page)).toBe(before);
  await expect(page.locator('div[id^="canvas-export-"]')).toHaveCount(0);
});
test("viewport PNG uses its crop and permits explicit content disclosure", async ({
  page,
}) => {
  const root = rootOf(page),
    before = await read(page),
    size = await root.locator(".svelte-flow").boundingBox();
  await root.getByRole("button", { name: "Export PNG", exact: true }).click();
  const dialog = root.getByRole("dialog", {
    name: "Export Canvas as PNG",
    exact: true,
  });
  await dialog.getByLabel("Area").selectOption("viewport");
  await dialog.getByLabel("Transparent background").check();
  await dialog.getByLabel("Include file contents and paths").check();
  await dialog.getByLabel("Include web addresses").check();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG", exact: true }).click();
  const bytes = await readFile((await (await downloadPromise).path())!);
  expect(bytes.readUInt32BE(16)).toBe(Math.ceil(size!.width));
  expect(bytes.readUInt32BE(20)).toBe(Math.ceil(size!.height));
  const svg = await page.evaluate(
    () => (window as any).__canvasExportSvg as string,
  );
  expect(svg).toContain("PRIVATE FILE CONTENT");
  expect(svg).toContain("Private plan.md");
  expect(svg).toContain("secret-address");
  expect(await read(page)).toBe(before);
});
test("whole-board PNG includes curved connector extents outside card bounds", async ({
  page,
}) => {
  const root = rootOf(page);
  const bounds = await root
    .locator(".svelte-flow__viewport")
    .evaluate((viewport) => {
      const origin = viewport.getBoundingClientRect(),
        zoom = new DOMMatrix(getComputedStyle(viewport).transform).a;
      const extents = [
        ...viewport.querySelectorAll(
          ".svelte-flow__node, .canvas-flow-edge-path, .canvas-flow-edge-arrow",
        ),
      ].map((node) => node.getBoundingClientRect());
      return {
        x: (Math.min(...extents.map((rect) => rect.x)) - origin.x) / zoom,
        y: (Math.min(...extents.map((rect) => rect.y)) - origin.y) / zoom,
        right:
          (Math.max(...extents.map((rect) => rect.right)) - origin.x) / zoom,
        bottom:
          (Math.max(...extents.map((rect) => rect.bottom)) - origin.y) / zoom,
      };
    });
  expect(bounds.y).toBeLessThan(-48);
  await root.getByRole("button", { name: "Export PNG", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await root
    .getByRole("dialog", { name: "Export Canvas as PNG", exact: true })
    .getByRole("button", { name: "Save PNG", exact: true })
    .click();
  const download = await downloading,
    bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1366);
  expect(bytes.readUInt32BE(20)).toBe(
    Math.ceil(Math.round((bounds.bottom - bounds.y + 96) * 1e6) / 1e6),
  );
  await download.saveAs("/tmp/canvas-whole-board-with-connectors.png");
});
test("PNG export explains a missing browser capability", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.reload();
  const button = rootOf(page).getByRole("button", {
    name: "Export PNG",
    exact: true,
  });
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute(
    "title",
    "PNG export is unavailable in this browser.",
  );
});
test("failed PNG rasterization retains the source and removes private snapshot DOM", async ({
  page,
}) => {
  const root = rootOf(page),
    before = await read(page);
  await root.getByRole("button", { name: "Export PNG", exact: true }).click();
  const dialog = root.getByRole("dialog", {
    name: "Export Canvas as PNG",
    exact: true,
  });
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = () => {
      throw new Error("Rasterizer unavailable");
    };
  });
  await dialog.getByRole("button", { name: "Save PNG", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Rasterizer unavailable",
  );
  await expect(page.locator('div[id^="canvas-export-"]')).toHaveCount(0);
  expect(await read(page)).toBe(before);
});
