import {
  addBackupGateway,
  authenticatePasskey,
  checkCapabilities,
  decryptNsec,
  discoverPasskey,
  fetchKeytrEvents,
  parseKeytrEvent,
  publishKeytrEvent,
  setup,
  signalUnknownCredential,
} from "@sovit.xyz/keytr";
import type {
  CommunityKeytrCapabilities,
  CommunityKeytrLibrary,
} from "@lapismd/lapis-community/auth";

export const communityKeytrLibrary = {
  async checkCapabilities(): Promise<CommunityKeytrCapabilities> {
    const capabilities = await checkCapabilities();
    return {
      webauthn: capabilities.webauthn,
      platformAuthenticator: capabilities.platformAuthenticator,
      prf: capabilities.prf,
      relatedOrigins: capabilities.relatedOrigins,
      signalApi: capabilities.signalApi,
    };
  },
  setup,
  addBackupGateway,
  discoverPasskey,
  authenticatePasskey,
  fetchKeytrEvents,
  parseKeytrEvent,
  decryptNsec,
  publishKeytrEvent,
  signalUnknownCredential,
} satisfies CommunityKeytrLibrary;
