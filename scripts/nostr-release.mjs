#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  createNip29CuratorDecisionTemplate,
  createNip29ReleaseMessageTemplate,
  parseNip29ReleaseEvent,
  verifyNostrReleaseProof,
} from "@lapismd/lapis-community/protocol";

import { selectReleases } from "./publish-approved-release.mjs";
import { buildNostrPluginBundle } from "./plugin-release.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main(process.argv.slice(2));
}

export async function main(args, dependencies = {}) {
  const options = parseOptions(args);
  const plan = JSON.parse(
    await readFile(path.join(root, ".release/release-plan.json"), "utf8")
  );
  const releases = selectReleases(plan.releases, options.selectors);
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const endpoint = requiredEnv("LAPIS_NOSTR_SIGNER_URL");
  const oidcToken = await requestOidcToken({ fetchImpl });

  if (options.role === "publisher") {
    for (const release of releases) {
      await signPublisherRelease({ release, endpoint, oidcToken, fetchImpl });
    }
    return;
  }
  if (options.role === "curator") {
    for (const release of releases) {
      await signCuratorDecision({ release, endpoint, oidcToken, fetchImpl });
    }
    return;
  }
  await publishProofs({ releases, endpoint, oidcToken, fetchImpl });
}

export async function signPublisherRelease({
  release,
  endpoint,
  oidcToken,
  fetchImpl,
}) {
  const request = await jsonFile(release.nostr.publisherRequestPath);
  const response = await postJson(endpoint, request, oidcToken, fetchImpl);
  const event = response.event;
  const parsed = parseNip29ReleaseEvent(event);
  const expectedTemplate = createNip29ReleaseMessageTemplate(
    request.pluginId,
    request.attachment,
    request.createdAt,
    request.message
  );
  if (
    parsed === undefined ||
    parsed.pluginId !== request.pluginId ||
    !sameTemplate(event, expectedTemplate) ||
    event.pubkey !== requiredEnv("LAPIS_NOSTR_PUBLISHER_PUBKEY")
  ) {
    throw new Error(
      `${request.pluginId}@${request.version}: signer returned a mismatched publisher event.`
    );
  }
  const outputPath = eventPath(release, "release-event");
  const curation = createCurationCandidate(release, event);
  await Promise.all([
    writeFile(outputPath, `${canonicalJson(event)}\n`),
    writeFile(curationPath(release), `${canonicalJson(curation)}\n`),
  ]);
  console.log(`Publisher signed ${curation.candidateId}.`);
}

export async function signCuratorDecision({
  release,
  endpoint,
  oidcToken,
  fetchImpl,
}) {
  const [publisherRequest, releaseEvent, storedCuration, manifestContent, artifact] =
    await Promise.all([
      jsonFile(release.nostr.publisherRequestPath),
      jsonFile(eventPath(release, "release-event")),
      jsonFile(curationPath(release)),
      readFile(path.join(root, release.nostr.manifest.path), "utf8"),
      readFile(path.join(root, release.payload.path)),
    ]);
  const curation = createCurationCandidate(release, releaseEvent);
  if (canonicalJson(storedCuration) !== canonicalJson(curation)) {
    throw new Error(
      `${release.pluginId}@${release.version}: stored curation candidate differs.`
    );
  }
  const request = {
    schema: "lapis.registry.curator-signing-request/1",
    purpose: "curator-approval",
    candidateId: curation.candidateId,
    repository: release.repository,
    sourceCommit: release.sourceCommit,
    pluginId: release.pluginId,
    version: release.version,
    releaseEvent,
    decision: "approved",
    createdAt: Math.max(
      publisherRequest.createdAt,
      Number(
        process.env.LAPIS_CURATOR_DECISION_CREATED_AT ??
          publisherRequest.createdAt
      )
    ),
  };
  const response = await postJson(endpoint, request, oidcToken, fetchImpl);
  const proof = {
    schema: "lapis.plugin.release-proof/1",
    authorizationEvent: response.authorizationEvent,
    releaseEvent,
    decisionEvent: response.decisionEvent,
    manifest: {
      sha256: release.nostr.manifest.sha256,
      size: Buffer.byteLength(manifestContent),
      content: manifestContent,
    },
  };
  const curatorPubkey = requiredEnv("LAPIS_NOSTR_CURATOR_PUBKEY");
  verifyNostrReleaseProof(proof, {
    artifact,
    trustedCuratorPubkeys: new Set([curatorPubkey]),
  });
  const expectedDecision = createNip29CuratorDecisionTemplate(
    releaseEvent.id,
    "approved",
    request.createdAt
  );
  if (!sameTemplate(response.decisionEvent, expectedDecision)) {
    throw new Error(
      `${release.pluginId}@${release.version}: signer returned a mismatched curator decision.`
    );
  }
  const proofPath = eventPath(release, "proof");
  await Promise.all([
    writeFile(
      eventPath(release, "publisher-authorization-event"),
      `${canonicalJson(response.authorizationEvent)}\n`
    ),
    writeFile(
      eventPath(release, "decision-event"),
      `${canonicalJson(response.decisionEvent)}\n`
    ),
    writeFile(proofPath, `${canonicalJson(proof)}\n`),
  ]);
  const sealed = await buildNostrPluginBundle({
    pluginId: release.pluginId,
    version: release.version,
    payloadPath: path.join(root, release.payload.path),
    proofPath,
    out: path.join(root, path.dirname(release.payload.path), release.assetName),
  });
  await writeFile(
    `${sealed.bundlePath}.sha256`,
    `${sealed.bundle.sha256}  ${sealed.bundle.path}\n`
  );
  console.log(`Curator approved ${curation.candidateId}.`);
}

