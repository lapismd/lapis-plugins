import { chromium, expect, test, type Page } from "@playwright/test";
import { createServer } from "node:http";
const rootOf = (page: Page) =>
  page.locator(".canvas-view-root:not([data-canvas-embed])");
async function read(page: Page) {
  return page.evaluate(async () => {
    const app = (
      document.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as HTMLElement & { __lapisApp: any }
    ).__lapisApp;
    await app.fileEditingSessions.flush("Web.canvas");
    return app.vault.read(app.vault.getFileByPath("Web.canvas"));
  });
}
test.beforeEach(async ({ page }) => {
  await page.goto(
    "/iframe.html?id=plugins-canvas-web-previews--native-preview-fixture&viewMode=story",
  );
  await expect(rootOf(page).locator('[data-id="web"]')).toBeVisible();
});

test("explicit web previews isolate even a same-origin document and leave unsafe imports inert", async ({
  page,
}) => {
  const root = rootOf(page),
    card = root.locator('[data-id="web"]'),
    before = await read(page);
  await expect(card.locator("iframe")).toHaveCount(0);
  await expect(root.locator('[data-id="unsafe"] a')).toHaveCount(0);
  await expect(root.locator('[data-id="unsafe"]')).toContainText(
    "HTTP or HTTPS",
  );
  await card
    .getByRole("button", { name: "Load web preview", exact: true })
    .click();
  const frame = card.frameLocator("iframe");
  await expect(
    frame.getByRole("heading", { name: "Embedded website", exact: true }),
  ).toBeVisible();
  const isolation = await frame.locator("body").evaluate(() => {
    let parentAccess = false,
      storageAccess = false;
    try {
      void window.parent.document.body;
      parentAccess = true;
    } catch {
      /* Opaque frame origin blocks the parent. */
    }
    try {
      void localStorage.length;
      storageAccess = true;
    } catch {
      /* Host origin storage is unavailable. */
    }
    return { parentAccess, storageAccess };
  });
  expect(isolation).toEqual({ parentAccess: false, storageAccess: false });
  const element = card.locator("iframe");
  await expect(element).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-forms allow-popups",
  );
  await expect(element).toHaveAttribute("referrerpolicy", "no-referrer");
  await card
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await expect(element).toHaveCount(0);
  expect(await read(page)).toBe(before);
});

test("a site that refuses framing retains a working external link without an opener", async ({
  page,
  context,
}) => {
  const root = rootOf(page),
    card = root.locator('[data-id="web"]');
  const link = card.getByRole("link", { name: "Open link", exact: true }),
    url = (await link.getAttribute("href"))!;
  await context.route(url, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Security-Policy": "frame-ancestors 'none'",
      },
      body: "<!doctype html><html><head><title>External fallback</title></head><body><h1>External website</h1></body></html>",
    }),
  );
  const request = page.waitForResponse(url);
  await card
    .getByRole("button", { name: "Load web preview", exact: true })
    .click();
  expect((await request).headers()["content-security-policy"]).toBe(
    "frame-ancestors 'none'",
  );
  await expect(card.locator(".canvas-web-fallback")).toContainText(
    "open the link",
  );
  await expect(link).toBeVisible();
  const popupPromise = context.waitForEvent("page");
  await link.click();
  const popup = await popupPromise;
  try {
    await expect(
      popup.getByRole("heading", { name: "External website", exact: true }),
    ).toBeVisible();
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    expect(await popup.evaluate(() => document.referrer)).toBe("");
  } finally {
    await popup.close();
  }
});

test("credentialless previews work in cross-origin isolated hosts without host cookies", async () => {
  let cookie: string | undefined,
    requests = 0;
  const server = createServer((request, response) => {
    if (request.url === "/preview") {
      cookie = request.headers.cookie;
      requests++;
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      "<!doctype html><html><head><title>Isolated preview</title></head><body><h1>Isolated website</h1></body></html>",
    );
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Preview server has no port");
  // Model a public website on this exact fixture endpoint, as Chromium/WPT do.
  // COEP, sandbox, credential and cookie checks stay active; LNA is a separate policy.
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: [`--ip-address-space-overrides=127.0.0.1:${address.port}=public`],
  });
  try {
    const context = await browser.newContext();
    await context.route("http://127.0.0.1:6097/**", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        },
      });
    });
    const page = await context.newPage();
    await page.goto(
      "http://127.0.0.1:6097/iframe.html?id=plugins-canvas-web-previews--native-preview-fixture&viewMode=story",
    );
    const card = rootOf(page).locator('[data-id="web"]'),
      url = `http://127.0.0.1:${address.port}/preview`;
    await expect(
      card.getByRole("link", { name: "Open link", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => crossOriginIsolated))
      .toBe(true);
    await context.addCookies([
      { name: "canvas-private-session", value: "must-not-send", url },
    ]);
    expect(await page.evaluate(() => document.cookie)).toContain(
      "canvas-private-session=must-not-send",
    );
    await page.evaluate(async (url) => {
      const app = (
        document.querySelector(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as HTMLElement & { __lapisApp: any }
      ).__lapisApp;
      const file = await app.vault.create(
        "Isolated.canvas",
        JSON.stringify({
          nodes: [
            {
              id: "web",
              type: "link",
              url,
              x: 0,
              y: 0,
              width: 420,
              height: 360,
            },
          ],
          edges: [],
        }),
      );
      await app.workspace.activeLeaf.openFile(file);
    }, url);
    await expect(
      card.getByRole("link", { name: "Open link", exact: true }),
    ).toHaveAttribute("href", url);
    await card
      .getByRole("button", { name: "Load web preview", exact: true })
      .click();
    await expect(
      card
        .frameLocator("iframe")
        .getByRole("heading", { name: "Isolated website", exact: true }),
    ).toBeVisible();
    await expect(card.locator("iframe")).toHaveAttribute("credentialless", "");
    expect(requests).toBeGreaterThan(0);
    expect(cookie ?? "").not.toContain("canvas-private-session");
    expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
