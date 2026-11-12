import { expect, test } from "@playwright/test";

test("native Explorer drop preserves the vault source, drop coordinates and camera", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-navigation--explorer-drag-source&viewMode=story",
  );
  const root = page.locator(".canvas-view-root:not([data-canvas-embed])");
  const pane = root.locator(".svelte-flow__pane");
  await expect(
    page.locator('[data-panel-kind="canvas"][data-status="ready"]'),
  ).toBeVisible();
  await page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    const leaf = app.workspace.ensureSideLeaf("file-explorer", "left");
    await leaf.setViewState({ type: "file-explorer", state: {} });
    app.workspace.revealLeaf(leaf);
  });
  const source = page.getByRole("button", {
    name: "Dragged note.md",
    exact: true,
  });
  await expect(source).toHaveAttribute("draggable", "true");
  const camera = await root
    .locator(".svelte-flow__viewport")
    .getAttribute("style");
  const bounds = (await pane.boundingBox())!;
  const drop = {
    x: Math.round(bounds.width * 0.6),
    y: Math.round(bounds.height * 0.55),
  };
  await source.dragTo(pane, { targetPosition: drop });
  const card = root.locator(".svelte-flow__node");
  await expect(card).toHaveCount(1);
  await expect(card).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await root.locator(".svelte-flow__viewport").getAttribute("style"),
  ).toBe(camera);
  const cardBounds = (await card.boundingBox())!;
  expect(cardBounds.x).toBeCloseTo(bounds.x + drop.x, 0);
  expect(cardBounds.y).toBeCloseTo(bounds.y + drop.y, 0);
  const stored = await page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Drop.canvas");
    return {
      board: JSON.parse(
        await app.vault.read(app.vault.getFileByPath("Drop.canvas")),
      ),
      note: await app.vault.read(app.vault.getFileByPath("Dragged note.md")),
    };
  });
  expect(stored.note).toBe("Original vault note");
  expect(stored.board.nodes[0]).toMatchObject({
    type: "file",
    file: "Dragged note.md",
    x: drop.x,
    y: drop.y,
  });
  await root.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(card).toHaveCount(0);
});
