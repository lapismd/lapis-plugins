import { expect, test } from "@playwright/test";

test("native navigation shortcuts and Escape preserve stored data and normal form input", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-navigation--navigation-fixture&viewMode=story",
  );
  const root = page.locator(".canvas-view-root:not([data-canvas-embed])");
  await expect(root.locator('[data-id="a"]')).toBeVisible();
  await root.getByRole("button", {name:"Expand authoring tools",exact:true}).click();
  await root.getByRole("button", {name:"Expand navigation tools",exact:true}).click();
  const read = () =>
    page.evaluate(async () => {
      const app = (
        document.querySelector(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as HTMLElement & { __lapisApp: any }
      ).__lapisApp;
      await app.fileEditingSessions.flush("Navigation.canvas");
      return app.vault.read(app.vault.getFileByPath("Navigation.canvas"));
    });
  const before = await read(),
    help = root.getByRole("button", { name: "Canvas help", exact: true });
  await help.focus();
  await page.keyboard.press("?");
  const dialog = page.getByRole("dialog", {
    name: "Canvas navigation",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(help).toBeFocused();
  await page.keyboard.press("0");
  await expect
    .poll(() =>
      root
        .locator(".svelte-flow__viewport")
        .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a),
    )
    .toBeCloseTo(1, 3);
  await root.getByRole("button", { name: "Add web page", exact: true }).click();
  const create = page.getByRole("dialog", {
    name: "Add web page",
    exact: true,
  });
  const camera = await root
    .locator(".svelte-flow__viewport")
    .getAttribute("style");
  await create.getByLabel("Web address").pressSequentially("F0?");
  await expect(create.getByLabel("Web address")).toHaveValue("F0?");
  expect(
    await root.locator(".svelte-flow__viewport").getAttribute("style"),
  ).toBe(camera);
  await create.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await read()).toBe(before);
});
