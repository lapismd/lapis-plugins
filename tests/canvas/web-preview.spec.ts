import { expect, test } from "@playwright/test";

test("website previews are opt-in, sandboxed, and reset when the address changes", async ({ page }) => {
  let requests = 0;
  await page.route("https://example.com/salt-marsh", async route => {
    requests++;
    await route.fulfill({ contentType: "text/html", body: "<!doctype html><html><body><h1>Saltmarsh preview fixture</h1></body></html>" });
  });
  await page.goto("/iframe.html?id=plugins-canvas-review--web-cards&viewMode=story");
  const card = page.locator('[data-id="website"]');
  await expect(card.getByText("Salt marsh", { exact: true })).toBeVisible();
  expect(requests).toBe(0);
  await card.getByRole("button", { name: "Load web preview", exact: true }).click();
  const frame = card.locator("iframe");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-forms allow-popups");
  await expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(card.frameLocator("iframe").getByRole("heading", { name: "Saltmarsh preview fixture", exact: true })).toBeVisible();
  await card.locator("input.canvas-node-input").fill("javascript:alert(1)");
  await expect(frame).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Open link", exact: true })).toHaveCount(0);
});

test("frame-rejecting sites retain the browser fallback", async ({ page }) => {
  await page.route("https://example.com/salt-marsh", route => route.fulfill({ headers: { "X-Frame-Options": "DENY" }, body: "Blocked frame fixture" }));
  await page.goto("/iframe.html?id=plugins-canvas-review--web-cards&viewMode=story");
  const card = page.locator('[data-id="website"]');
  await card.getByRole("button", { name: "Load web preview", exact: true }).click();
  await expect(card.locator(".canvas-web-fallback")).toBeVisible();
  await expect(card.getByRole("link", { name: "Open link", exact: true })).toBeVisible();
});
