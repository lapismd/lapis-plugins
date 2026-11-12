import { expect, test, type Page } from "@playwright/test";

async function read(page: Page) {
  return page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Connections.canvas");
    return JSON.parse(
      await app.vault.read(app.vault.getFileByPath("Connections.canvas")),
    );
  });
}
async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 16 });
  await page.mouse.up();
}
test.beforeEach(async ({ page }) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-connections--pointer-connections&viewMode=story",
  );
  await expect(
    page.locator('[data-panel-kind="canvas"][data-status="ready"]'),
  ).toBeVisible();
  await expect(page.locator('.svelte-flow__node[data-id="a"]')).toBeVisible();
});

test("App protection rejects an in-flight connection and reconnection", async ({ page }) => {
  for (const reconnect of [false, true]) {
    const source = page.locator('.svelte-flow__node[data-id="a"]');
    const target = (await page.locator('.svelte-flow__node[data-id="c"]').boundingBox())!;
    if (reconnect) {
      const edge = page.locator('.svelte-flow__edge[data-id="ab"]');
      await edge.focus(); await page.keyboard.press("Enter");
    } else {
      const node = (await source.boundingBox())!;
      await page.mouse.move(node.x + node.width - 2, node.y + node.height / 2);
    }
    const anchor = reconnect ? page.locator('.canvas-connector-reconnect.svelte-flow__edgeupdater-target') : source.locator('[data-handleid="right-source"]');
    await expect(anchor).toBeVisible();
    const start = (await anchor.boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down(); await page.mouse.move(start.x + 35, start.y + 35, { steps: 3 });
    await page.evaluate(async () => {
      const host = document.querySelector('[data-panel-kind="canvas"][data-status="ready"]') as HTMLElement & { __lapisApp: any; __releaseGuard?: () => void; __guard?: Promise<void> };
      let began!: () => void;
      const started = new Promise<void>((resolve) => { began = resolve; });
      const gate = new Promise<void>((resolve) => { host.__releaseGuard = resolve; });
      host.__guard = host.__lapisApp.fileEditingSessions.guard("Connections.canvas", async () => { began(); await gate; });
      await started;
    });
    try {
      await page.mouse.move(target.x + target.width / 2, target.y, { steps: 12 }); await page.mouse.up();
      await expect(page.locator('.svelte-flow__edge')).toHaveCount(1);
    } finally {
      await page.evaluate(async () => {
        const host = document.querySelector('[data-panel-kind="canvas"]') as HTMLElement & { __releaseGuard?: () => void; __guard?: Promise<void> };
        host.__releaseGuard?.(); await host.__guard;
        delete host.__releaseGuard; delete host.__guard;
      });
    }
    const value = await read(page);
    expect(value.edges).toHaveLength(1); expect(value.edges[0]).toMatchObject({ id: "ab", fromNode: "a", toNode: "b" });
    expect(value.nodes).toHaveLength(3);
  }
});
test("a connection dropped on empty space creates one card and undo removes both entities", async ({
  page,
}) => {
  const source = page.locator('.svelte-flow__node[data-id="a"]');
  const a = (await source.boundingBox())!;
  await page.mouse.move(a.x + a.width - 2, a.y + a.height / 2);
  const handle = source.locator('[data-handleid="right-source"]');
  await expect(handle).toBeVisible();
  const start = (await handle.boundingBox())!;
  const point = await page.locator(".svelte-flow__pane").evaluate((pane) => {
    const bounds = pane.getBoundingClientRect();
    for (const yf of [0.8, 0.7, 0.6])
      for (const xf of [0.2, 0.4, 0.6, 0.8]) {
        const x = bounds.left + bounds.width * xf,
          y = bounds.top + bounds.height * yf;
        if (document.elementFromPoint(x, y) === pane) return { x, y };
      }
    throw new Error("No empty board space is available");
  });
  await drag(
    page,
    { x: start.x + start.width / 2, y: start.y + start.height / 2 },
    point,
  );
  await expect.poll(async () => (await read(page)).nodes.length).toBe(4);
  const created = await read(page),
    card = created.nodes.at(-1),
    edge = created.edges.at(-1);
  expect(card.type).toBe("text");
  expect(edge).toMatchObject({
    fromNode: "a",
    fromSide: "right",
    toNode: card.id,
  });
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await read(page)).nodes.length).toBe(3);
  expect((await read(page)).edges).toHaveLength(1);
});
for (const end of ["source", "target"] as const)
  test(`dragging the ${end} endpoint preserves identity and cancellation preserves the connection`, async ({
    page,
  }) => {
    const edge = page.locator('.svelte-flow__edge[data-id="ab"]');
    await edge.focus();
    await page.keyboard.press("Enter");
    const target = page.locator('.svelte-flow__node[data-id="c"]');
    const c = (await target.boundingBox())!;
    const anchor = page.locator(
      `.canvas-connector-reconnect.svelte-flow__edgeupdater-${end}`,
    );
    await expect(anchor).toBeVisible();
    const a = (await anchor.boundingBox())!;
    await drag(
      page,
      { x: a.x + a.width / 2, y: a.y + a.height / 2 },
      { x: c.x + c.width / 2, y: c.y },
    );
    await expect
      .poll(
        async () =>
          (await read(page)).edges[0][end === "source" ? "fromNode" : "toNode"],
      )
      .toBe("c");
    const attached = await read(page);
    expect(attached.edges[0]).toMatchObject({
      id: "ab",
      label: "Retained",
      extension: { keep: true },
    });
    await edge.focus();
    await page.keyboard.press("Enter");
    const current = (await anchor.boundingBox())!;
    await drag(
      page,
      { x: current.x + current.width / 2, y: current.y + current.height / 2 },
      { x: 20, y: 20 },
    );
    expect((await read(page)).edges).toEqual(attached.edges);
    expect((await read(page)).nodes).toHaveLength(3);
  });

test("connector endpoint controls remain clickable beside fixed authoring panels", async ({ page }) => {
  await page.goto("/iframe.html?id=plugins-canvas-connections--constrained-toolbar&viewMode=story");
  const root = page.locator(".canvas-view-root:not([data-canvas-embed])");
  await expect(root.locator('[data-id="a"]')).toBeVisible();
  await root.locator('.svelte-flow__edge[data-id="ab"]').focus(); await page.keyboard.press("Enter");
  await root.getByText("Reconnect", { exact: true }).click();
  const menu = root.locator(".canvas-connection-menu");
  await menu.getByRole("combobox", { name: "Source card", exact: true }).selectOption("c");
  await menu.getByRole("button", { name: "Apply endpoints", exact: true }).click();
  await expect.poll(async () => (await read(page)).edges[0].fromNode).toBe("c");
});
