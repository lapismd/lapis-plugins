// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import type { RevisionParent } from "./revision.js";

export type RevisionNode = {
  eventId: string;
  parents: RevisionParent[];
};

export function ancestorIds(
  start: string,
  nodes: Map<string, RevisionNode>,
): Set<string> {
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length) {
    const id = queue.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const node = nodes.get(id);
    for (const parent of node?.parents ?? []) {
      queue.push(parent.eventId);
    }
  }
  return seen;
}

export function isAncestor(
  candidate: string,
  descendant: string,
  nodes: Map<string, RevisionNode>,
): boolean {
  return ancestorIds(descendant, nodes).has(candidate);
}

export function maximalHeads(
  headIds: string[],
  nodes: Map<string, RevisionNode>,
): string[] {
  return headIds.filter(
    (id) =>
      !headIds.some((other) => other !== id && isAncestor(id, other, nodes)),
  );
}

export function nearestCommonAncestor(
  left: string,
  right: string,
  nodes: Map<string, RevisionNode>,
): string | null {
  const leftAncestors = ancestorIds(left, nodes);
  const queue = [right];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (leftAncestors.has(id)) return id;
    for (const parent of nodes.get(id)?.parents ?? []) {
      queue.push(parent.eventId);
    }
  }
  return null;
}
