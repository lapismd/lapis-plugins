import type { SearchProviderHit, SearchResultProvider } from "@lapis-notes/api";
import type { ProviderResults } from "./search-provider-controller";

export type ProviderVersion = {
  provider: SearchResultProvider;
  hit: SearchProviderHit;
};
export type ProviderGroup = {
  id: string;
  title: string;
  path?: string;
  extension?: string;
  versions: ProviderVersion[];
};

export function groupProviderResults(rows: ProviderResults[]): ProviderGroup[] {
  const groups = new Map<string, ProviderGroup>();
  for (const row of rows)
    for (const hit of row.hits) {
      const id = hit.path ?? `${row.provider.id}:${hit.groupId}`;
      let group = groups.get(id);
      if (!group) {
        group = {
          id,
          title: hit.title,
          path: hit.path,
          extension: hit.extension,
          versions: [],
        };
        groups.set(id, group);
      }
      const content = hit.version?.contentId;
      const duplicate = content
        ? group.versions.find(
            (version) =>
              version.provider.id === row.provider.id &&
              version.hit.version?.contentId === content
          )
        : undefined;
      const reference = (item: SearchProviderHit) =>
        item.version
          ? {
              id: item.version.id,
              label: item.version.label,
              author: item.version.author,
              timestamp: item.version.timestamp,
              target: item.target,
            }
          : undefined;
      if (duplicate && duplicate.hit.version && hit.version) {
        const refs = new Map(
          (duplicate.hit.version.references ?? [reference(duplicate.hit)!]).map(
            (ref) => [ref.id, ref]
          )
        );
        refs.set(hit.version.id, reference(hit)!);
        const primary =
          hit.version.timestamp > duplicate.hit.version.timestamp
            ? hit
            : duplicate.hit;
        duplicate.hit = {
          ...primary,
          id: `${hit.groupId}/content/${content}`,
          version: {
            ...primary.version!,
            occurrences: refs.size,
            references: [...refs.values()].sort(
              (a, b) => b.timestamp - a.timestamp
            ),
          },
        };
      } else
        group.versions.push({
          provider: row.provider,
          hit: content
            ? { ...hit, id: `${hit.groupId}/content/${content}` }
            : hit,
        });
    }
  return [...groups.values()].map((group) => ({
    ...group,
    versions: group.versions.sort(
      (a, b) =>
        (b.hit.timestamp ?? 0) - (a.hit.timestamp ?? 0) ||
        a.hit.id.localeCompare(b.hit.id)
    ),
  }));
}
