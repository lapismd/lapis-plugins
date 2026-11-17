import { assertReleaseIsActive } from "../package-catalog.mjs";

export function assertRegistryHeadsActive(heads) {
  for (const head of heads) assertReleaseIsActive({ pluginId: head.pluginId });
}
