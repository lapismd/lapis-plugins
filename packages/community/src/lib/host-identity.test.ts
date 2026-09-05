import { NostrSignerHost, type NostrSignerBroker } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";

import { CommunityHostIdentityProvider } from "./host-identity";

function broker(): NostrSignerBroker {
  return {
    listAccounts: vi.fn(async () => [
      {
        id: "local-1",
        label: "Steve",
        pubkey: "a".repeat(64),
        kind: "local" as const,
      },
    ]),
    requestProfileCreation: vi.fn(async () => ({
      id: "created-1",
      label: "Nostr profile",
      pubkey: "b".repeat(64),
      kind: "local" as const,
    })),
    connectRemoteSigner: vi.fn(async () => ({
      id: "remote-1",
      label: "Remote Nostr signer",
      pubkey: "c".repeat(64),
      kind: "nip46" as const,
    })),
    getPublicKey: vi.fn(async (_context, accountId) =>
      accountId === "remote-1" ? "c".repeat(64) : "a".repeat(64)
    ),
    signEvent: vi.fn(async (_context, _accountId, event) => ({
      ...event,
      id: "d".repeat(64),
      pubkey: "a".repeat(64),
      sig: "e".repeat(128),
    })),
    nip44Encrypt: vi.fn(async () => "ciphertext"),
    nip44Decrypt: vi.fn(async () => "plaintext"),
    close: vi.fn(async () => undefined),
  };
}

describe("CommunityHostIdentityProvider", () => {
  it("offers stored, create-profile, and remote-signer methods", async () => {
    const provider = new CommunityHostIdentityProvider(
      new NostrSignerHost(broker())
    );
    expect((await provider.methods()).map((method) => method.id)).toEqual([
      "host-account:local-1",
      "create-account",
      "remote-signer",
    ]);
  });

  it("adapts a stored account to opaque signer operations", async () => {
    const signerBroker = broker();
    const provider = new CommunityHostIdentityProvider(
      new NostrSignerHost(signerBroker)
    );
    await provider.methods();
    const identity = await provider.connect("host-account:local-1");
    expect(await identity.getPublicKey()).toBe("a".repeat(64));
    await identity.nip44?.encrypt("f".repeat(64), "hello");
    expect(signerBroker.nip44Encrypt).toHaveBeenCalledWith(
      { pluginId: "community" },
      "local-1",
      "f".repeat(64),
      "hello"
    );
  });

  it("hands a NIP-46 invitation to the host and closes the session", async () => {
    const signerBroker = broker();
    const provider = new CommunityHostIdentityProvider(
      new NostrSignerHost(signerBroker)
    );
    await provider.connect("remote-signer", {
      remoteSignerUrl: "bunker://remote.example",
    });
    expect(signerBroker.connectRemoteSigner).toHaveBeenCalledWith(
      { pluginId: "community" },
      { bunkerUrl: "bunker://remote.example" }
    );
    await provider.close();
    expect(signerBroker.close).toHaveBeenCalledWith(
      { pluginId: "community" },
      "remote-1"
    );
  });
});
