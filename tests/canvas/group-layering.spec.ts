import { expect, test } from "@playwright/test";

for (const dark of [false, true])
  for (const embed of [false, true])
    test(`imported group backgrounds leave ${dark ? "dark" : "light"} ${embed ? "embedded" : "editable"} cards visible and pointer-accessible`, async ({
      page,
    }) => {
      await page.goto(
        `/iframe.html?id=plugins-canvas-registry-screenshots--${embed ? "embedded" : "overview"}&viewMode=story`,
      );
      await page.evaluate(
        (dark) => document.documentElement.classList.toggle("dark", dark),
        dark,
      );
      const root = page.locator(
        embed
          ? "[data-canvas-embed]"
          : ".canvas-view-root:not([data-canvas-embed])",
      );
      const card = embed
        ? root.getByRole("button", { name: "Load web preview", exact: true })
        : root
            .locator(".canvas-node-label")
            .filter({ hasText: "Canvas overview" });
      await expect(card).toBeVisible();
      await expect
        .poll(() =>
          root.locator(".canvas-group-label-input").evaluate((label) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d")!;
            const luminance = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              const rgb = [...context.getImageData(0, 0, 1, 1).data]
                .slice(0, 3)
                .map((n) => n / 255)
                .map((n) =>
                  n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
                );
              return rgb.reduce(
                (v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i]!,
                0,
              );
            };
            const ancestors: Element[] = [];
            for (let p: Element | null = label; p; p = p.parentElement)
              ancestors.unshift(p);
            context.fillStyle = "white";
            context.fillRect(0, 0, 1, 1);
            for (const p of ancestors) {
              context.fillStyle = getComputedStyle(p).backgroundColor;
              context.fillRect(0, 0, 1, 1);
            }
            const fillColor = [...context.getImageData(0, 0, 1, 1).data].slice(
              0,
              3,
            );
            const fill = luminance(`rgb(${fillColor.join(" ")})`),
              text = luminance(
                getComputedStyle(label).webkitTextFillColor ||
                  getComputedStyle(label).color,
              );
            return (
              (Math.max(fill, text) + 0.05) / (Math.min(fill, text) + 0.05)
            );
          }),
        )
        .toBeGreaterThanOrEqual(4.5);
      const before = await page.evaluate(async () => {
        const host = document.querySelector(
          "[data-panel-kind]",
        ) as HTMLElement & { __lapisApp: any };
        const app = host.__lapisApp;
        return app.vault.read(app.vault.getFileByPath("Sample.canvas"));
      });
      await expect
        .poll(() =>
          card.evaluate((label) => {
            const rect = label.getBoundingClientRect(),
              top = document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              );
            return top === label || label.contains(top);
          }),
        )
        .toBe(true);
      if (!embed) {
        await card.click({ position: { x: 20, y: 20 } });
        await expect(
          root.getByRole("button", { name: "Edit text node", exact: true }),
        ).toBeVisible();
      }
      const order = await page.evaluate(async () => {
        const app = (
          document.querySelector("[data-panel-kind]") as HTMLElement & {
            __lapisApp: any;
          }
        ).__lapisApp;
        await app.fileEditingSessions.flush("Sample.canvas");
        return app.vault.read(app.vault.getFileByPath("Sample.canvas"));
      });
      expect(order).toBe(before);
    });
