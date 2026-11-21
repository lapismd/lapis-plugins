import { createHash } from "node:crypto";
import { isDeepStrictEqual as equal } from "node:util";

// Reviewed source, never loaded from a candidate manifest, actor or environment.
// The immutable receipt is populated after the complete candidate is assembled.
const receipt = {
  sourceSha: "32b1680b478e8094716c94cdc89a4854660bf4d8",
  policy: "83acf38da08046331ae7d7475df1c73e01a0706aa7a9a97b36e1aa04c5a5cf52",
  before: {
    "package.json":
      "41a9b712397d54583ddbea6ed63e7941f6f0ab4f61631736e5b62da8354ccdb5",
    "pnpm-workspace.yaml":
      "95df0bbc119e77933b938121b60e54405d8507cb2fc3c4b8c17d9534f6d63c1b",
    "pnpm-lock.yaml":
      "be9658feabf282ff00574ef528977cfe59a75efe62edd91e5b1401908caeca8f",
  },
  after: {
    "package.json":
      "c56060c35754cadd0c5b544f5e5bfd965a9ee9c0f9d95b16f27bd4c7b92aeb80",
    "pnpm-workspace.yaml":
      "95df0bbc119e77933b938121b60e54405d8507cb2fc3c4b8c17d9534f6d63c1b",
    "pnpm-lock.yaml":
      "66c9de00de9b8872d5aeeb18081ab7897d4fc04e8bbdcc3938d51ac94288b2b6",
  },
  baseDocuments:
    "b548b6959f8fb2a20c02a3672301275e6192aeb9a010698d11b6bf2e24311d29",
  documents:
    "8e0962fdb9e03795964b83f715a03e765321902cb8a7add1b78975573894446a",
  paths: [
    "docs/bases-compatibility/report.json",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/dependency-automation/check-workspace-intake.mjs",
    "scripts/dependency-automation/reviewed-notes-design-cohort-transition.mjs",
    "scripts/dependency-automation/reviewed-notes-design-cohort-transition.test.mjs",
    "scripts/dependency-automation/source-intake-reader.mjs",
    "scripts/dependency-automation/source-intake-reader.test.mjs",
    "scripts/dependency-automation/workspace-catalog.mjs",
    "scripts/dependency-automation/workspace-intake.mjs",
    "scripts/dependency-automation/workspace-intake.test.mjs",
    "scripts/fixtures/reviewed-notes-design-cohort-transition.json.gz",
    "scripts/validation/lanes.json",
    "spec/records/2026-11-21-notes-design-cohort-alignment.md",
    "spec/src/distribution.md",
    "spec/src/native-services.md",
    "spec/src/plugins/bases/index.md",
    "spec/src/plugins/bookmarks/index.md",
    "spec/src/plugins/canvas/index.md",
    "spec/src/plugins/csv/index.md",
    "spec/src/plugins/docx/index.md",
    "spec/src/plugins/graph/index.md",
    "spec/src/plugins/history/index.md",
    "spec/src/plugins/markdown-lint/index.md",
    "spec/src/plugins/markdown/index.md",
    "spec/src/plugins/pdf/index.md",
    "spec/src/plugins/search/index.md",
    "spec/src/plugins/slides/index.md",
    "spec/src/plugins/source-editor/index.md",
    "spec/src/plugins/spellcheck/index.md",
    "spec/src/plugins/transcripts/index.md",
    "spec/src/plugins/wordcount/index.md",
    "spec/src/spec-governance.md",
    "spec/src/verification.md",
  ],
};

const hash = (value) => createHash("sha256").update(value).digest("hex");

export function reviewedNotesDesignCohortTransition(data) {
  if (
    !data.changedFiles.includes(
      "scripts/dependency-automation/reviewed-notes-design-cohort-transition.mjs",
    )
  )
    return null;
  const fail = () => {
    throw Error("Reviewed Notes and Design cohort transition binding mismatch");
  };
  if (
    data.sourceSha !== receipt.sourceSha ||
    hash(data.policyBytes) !== receipt.policy ||
    hash(data.basePolicyBytes) !== receipt.policy ||
    !equal([...data.changedFiles].sort(), receipt.paths)
  )
    fail();
  for (const [field, values] of Object.entries({
    before: receipt.before,
    files: receipt.after,
  })) {
    if (!data[field]) fail();
    for (const [path, digest] of Object.entries(values))
      if (
        typeof data[field][path] !== "string" ||
        hash(data[field][path]) !== digest
      )
        fail();
  }
  if (
    !data.baseDocuments ||
    !data.documents ||
    hash(JSON.stringify(data.baseDocuments)) !== receipt.baseDocuments ||
    hash(JSON.stringify(data.documents)) !== receipt.documents
  )
    fail();
  return { paths: receipt.paths, notesDesignCohortTransition: true };
}
