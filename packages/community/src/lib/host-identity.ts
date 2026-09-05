import type {
  NostrPluginSigner,
  NostrSignerAccount,
  NostrSignerHost,
} from "@lapis-notes/api";
import type {
  CommunityApplicationLoginOptions,
  CommunityLoginCredentials,
  CommunityLoginMethodModel,
} from "@lapismd/lapis-community/components";
import type { CommunityIdentity } from "@lapismd/lapis-community/community";

const ACCOUNT_METHOD_PREFIX = "host-account:";
const CREATE_ACCOUNT_METHOD = {
  id: "create-account",
  kind: "create-account",
  label: "Create a new account",
  description: "Generate and secure a fresh Nostr key",
} as const satisfies CommunityLoginMethodModel;
const REMOTE_SIGNER_METHOD = {
  id: "remote-signer",
  kind: "remote-signer",
  label: "Remote signer",
  description: "NIP-46 — connect with a bunker URL",
} as const satisfies CommunityLoginMethodModel;

export class CommunityHostIdentityProvider {
  readonly #signer: NostrPluginSigner;
  readonly #accounts = new Map<string, NostrSignerAccount>();
  #activeAccountId: string | undefined;

  constructor(host: NostrSignerHost) {
    this.#signer = host.forPlugin("community");
  }

  async methods(): Promise<readonly CommunityLoginMethodModel[]> {
    this.#accounts.clear();
    for (const account of await this.#signer.listAccounts()) {
      this.#accounts.set(accountMethodId(account.id), account);
    }
    return [
      ...[...this.#accounts.entries()].map(([id, account]) => ({
        id,
        kind: "other" as const,
        label: account.label,
        description:
          account.kind === "nip46"
            ? "Saved NIP-46 remote signer"
            : "Profile secured by this device",
      })),
      CREATE_ACCOUNT_METHOD,
      REMOTE_SIGNER_METHOD,
    ];
  }

  options(
    methods: readonly CommunityLoginMethodModel[]
  ): CommunityApplicationLoginOptions {
    return {
      methods,
      allowLocalKeyMethods: true,
      title: "Sign in to Community",
      description: "Use a host-owned Nostr identity",
      footnote:
        "Keys and remote-signer credentials stay in the operating-system keychain. Community receives only approved results.",
      connect: (methodId, credentials) => this.connect(methodId, credentials),
    };
  }

  async connect(
    methodId: string,
    credentials?: CommunityLoginCredentials
  ): Promise<CommunityIdentity> {
    let account: NostrSignerAccount | undefined;
    if (methodId === CREATE_ACCOUNT_METHOD.id) {
      account = await this.#signer.requestProfileCreation();
    } else if (methodId === REMOTE_SIGNER_METHOD.id) {
      const bunkerUrl = credentials?.remoteSignerUrl?.trim();
      if (!bunkerUrl) throw new Error("A bunker URL is required");
      account = await this.#signer.connectRemoteSigner({ bunkerUrl });
    } else {
      account = this.#accounts.get(methodId);
    }
    if (!account) throw new Error("The selected Nostr account is unavailable");
    this.#activeAccountId = account.id;
    return identityFor(this.#signer, account.id);
  }

  async close(): Promise<void> {
    const accountId = this.#activeAccountId;
    this.#activeAccountId = undefined;
    if (accountId) await this.#signer.close(accountId);
  }
}

export function identityFor(
  signer: NostrPluginSigner,
  accountId: string
): CommunityIdentity {
  return {
    getPublicKey: () => signer.getPublicKey(accountId),
    signEvent: (template) => signer.signEvent(accountId, template),
    nip44: {
      encrypt: (pubkey, plaintext) =>
        signer.nip44Encrypt(accountId, pubkey, plaintext),
      decrypt: (pubkey, ciphertext) =>
        signer.nip44Decrypt(accountId, pubkey, ciphertext),
    },
  };
}

function accountMethodId(accountId: string): string {
  return `${ACCOUNT_METHOD_PREFIX}${encodeURIComponent(accountId)}`;
}
