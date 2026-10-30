// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
}

export function parseCanonicalJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}
