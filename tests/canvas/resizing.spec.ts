import { expect, test } from "@playwright/test";

test("mouse resize persists card and group dimensions through undo and redo", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-touch--native-touch-fixture&viewMode=story",
  );
  const root = page.locator(".canvas-view-root:not([data-canvas-embed])");
  const read = () =>
    page.evaluate(async () => {
      const app = (
        document.querySelector(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as HTMLElement & { __lapisApp: any }
      ).__lapisApp;
      await app.fileEditingSessions.flush("Touch.canvas");
      return JSON.parse(
        await app.vault.read(app.vault.getFileByPath("Touch.canvas")),
      );
    });
  const card = root.locator('.svelte-flow__node[data-id="a"]');
  await expect(card).toBeVisible();
  const before = await read();
  await card.focus();
  await page.keyboard.press("Enter");
  async function resize(id: string, dx: number, dy: number) {
    const control = root.locator(
      `.svelte-flow__node[data-id="${id}"] .canvas-node-resize-handle.bottom.right`,
    );
    const bounds = (await control.boundingBox())!;
    const from = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 16 });
    await page.mouse.up();
  }
  await resize("a", 60, 40);
  await expect
    .poll(async () => (await read()).nodes.find((node: any) => node.id === "a"))
    .toMatchObject({ width: 280, height: 180 });
  await root.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(read).toEqual(before);
  await root.getByRole("button", { name: "Redo", exact: true }).click();
  await expect
    .poll(async () => (await read()).nodes[0])
    .toMatchObject({ width: 280, height: 180 });
  await root.getByRole("button", { name: "Add group", exact: true }).click();
  const group = (await read()).nodes.find((node: any) => node.type === "group");
  await expect(
    root.locator(`.svelte-flow__node[data-id="${group.id}"]`),
  ).toBeVisible();
  await resize(group.id, 45, 35);
  await expect
    .poll(async () =>
      (await read()).nodes.find((node: any) => node.id === group.id),
    )
    .toMatchObject({ width: group.width + 45, height: group.height + 35 });
});
