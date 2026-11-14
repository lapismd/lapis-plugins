import { beforeAll, describe, expect, it } from "vitest";
import { seedBundledSkills } from "./seed";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

describe("seedBundledSkills", () => {
  it("writes missing skills and preserves local edits on every update", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await seedBundledSkills(vault);
    const research = vault.getFileByPath(".agents/skills/research/SKILL.md");
    const lapis = vault.getFileByPath(".agents/skills/lapis-notes/SKILL.md");
    expect(research).toBeTruthy();
    expect(lapis).toBeTruthy();
    await vault.modify(research!, "user edited research");
    await seedBundledSkills(vault);
    expect(await vault.cachedRead(research!)).toBe("user edited research");
    await seedBundledSkills(vault, { overwrite: true });
    expect(await vault.cachedRead(research!)).toBe("user edited research");
  });
});
