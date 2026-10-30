import { mount } from "svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "@lapis-notes/lapis-plugin-sync/styles.css";
import Review from "./Review.svelte";
import { setNativeDesktopBridge } from "@lapis-notes/api";

// Explicit private native review; browser review retains its existing memory host.
if (import.meta.env.VITE_SYNC_NATIVE_REVIEW === "true") {
  const started = Date.now();
  const read = () =>
    (
      globalThis as {
        bindings?: {
          invoke<T>(
            command: string,
            payload?: Record<string, unknown>
          ): Promise<T>;
        };
      }
    ).bindings;
  while (!read() && Date.now() - started < 5_000)
    await new Promise((resolve) => setTimeout(resolve, 50));
  const bindings = read();
  if (!bindings)
    throw new Error(
      "Open this review in the Deno desktop window; native bindings are unavailable in an ordinary browser tab."
    );
  setNativeDesktopBridge({
    runtime: "deno-desktop",
    invoke: (command, payload) => bindings.invoke(command, payload),
    toFileUrl: () => {
      throw new Error("This private account review uses an OPFS vault.");
    },
  });
}

mount(Review, { target: document.getElementById("app")! });
