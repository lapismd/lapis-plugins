import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";

test("native account Settings survives a native-process restart and clears sign-out", async ({
  page,
  context,
}) => {
  const driverPath = process.env.LAPIS_SYNC_NATIVE_HOST_DRIVER;
  if (!driverPath)
    throw new Error(
      "Set LAPIS_SYNC_NATIVE_HOST_DRIVER to Notes' private server-account-review-process.ts"
    );
  const client =
    process.env.LAPIS_SYNC_NATIVE_REVIEW_CLIENT ?? "http://localhost:6081";
  const server =
    process.env.VITE_SYNC_REVIEW_SERVER_URL ?? "http://localhost:8797";
  for (const origin of [client, server])
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname))
      throw new Error("Live account acceptance is loopback-only");
  const profileId = `sync-native-review-${crypto.randomUUID()}`;
  const report = test.info();
  await report.attach("isolated-native-profile", {
    body: profileId,
    contentType: "text/plain",
  });
  let nextId = 0;
  const sessions = new Set<string>();
  const pending = new Map<
    number,
    { resolve(value: unknown): void; reject(error: Error): void }
  >();
  let approvalResolve: ((page: Page) => void) | undefined;
  const start = () => {
    const child = spawn(
      "deno",
      ["run", "--no-config", "--quiet", "-A", driverPath],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    createInterface({ input: child.stdout }).on("line", (line) => {
      const message = JSON.parse(line);
      if (message.type === "approval") {
        void context.newPage().then(async (popup) => {
          await popup.goto(message.url);
          approvalResolve?.(popup);
        });
        return;
      }
      const call = pending.get(message.id);
      pending.delete(message.id);
      if (message.result?.sessionId) sessions.add(message.result.sessionId);
      if (message.error) call?.reject(new Error(message.error));
      else call?.resolve(message.result);
    });
    child.on("exit", () => {
      for (const call of pending.values())
        call.reject(new Error("Native account process exited"));
      pending.clear();
    });
    return child;
  };
  let driver = start();
  const invoke = (command: string, payload: unknown) =>
    new Promise<unknown>((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      driver.stdin.write(JSON.stringify({ id, command, payload }) + "\n");
    });
  const stop = async () => {
    const exited = new Promise<void>((resolve) =>
      driver.once("exit", () => resolve())
    );
    driver.stdin.end();
    await exited;
  };
  await page.exposeBinding(
    "__nativeAccountInvoke",
    (_source, command, payload) => invoke(command, payload)
  );
  await page.addInitScript(() => {
    const target = globalThis as unknown as {
      bindings: { invoke(command: string, payload: unknown): Promise<unknown> };
      __nativeAccountInvoke(
        command: string,
        payload: unknown
      ): Promise<unknown>;
    };
    target.bindings = {
      invoke: (command, payload) =>
        target.__nativeAccountInvoke(command, payload),
    };
  });
  try {
    await page.goto(`${client}/?reviewVault=${profileId}`);
    const settings = page.getByRole("dialog", { name: "Settings" });
    await expect(
      settings.getByRole("heading", { name: "Lapis Sync" })
    ).toBeVisible();
    await expect(
      page.getByText("Protected native account session", { exact: false })
    ).toBeVisible();
    await settings.getByRole("textbox", { name: "Server URL" }).fill(server);
    await settings.getByRole("textbox", { name: "Server URL" }).press("Tab");
    const status = settings.getByRole("status", {
      name: "Server account status",
    });
    await expect(status).toContainText("Sign in to access");
    const approved = new Promise<Page>((resolve) => {
      approvalResolve = resolve;
    });
    await settings
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(status).toContainText("Waiting for approval");
    const popup = await approved;
    const password = (
      await readFile(
        process.env.LAPIS_SYNC_REVIEW_PASSWORD_FILE ??
          "/tmp/lapis-sync-slice1-password",
        "utf8"
      )
    ).trim();
    await popup.getByLabel("Username").fill("owner");
    await popup.getByLabel("Password").fill(password);
    await popup.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      popup.getByText("https://desktop.lapis.md", { exact: true })
    ).toBeVisible();
    await popup.getByRole("button", { name: "Allow client" }).click();
    await expect(status).toContainText("Signed in as owner.");
    const picker = settings.getByRole("combobox", {
      name: "Managed vault",
      exact: true,
    });
    await expect(picker).toBeEnabled();
    await picker.click();
    const option = page.getByRole("option").first();
    await expect(option).toBeVisible();
    const vaultName = (await option.textContent())!.trim();
    await option.click();
    await settings.getByRole("button", { name: "Test connection" }).click();
    await expect(
      settings.getByText(/Connected to Lapis Server\. Account access confirmed/)
    ).toBeVisible();
    await page.screenshot({
      path: "/tmp/lapis-sync-native-account-signed-in.png",
    });
    await stop();
    sessions.clear();
    driver = start();
    await page.reload();
    await expect(status).toContainText("Signed in as owner.");
    await expect(picker).toContainText(vaultName);
    await settings.getByRole("button", { name: "Test connection" }).click();
    await expect(
      settings.getByText(/Connected to Lapis Server\. Account access confirmed/)
    ).toBeVisible();
    await page.screenshot({
      path: "/tmp/lapis-sync-native-account-restored.png",
    });
    await settings
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(status).toContainText("Signed out");
    await stop();
    sessions.clear();
    driver = start();
    await page.reload();
    await expect(status).toContainText("Sign in to access");
  } finally {
    for (const sessionId of sessions)
      await invoke("desktop_server_account_call", {
        sessionId,
        operation: "signOut",
      }).catch(() => {});
    await page.close();
    await stop();
  }
});
