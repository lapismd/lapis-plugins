import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("Sync Settings signs into real Deno, discovers vaults and signs out across origins", async ({
  page,
  context,
}) => {
  const client =
    process.env.LAPIS_SYNC_REVIEW_CLIENT ?? "http://localhost:6080";
  const server =
    process.env.VITE_SYNC_REVIEW_SERVER_URL ?? "http://localhost:8797";
  for (const address of [client, server]) {
    const url = new URL(address);
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.href !== `${url.origin}/`
    )
      throw new Error(
        "Live review acceptance requires literal loopback origins"
      );
  }
  const password = (
    await readFile(
      process.env.LAPIS_SYNC_REVIEW_PASSWORD_FILE ??
        "/tmp/lapis-sync-slice1-password",
      "utf8"
    )
  ).trim();
  await context.grantPermissions(["local-network-access"], { origin: client });
  await page.goto(client);
  const settings = page.getByRole("dialog", { name: "Settings" });
  await expect(
    settings.getByRole("heading", { name: "Lapis Sync" })
  ).toBeVisible();
  await settings.getByRole("textbox", { name: "Server URL" }).fill(server);
  await settings.getByRole("textbox", { name: "Server URL" }).press("Tab");
  const status = settings.getByRole("status", {
    name: "Server account status",
  });
  await settings.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    settings.getByRole("button", { name: "Open server sign-in" })
  ).toBeVisible();
  await settings.getByRole("button", { name: "Cancel sign-in" }).click();
  await expect(status).toHaveText("Sign-in cancelled.");
  await settings.getByRole("button", { name: "Sign in", exact: true }).click();
  const popupEvent = context.waitForEvent("page");
  await settings.getByRole("button", { name: "Open server sign-in" }).click();
  const popup = await popupEvent;
  await expect(popup.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await popup.getByLabel("Username").fill("owner");
  await popup.getByLabel("Password").fill(password);
  await popup.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    popup.getByRole("heading", { name: "Connect an external client" })
  ).toBeVisible();
  await expect(popup.getByText(client, { exact: true })).toBeVisible();
  await expect(status).toContainText("Waiting for approval");
  await popup.getByRole("button", { name: "Allow client" }).click();
  await expect(status).toContainText("Signed in as owner.");
  const response = await popup.request.get(`${server}/api/trpc/vault.list`);
  const vault = (await response.json()).result.data.find(
    (row: { role: string }) => row.role === "owner" || row.role === "editor"
  );
  if (!vault)
    throw new Error(
      "Create an editable managed vault in the isolated review server first"
    );
  const picker = settings.getByRole("combobox", {
    name: "Managed vault",
    exact: true,
  });
  await picker.click();
  await page.getByRole("option", { name: vault.name, exact: true }).click();
  await expect(picker).toContainText(vault.name);
  await settings.getByRole("button", { name: "Test connection" }).click();
  await expect(
    settings.getByText(/Connected to Lapis Server\. Account access confirmed/)
  ).toBeVisible();
  await expect(
    settings.getByRole("switch", { name: "Enable sync" })
  ).toBeDisabled();
  await page.screenshot({ path: "/tmp/lapis-sync-account-settings.png" });
  await settings.getByRole("button", { name: "Sign out" }).click();
  await expect(status).toHaveText("Signed out of Lapis Server.");
  await expect(picker).toBeDisabled();
  await expect(
    settings.getByText(/Connected to Lapis Server\. Account access confirmed/)
  ).toHaveCount(0);
  await page.reload();
  await expect(
    settings.getByRole("button", { name: "Sign in", exact: true })
  ).toBeVisible();
  await expect(
    settings.getByRole("textbox", { name: "Server URL" })
  ).toHaveValue(server);
  await expect(picker).toBeDisabled();
  await page.screenshot({ path: "/tmp/lapis-sync-sign-in-guidance.png" });
  await popup.close();
});
