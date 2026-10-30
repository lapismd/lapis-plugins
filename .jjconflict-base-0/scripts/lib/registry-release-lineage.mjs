import {
  loadNip29RelayRegistryState,
  WebSocketRegistryRelay,
} from "@lapismd/lapis-community/nostr";
import { LAPIS_RELEASE_TOPIC } from "@lapismd/lapis-community/protocol";

export async function loadRegistryReleaseLineages(options) {
  const relayUrls = requiredList(options.relayUrls, "registry relay");
  const curatorPubkeys = new Set(
    requiredList(options.curatorPubkeys, "curator public key")
  );
  const publisherPubkeys = new Set(
    requiredList(options.publisherPubkeys, "publisher public key")
  );
  const authorityEpoch = required(options.authorityEpoch, "authority epoch");
  const quorum = options.quorum;
  if (
    !Number.isSafeInteger(quorum) ||
    quorum < 1 ||
    quorum > relayUrls.length
  ) {
    throw new Error("Registry relay quorum is invalid.");
  }

  const settled = await Promise.all(
    relayUrls.map(async (url) => {
      const relay = new WebSocketRegistryRelay(url);
      try {
        const state = await loadNip29RelayRegistryState({
          relays: [relay],
          authorities: {
            curatorPubkeys,
            defaultPublisherPubkeys: publisherPubkeys,
            publisherPubkeysByPlugin: new Map(),
            authorityEpoch,
          },
          generatedAt: options.generatedAt,
          signal: options.signal,
        });
        return { url, state };
      } finally {
        relay.close();
      }
    })
  );
  return { authorityEpoch, quorum, relays: settled };
}

export function resolveRegistryReleaseLineage(loaded, pluginId, version) {
  const candidates = loaded.relays.map(({ url, state }) => {
    const head = state.registry.heads.get(pluginId);
    const hasRelease = state.events.some(
      (event) =>
        event.tags.some(
          (tag) => tag[0] === "t" && tag[1] === LAPIS_RELEASE_TOPIC
        ) &&
        event.tags.some(
          (tag) => tag[0] === "t" && tag[1] === `plugin:${pluginId}`
        )
    );
    return { url, head, hasRelease };
  });
  const byHeadId = new Map();
  for (const candidate of candidates) {
    if (!candidate.head) continue;
    const current = byHeadId.get(candidate.head.event.id) ?? [];
    current.push(candidate);
    byHeadId.set(candidate.head.event.id, current);
  }
  const quorumHead = [...byHeadId.entries()]
    .filter(([, values]) => values.length >= loaded.quorum)
    .sort(([left], [right]) => left.localeCompare(right))[0]?.[1]?.[0]?.head;

  if (!quorumHead) {
    if (candidates.some((candidate) => candidate.hasRelease)) {
      throw new Error(
        `${pluginId}: existing releases require a curator-signed sequence-zero Registry head before a v2 release.`
      );
    }
    return {
      authorityEpoch: loaded.authorityEpoch,
      releaseSequence: "1",
      previousHeadReleases: [],
    };
  }
  if (quorumHead.content.authorityEpoch !== loaded.authorityEpoch) {
    throw new Error(`${pluginId}: Registry head authority epoch differs.`);
  }
  if (!quorumHead.fresh) {
    throw new Error(
      `${pluginId}: Registry head is stale; renew freshness before preparing a release.`
    );
  }
  if (
    quorumHead.content.releases.some((release) => release.version === version)
  ) {
    throw new Error(
      `${pluginId}@${version}: version already exists in the Registry head.`
    );
  }
  const ordered = quorumHead.content.releases.toSorted((left, right) => {
    const leftSequence = BigInt(left.releaseSequence ?? "0");
    const rightSequence = BigInt(right.releaseSequence ?? "0");
    if (leftSequence !== rightSequence) {
      return leftSequence < rightSequence ? -1 : 1;
    }
    return left.releaseEventId.localeCompare(right.releaseEventId);
  });
  const previous = ordered.at(-1);
  if (!previous) {
    throw new Error(`${pluginId}: Registry head contains no release evidence.`);
  }
  return {
    authorityEpoch: loaded.authorityEpoch,
    releaseSequence: (BigInt(previous.releaseSequence ?? "0") + 1n).toString(),
    previousReleaseEventId: previous.releaseEventId,
    previousHeadEvent: quorumHead.event,
    previousHeadReleases: quorumHead.content.releases,
    previousHeadRevision: quorumHead.content.headRevision,
  };
}

export function selectQuorumRegistryHeads(loaded) {
  const support = new Map();
  for (const relay of loaded.relays) {
    for (const [pluginId, head] of relay.state.registry.heads) {
      const key = `${pluginId}:${head.event.id}`;
      const current = support.get(key) ?? { pluginId, head, relays: [] };
      current.relays.push(relay.url);
      support.set(key, current);
    }
  }
  const byPlugin = new Map();
  for (const candidate of support.values()) {
    if (candidate.relays.length < loaded.quorum) continue;
    const existing = byPlugin.get(candidate.pluginId);
    if (
      existing !== undefined &&
      existing.head.event.id !== candidate.head.event.id
    ) {
      throw new Error(
        `${candidate.pluginId}: multiple Registry heads reached quorum.`
      );
    }
    byPlugin.set(candidate.pluginId, candidate);
  }
  return byPlugin;
}

export function registryReleaseEnvironment(environment = process.env) {
  return {
    relayUrls: split(environment.LAPIS_NOSTR_REGISTRY_RELAYS),
    curatorPubkeys: split(
      environment.LAPIS_NOSTR_CURATOR_PUBKEYS ??
        environment.LAPIS_NOSTR_CURATOR_PUBKEY
    ),
    publisherPubkeys: split(
      environment.LAPIS_NOSTR_PUBLISHER_PUBKEYS ??
        environment.LAPIS_NOSTR_PUBLISHER_PUBKEY
    ),
    authorityEpoch: environment.LAPIS_NOSTR_AUTHORITY_EPOCH,
    quorum: Number(environment.LAPIS_NOSTR_RELAY_QUORUM),
  };
}

function split(value) {
  return typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function requiredList(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`At least one ${label} is required.`);
  }
  return value;
}

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }
  return value;
}
