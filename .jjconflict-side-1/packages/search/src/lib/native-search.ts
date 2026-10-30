import type { App, NativeBackgroundIndexingObserver } from "@lapis-notes/api";
import type { SearchPluginSettings } from "./search-settings";

export function hasNativeSearch(app: App): boolean {
  return Boolean(app.session?.backgroundIndexing);
}

export function nativeSearch(app: App): NativeBackgroundIndexingObserver {
  const observer = app.backgroundIndexing;
  if (!observer)
    throw new Error("The selected native Search observer is unavailable");
  return observer;
}

export async function configureNativeSearch(
  app: App,
  settings: SearchPluginSettings,
): Promise<NativeBackgroundIndexingObserver> {
  const observer = nativeSearch(app);
  const contribution = await observer.selectSearch({
    providers: app.searchDocumentProviders.getAll().map((provider) => ({
      provider_id: provider.id,
      version: provider.version ?? "1",
      priority: provider.priority ?? 0,
    })),
    chunking: { ...settings.chunking },
  });
  if (contribution.placement !== "native") {
    throw new Error(
      contribution.message ?? "Native Search cannot execute this provider",
    );
  }
  return observer;
}
