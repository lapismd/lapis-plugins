#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  createNip29RegistryHeadTemplate,
  parseNip29RegistryHead,
} from "@lapismd/lapis-community/protocol";

import {
  loadRegistryReleaseLineages,
  registryReleaseEnvironment,
  selectQuorumRegistryHeads,
} from "./lib/registry-release-lineage.mjs";
import { postJson, requestOidcToken } from "./nostr-release.mjs";

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}

export async function main(dependencies = {}) {
  const now = new Date(process.env.LAPIS_REGISTRY_RENEWED_AT ?? Date.now());
  if (!Number.isFinite(now.valueOf())) {
    throw new Error("LAPIS_REGISTRY_RENEWED_AT is invalid.");
  }
  const environment = registryReleaseEnvironment();
  const loaded = await loadRegistryReleaseLineages({
    ...environment,
    generatedAt: now.toISOString(),
  });
  const expiring = [...selectQuorumRegistryHeads(loaded).values()]
    .filter(({ head }) => headNeedsRenewal(head.content.validUntil, now))
    .toSorted((left, right) => left.pluginId.localeCompare(right.pluginId));
  if (expiring.length === 0) {
    console.log("No Registry heads need freshness renewal.");
    return;
  }
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const endpoint = requiredEnv("LAPIS_NOSTR_SIGNER_URL");
  const oidcToken = await requestOidcToken({ fetchImpl });
  const curatorPubkey = requiredEnv("LAPIS_NOSTR_CURATOR_PUBKEY");
  const heads = [];
  for (const candidate of expiring) {
    const createdAt = Math.max(
      Math.floor(now.valueOf() / 1_000),
      candidate.head.event.created_at + 1
    );
    const template = createRenewedHeadTemplate(candidate.head, createdAt);
    const response = await postJson(
      endpoint,
      {
        schema: "lapis.registry.head-signing-request/1",
        purpose: "registry-head-renewal",
        pluginId: candidate.pluginId,
        expectedPreviousHeadEventId: candidate.head.event.id,
        event: template,
      },
      oidcToken,
      fetchImpl
    );
    const parsed = parseNip29RegistryHead(response.event, candidate.pluginId);
    if (
      parsed === undefined ||
      response.event.pubkey !== curatorPubkey ||
      !sameTemplate(response.event, template)
    ) {
      throw new Error(
        `${candidate.pluginId}: signer returned a mismatched renewal head.`
      );
    }
    heads.push(response.event);
  }
  const publication = await postJson(
    endpoint,
    {
      schema: "lapis.registry.head-publication-request/1",
      purpose: "registry-head-publication",
      heads,
    },
    oidcToken,
    fetchImpl
  );
  const acknowledgements = Array.isArray(publication.acknowledgements)
    ? publication.acknowledgements
    : [];
  for (const head of heads) {
    const accepted = new Set(
      acknowledgements
        .filter(
          (entry) =>
            entry?.eventId === head.id &&
            entry?.accepted === true &&
            typeof entry.relay === "string"
        )
        .map((entry) => entry.relay)
    );
    if (accepted.size < environment.quorum) {
      throw new Error(
        `${head.id}: Registry head publication quorum not reached (${accepted.size}/${environment.quorum}).`
      );
    }
  }
  console.log(`Renewed ${heads.length} Registry head(s).`);
}

export function headNeedsRenewal(validUntil, now, windowDays = 7) {
  const expiresAt = Date.parse(validUntil);
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt - now.valueOf() <= windowDays * 24 * 60 * 60 * 1_000;
}

export function createRenewedHeadTemplate(head, createdAt) {
  const issuedAt = new Date(createdAt * 1_000).toISOString();
  return createNip29RegistryHeadTemplate(
    {
      ...head.content,
      headRevision: (BigInt(head.content.headRevision) + 1n).toString(),
      previousHeadEventId: head.event.id,
      issuedAt,
      validUntil: new Date(
        Date.parse(issuedAt) + 30 * 24 * 60 * 60 * 1_000
      ).toISOString(),
    },
    createdAt
  );
}

function sameTemplate(event, template) {
  return (
    event?.kind === template.kind &&
    event?.created_at === template.created_at &&
    event?.content === template.content &&
    canonicalJson(event?.tags) === canonicalJson(template.tags)
  );
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
