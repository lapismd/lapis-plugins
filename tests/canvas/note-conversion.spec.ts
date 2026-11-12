import { expect, test, type Page } from "@playwright/test";

const rootOf = (page: Page) =>
  page.locator(".canvas-view-root:not([data-canvas-embed])");
async function open(page: Page) {
  await page.goto(
    "/iframe.html?id=plugins-canvas-note-conversion--native-conversion-fixture&viewMode=story",
  );
  const card = rootOf(page).locator('.svelte-flow__node[data-id="a"]');
  await expect(card).toBeVisible();
  await card.focus();
  await page.keyboard.press("Enter");
  return card;
}
async function read(page: Page) {
  return page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Conversion.canvas");
    return JSON.parse(
      await app.vault.read(app.vault.getFileByPath("Conversion.canvas")),
    );
  });
}
test("conversion flushes actual pending Mira text and undo retains the created Markdown note", async ({
  page,
}) => {
  const card = await open(page),
    root = rootOf(page);
  await card.hover();
  await expect(card.getByRole("button", { name: "Edit text node", exact: true })).toHaveCSS("pointer-events", "auto");
  await card
    .getByRole("button", { name: "Edit text node", exact: true })
    .click();
  const editor = card.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();
  await editor.fill("Latest pending Markdown");
  await root
    .getByRole("button", { name: "Convert to note", exact: true })
    .click();
  const dialog = root.getByRole("dialog", {
    name: "Convert text card to note",
    exact: true,
  });
  await dialog.getByLabel("Note name").fill("Pending");
  await dialog
    .getByRole("button", { name: "Create note", exact: true })
    .click();
  await expect.poll(async () => (await read(page)).nodes[0].type).toBe("file");
  const converted = await read(page),
    path = converted.nodes[0].file;
  const note = () =>
    page.evaluate(async (path) => {
      const app = (
        document.querySelector(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as HTMLElement & { __lapisApp: any }
      ).__lapisApp;
      return app.vault.read(app.vault.getFileByPath(path));
    }, path);
  expect((await note()).trim()).toBe("Latest pending Markdown");
  expect(converted.nodes[0]).toMatchObject({
    id: "a",
    x: 0,
    y: 0,
    width: 320,
    height: 220,
    extension: { keep: true },
  });
  expect(converted.edges).toEqual([
    { id: "ab", fromNode: "a", toNode: "b", extension: true },
  ]);
  await root.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await read(page)).nodes[0].type).toBe("text");
  expect((await read(page)).nodes[0].text.trim()).toBe(
    "Latest pending Markdown",
  );
  expect((await note()).trim()).toBe("Latest pending Markdown");
});
test("a deferred conversion cannot replace cards after the owning board changes files", async ({
  page,
}) => {
  await open(page);
  const root = rootOf(page),
    before = await read(page);
  await root
    .getByRole("button", { name: "Convert to note", exact: true })
    .click();
  const dialog = root.getByRole("dialog", {
    name: "Convert text card to note",
    exact: true,
  });
  await dialog.getByLabel("Note name").fill("Deferred");
  await page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    const other = await app.vault.create(
      "Other.canvas",
      JSON.stringify({
        nodes: [
          {
            id: "a",
            type: "text",
            text: "Other board",
            x: 0,
            y: 0,
            width: 320,
            height: 220,
          },
        ],
      }),
    );
    const original = app.vault.create.bind(app.vault);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    (window as any).__conversionRelease = release;
    (window as any).__conversionOther = other;
    app.vault.create = async (...args: any[]) => {
      (window as any).__conversionStarted = true;
      await gate;
      return original(...args);
    };
  });
  await dialog
    .getByRole("button", { name: "Create note", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__conversionStarted))
    .toBe(true);
  await page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.workspace.activeLeaf.openFile((window as any).__conversionOther);
    (window as any).__conversionRelease();
  });
  await expect(root).toContainText("Other board");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const app = (
          document.querySelector(
            '[data-panel-kind="canvas"][data-status="ready"]',
          ) as HTMLElement & { __lapisApp: any }
        ).__lapisApp;
        return Boolean(app.vault.getFileByPath("Deferred.md"));
      }),
    )
    .toBe(true);
  const result = await page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Other.canvas");
    return {
      old: JSON.parse(
        await app.vault.read(app.vault.getFileByPath("Conversion.canvas")),
      ),
      other: JSON.parse(
        await app.vault.read(app.vault.getFileByPath("Other.canvas")),
      ),
    };
  });
  expect(result.old).toEqual(before);
  expect(result.other.nodes[0]).toMatchObject({
    id: "a",
    type: "text",
    text: "Other board",
  });
});
