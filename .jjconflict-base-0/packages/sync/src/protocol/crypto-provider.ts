// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import type {
  SyncCryptoObjectType,
  SyncIdentitySigningPurpose,
  UnsignedSyncEvent,
} from "./crypto-types.js";
import type { SignedNostrEvent } from "./types.js";

export interface SyncCryptoProvider {
  /** Current device identity, used for provenance and membership authority. */
  readonly publicKey: string;
  /** Stable per-vault remote-service identity. */
  readonly syncPublicKey: string;
  encryptObject(input: {
    epoch: number;
    type: SyncCryptoObjectType;
    plaintext: Uint8Array;
  }): Promise<{ bytes: Uint8Array; objectHash: string }>;
  decryptObject(input: {
    epoch: number;
    type: SyncCryptoObjectType;
    envelope: Uint8Array;
  }): Promise<Uint8Array>;
  calculateContentId(input: {
    epoch: number;
    plaintext: Uint8Array;
  }): Promise<string>;
  /** @deprecated Use signDeviceEvent or signTransportEvent explicitly. */
  signEvent(event: UnsignedSyncEvent): Promise<SignedNostrEvent>;
  signDeviceEvent(event: UnsignedSyncEvent): Promise<SignedNostrEvent>;
  signTransportEvent(
    event: UnsignedSyncEvent,
    options?: {
      purpose?: SyncIdentitySigningPurpose;
      identity?: "active" | "pending";
    },
  ): Promise<SignedNostrEvent>;
}
