import { expect, test, type CDPSession, type Page } from "@playwright/test";

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 1100, height: 800 },
});
const rootOf = (page: Page) =>
  page.locator(".canvas-view-root:not([data-canvas-embed])");
async function read(page: Page) {
  return page.evaluate(async () => {
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
}
async function contacts(
  cdp: CDPSession,
  type: string,
  points: { x: number; y: number }[],
) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map((p, id) => ({
      ...p,
      id,
      radiusX: 1,
      radiusY: 1,
      force: 1,
    })),
  });
}
async function drag(
  cdp: CDPSession,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await contacts(cdp, "touchStart", [from]);
  for (let step = 1; step <= 16; step++)
    await contacts(cdp, "touchMove", [
      {
        x: from.x + ((to.x - from.x) * step) / 16,
        y: from.y + ((to.y - from.y) * step) / 16,
      },
    ]);
  await contacts(cdp, "touchEnd", []);
}
async function tap(page: Page, locator: ReturnType<typeof rootOf>) {
  const box = (await locator.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
test.beforeEach(async ({ page }) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-touch--native-touch-fixture&viewMode=story",
  );
  await expect(rootOf(page).locator('[data-id="a"]')).toBeVisible();
});

test("native touch pans and pinches without changing stored content or opening creation", async ({
  page,
  context,
}) => {
  const root = rootOf(page),
    camera = root.locator(".svelte-flow__viewport");
  const before = await read(page),
    bounds = (await root.locator(".svelte-flow__pane").boundingBox())!;
  const initial = await camera.getAttribute("style"),
    cdp = await context.newCDPSession(page);
  const origin = { x: bounds.x + 40, y: bounds.y + bounds.height / 2 };
  await drag(cdp, origin, { x: origin.x + 80, y: origin.y + 70 });
  await expect(camera).not.toHaveAttribute("style", initial!);
  const zoom = () =>
    camera.evaluate(
      (node) => new DOMMatrix(getComputedStyle(node).transform).a,
    );
  const scale = await zoom(),
    middle = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  await contacts(cdp, "touchStart", [
    { x: middle.x - 50, y: middle.y },
    { x: middle.x + 50, y: middle.y },
  ]);
  for (let step = 1; step <= 10; step++)
    await contacts(cdp, "touchMove", [
      { x: middle.x - 50 - step * 5, y: middle.y },
      { x: middle.x + 50 + step * 5, y: middle.y },
    ]);
  await contacts(cdp, "touchEnd", []);
  await expect.poll(zoom).toBeGreaterThan(scale * 1.3);
  await expect(
    root.getByRole("dialog", { name: "Create canvas card", exact: true }),
  ).toHaveCount(0);
  expect(await read(page)).toEqual(before);
});

test("native long press opens creation and one undo removes the new card", async ({
  page,
  context,
}) => {
  const root = rootOf(page),
    bounds = (await root.locator(".svelte-flow__pane").boundingBox())!;
  const cdp = await context.newCDPSession(page),
    point = { x: bounds.x + 40, y: bounds.y + bounds.height / 2 };
  await contacts(cdp, "touchStart", [point]);
  const menu = root.getByRole("dialog", {
    name: "Create canvas card",
    exact: true,
  });
  await expect(menu).toBeVisible();
  await contacts(cdp, "touchEnd", []);
  await tap(
    page,
    menu.getByRole("button", { name: "Add text card", exact: true }),
  );
  await expect.poll(async () => (await read(page)).nodes.length).toBe(3);
  await tap(page, root.getByRole("button", { name: "Undo", exact: true }));
  await expect.poll(async () => (await read(page)).nodes.length).toBe(2);
});

test("native touch moves, resizes, edits and groups selected cards without hover", async ({
  page,
  context,
}) => {
  const root = rootOf(page),
    node = root.locator('.svelte-flow__node[data-id="a"]');
  const cdp = await context.newCDPSession(page),
    initial = (await node.boundingBox())!;
  await drag(
    cdp,
    { x: initial.x + 20, y: initial.y + 20 },
    { x: initial.x + 75, y: initial.y + 55 },
  );
  await expect.poll(async () => (await read(page)).nodes[0].x).not.toBe(0);
  await tap(page, root.getByText("Select cards", { exact: true }));
  const checkbox = root.getByRole("checkbox", {
    name: "Alpha (a)",
    exact: true,
  });
  if (!(await checkbox.isChecked())) await tap(page, checkbox);
  await tap(page, root.getByText("Select cards", { exact: true }));
  const resize = node.locator(".canvas-node-resize-handle.bottom.right");
  await expect(resize).toBeVisible();
  const handle = (await resize.boundingBox())!;
  expect(handle.width).toBeGreaterThanOrEqual(44);
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.className,
      { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 },
    ),
  ).toContain("canvas-node-resize-handle");
  await drag(
    cdp,
    { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 },
    {
      x: handle.x + handle.width / 2 + 65,
      y: handle.y + handle.height / 2 + 40,
    },
  );
  await expect
    .poll(async () => (await read(page)).nodes[0].width)
    .toBeGreaterThan(220);
  const edit = node.getByRole("button", {
    name: "Edit text node",
    exact: true,
  });
  await expect(edit).toHaveCSS("opacity", "1");
  await tap(page, edit);
  const editor = node.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();
  await editor.fill("Touch edited");
  await tap(page, root.getByText("Select cards", { exact: true }));
  await tap(
    page,
    root.getByRole("checkbox", { name: "Beta (b)", exact: true }),
  );
  await tap(page, root.getByText("Select cards", { exact: true }));
  await tap(
    page,
    root.getByRole("button", { name: "Create group", exact: true }),
  );
  await expect
    .poll(async () =>
      (await read(page)).nodes.some((node: any) => node.type === "group"),
    )
    .toBe(true);
  expect(
    (await read(page)).nodes.find((node: any) => node.id === "a").text,
  ).toContain("Touch edited");
});

test("selected cards expose touch connection targets and accept a native connector", async ({
  page,
  context,
}) => {
  const root = rootOf(page),
    cdp = await context.newCDPSession(page);
  await tap(page, root.getByText("Select cards", { exact: true }));
  await tap(
    page,
    root.getByRole("checkbox", { name: "Alpha (a)", exact: true }),
  );
  await tap(page, root.getByText("Select cards", { exact: true }));
  const source = root.locator('[data-id="a"] [data-handleid="right-source"]');
  await expect(source).toBeVisible();
  const from = (await source.boundingBox())!;
  expect(from.width).toBeGreaterThanOrEqual(44);
  const to = (await root.locator('[data-id="b"]').boundingBox())!;
  await drag(
    cdp,
    { x: from.x + from.width / 2, y: from.y + from.height / 2 },
    { x: to.x, y: to.y + to.height / 2 },
  );
  await expect.poll(async () => (await read(page)).edges.length).toBe(1);
  expect((await read(page)).edges[0]).toMatchObject({
    fromNode: "a",
    toNode: "b",
  });
});