export async function publishProofs({
  releases,
  endpoint,
  oidcToken,
  fetchImpl,
}) {
  const candidates = await Promise.all(
    releases.map(async (release) => {
      const [storedCuration, proof] = await Promise.all([
        jsonFile(curationPath(release)),
        jsonFile(eventPath(release, "proof")),
      ]);
      const curation = createCurationCandidate(release, proof.releaseEvent);
      if (canonicalJson(storedCuration) !== canonicalJson(curation)) {
        throw new Error(
          `${release.pluginId}@${release.version}: stored curation candidate differs.`
        );
      }
      return {
        candidateId: curation.candidateId,
        proof,
      };
    })
  );
  const response = await postJson(
    endpoint,
    {
      schema: "lapis.registry.relay-publication-request/1",
      purpose: "relay-publication",
      candidates,
    },
    oidcToken,
    fetchImpl
  );
  const quorum = Number(requiredEnv("LAPIS_NOSTR_RELAY_QUORUM"));
  const acknowledgements = Array.isArray(response.acknowledgements)
    ? response.acknowledgements
    : [];
  for (const candidate of candidates) {
    const accepted = new Set(
      acknowledgements
        .filter(
          (entry) =>
            entry?.candidateId === candidate.candidateId &&
            entry?.accepted === true &&
            typeof entry.relay === "string"
        )
        .map((entry) => entry.relay)
    );
    if (!Number.isSafeInteger(quorum) || quorum < 1 || accepted.size < quorum) {
      throw new Error(
        `${candidate.candidateId}: relay quorum not reached (${accepted.size}/${quorum}).`
      );
    }
  }
  console.log(`Published ${candidates.length} curated Nostr release proof(s).`);
}

export async function requestOidcToken({ fetchImpl = fetch } = {}) {
  const requestUrl = requiredEnv("ACTIONS_ID_TOKEN_REQUEST_URL");
  const requestToken = requiredEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN");
  const audience = requiredEnv("LAPIS_NOSTR_SIGNER_AUDIENCE");
  const url = new URL(requestUrl);
  url.searchParams.set("audience", audience);
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${requestToken}` },
  });
  if (!response.ok) {
    throw new Error(`GitHub OIDC token request failed: ${response.status}.`);
  }
  const body = await response.json();
  if (typeof body.value !== "string" || body.value.length === 0) {
    throw new Error("GitHub OIDC response did not contain a token.");
  }
  return body.value;
}

async function postJson(endpoint, body, oidcToken, fetchImpl) {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${oidcToken}`,
      "Content-Type": "application/json",
    },
    body: canonicalJson(body),
  });
  if (!response.ok) {
    throw new Error(
      `Nostr signing broker rejected the request: ${response.status}.`
    );
  }
  return response.json();
}

function sameTemplate(event, template) {
  return (
    event?.kind === template.kind &&
    event?.created_at === template.created_at &&
    event?.content === template.content &&
    canonicalJson(event?.tags) === canonicalJson(template.tags)
  );
}

function eventPath(release, suffix) {
  return path.join(
    root,
    path.dirname(release.payload.path),
    `${release.assetName}.${suffix}.json`
  );
}

function curationPath(release) {
  return path.join(
    root,
    path.dirname(release.payload.path),
    `${release.assetName}.curation.json`
  );
}

export function createCurationCandidate(release, releaseEvent) {
  const coordinates = {
    schema: "lapis.registry.curation-candidate/1",
    buildCandidateId: release.nostr.candidateId,
    repository: release.repository,
    sourceCommit: release.sourceCommit,
    pluginId: release.pluginId,
    version: release.version,
    releaseEventId: releaseEvent.id,
    manifestSha256: release.nostr.manifest.sha256,
    manifestSize: release.nostr.manifest.size,
    artifactSha256: release.payload.sha256,
    artifactSize: release.payload.size,
  };
  return {
    ...coordinates,
    candidateId: createHash("sha256")
      .update(canonicalJson(coordinates))
      .digest("hex"),
  };
}

async function jsonFile(relativePath) {
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(root, relativePath);
  return JSON.parse(await readFile(filePath, "utf8"));
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function parseOptions(args) {
  const options = { role: undefined, selectors: ["all"] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--role") {
      options.role = args[++index];
    } else if (arg === "--plugins") {
      options.selectors = (args[++index] ?? "").split(",").filter(Boolean);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!["publisher", "curator", "publish"].includes(options.role)) {
    throw new Error("--role must be publisher, curator, or publish.");
  }
  if (options.selectors.length === 0) {
    throw new Error("--plugins requires at least one selector.");
  }
  return options;
}
