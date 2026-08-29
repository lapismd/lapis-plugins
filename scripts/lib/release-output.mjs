import { mkdir, rm } from "node:fs/promises";

export async function preparePluginReleaseRoot({ releaseRoot, clean }) {
  if (clean) {
    await rm(releaseRoot, { recursive: true, force: true });
  }
  await mkdir(releaseRoot, { recursive: true });
}
