import assert from "node:assert/strict";

export function functionKeys(markdown) {
  let scope = "";
  const keys = [];
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^## (.+)/);
    if (heading)
      scope = heading[1]
        .replace(" type", "")
        .toLowerCase()
        .replaceAll(" ", "-");
    const method = line.match(/^### `([\w]+)\(\)`/);
    if (method) keys.push(`${scope}.${method[1]}`);
  }
  return keys;
}

export function validateInventory(inventory, upstream) {
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(upstream.schemaVersion, 1);
  const functionDoc = upstream.documents.find((doc) =>
    doc.path.endsWith("/Functions.md")
  );
  assert(functionDoc, "Missing Functions reference");
  assert.deepEqual(
    functionKeys(functionDoc.headings.join("\n")),
    upstream.functions,
    "Function snapshot must match reviewed headings"
  );
  assert(inventory.features.length, "Empty inventory");
  const ids = new Set();
  const covered = new Set();
  for (const feature of inventory.features) {
    assert.match(feature.id, /^BASES-[A-Z]+-\d{3}$/);
    assert(!ids.has(feature.id), `Duplicate feature ${feature.id}`);
    ids.add(feature.id);
    assert(
      feature.title && feature.owner && feature.notes && feature.source,
      `Missing evidence for ${feature.id}`
    );
    assert(["P0", "P1", "P2"].includes(feature.priority));
    if (feature.difference) {
      assert(["intentional", "deferred"].includes(feature.difference.kind));
      assert(
        feature.difference.reason && feature.difference.evidence,
        `Missing difference rationale for ${feature.id}`
      );
    }
    assert(
      upstream.documents.some((doc) => feature.source.startsWith(doc.url)),
      `Unknown source for ${feature.id}`
    );
    assert(
      feature.probes?.length || feature.review,
      `No probe or review evidence for ${feature.id}`
    );
    const probeIds = new Set();
    for (const probe of feature.probes ?? []) {
      assert(
        probe.id && !probeIds.has(probe.id),
        `Duplicate probe in ${feature.id}`
      );
      probeIds.add(probe.id);
      assert(
        [
          "expression",
          "filter",
          "document",
          "parser",
          "compile-error",
        ].includes(probe.mode)
      );
      assert(
        Object.hasOwn(probe, "expected"),
        `Missing expected result in ${feature.id}`
      );
    }
    for (const key of feature.functions ?? []) {
      assert(!covered.has(key), `Duplicate function coverage ${key}`);
      assert(
        upstream.functions.includes(key),
        `Unknown documented function ${key}`
      );
      covered.add(key);
    }
  }
  assert.deepEqual(
    [...covered].sort(),
    [...upstream.functions].sort(),
    "Every documented function needs an explicit audit entry"
  );
}

const escape = (value) =>
  String(value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replaceAll("`", "'");

export function renderReport(report, upstream) {
  const counts = Object.fromEntries(
    ["supported", "partial", "gap", "review-required"].map((status) => [
      status,
      report.results.filter((it) => it.status === status).length,
    ])
  );
  const lines = [
    "# Bases compatibility with Obsidian",
    "",
    `Documentation reviewed: ${upstream.reviewedAt}. This is documentation-derived acceptance against Lapis source, not a live Obsidian differential test.`,
    "",
    `${counts.supported} supported, ${counts.partial} partial, ${counts.gap} gaps, ${counts["review-required"]} requiring manual review. Counts describe the selected probes, not a percentage of product parity.`,
    "",
    "Run `pnpm audit:bases` to check behavior and report freshness; `pnpm audit:bases:update` explicitly accepts changed results. Run `pnpm audit:bases:upstream` to detect upstream documentation drift. See [audit workflow](README.md).",
    "",
    "## Priority",
    "",
    "P0: imported filters silently broaden results. P1: filter/formula evaluation and typed values. P2: view, rendering, grouping, and integration acceptance.",
    "",
    "## Feature inventory",
    "",
    "Supported means all listed probes passed; partial means some passed; gap means none passed. Review-required entries carry source-review evidence and need governed UI or integration acceptance. Parser-only probes never establish evaluator support.",
    "",
    "| ID | Priority | Feature | Result | Probes | Notes |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const item of report.results) {
    const observations = item.observations ?? [];
    lines.push(
      `| ${item.id} | ${item.priority} | [${escape(item.title)}](${
        item.source
      }) | ${item.status} | ${observations.filter((it) => it.pass).length}/${
        observations.length
      } | ${escape(item.notes)} |`
    );
  }
  const differences = report.results.filter((item) => item.difference);
  if (differences.length) {
    lines.push(
      "",
      "## Retained differences",
      "",
      "These flags explain retained behavior or deferred scope. They do not turn failing Obsidian expectations into passes.",
      "",
      "| ID | Disposition | Rationale and evidence |",
      "| --- | --- | --- |"
    );
    for (const item of differences)
      lines.push(
        `| ${item.id} | ${item.difference.kind} | ${escape(
          item.difference.reason
        )} Evidence: ${escape(item.difference.evidence)} |`
      );
  }
  lines.push("", "## Failing probes", "");
  for (const item of report.results) {
    const failed = (item.observations ?? []).filter((it) => !it.pass);
    if (!failed.length) continue;
    lines.push(
      `### ${item.id}: ${item.title}`,
      "",
      `Owner: ${item.owner}. ${item.notes}`,
      ""
    );
    for (const probe of failed) {
      const input = item.probes?.find((it) => it.id === probe.id);
      const syntax =
        input?.expression ?? JSON.stringify(input?.filter ?? input?.document);
      lines.push(
        `- ${probe.id} — \`${escape(syntax)}\`: expected \`${escape(
          JSON.stringify(probe.expected)
        )}\`; ${
          probe.error
            ? `error \`${escape(probe.error)}\``
            : `actual \`${escape(JSON.stringify(probe.actual))}\``
        }.`
      );
    }
    lines.push("");
  }
  lines.push("## Sources", "");
  for (const doc of upstream.documents)
    lines.push(`- [${doc.path}](${doc.url}), Git blob \`${doc.blob}\`.`);
  return lines.join("\n") + "\n";
}


export function assertProvenanceOnlyRefresh(previous, actual) {
  assert.deepEqual(
    Object.keys(previous.implementation.dependencies).sort(),
    Object.keys(actual.implementation.dependencies).sort(),
    "Provenance refresh cannot change dependency identities"
  );
  const admitted = structuredClone(previous);
  admitted.implementation.packageVersion = actual.implementation.packageVersion;
  admitted.implementation.dependencies = structuredClone(actual.implementation.dependencies);
  assert.deepEqual(
    admitted,
    actual,
    "Provenance refresh cannot change compatibility evidence"
  );
}
