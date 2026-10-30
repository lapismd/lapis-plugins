import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkFrameworkPublication } from "./check-framework-publication.mjs";

test("checks the published framework ranges and controller without Community", () => {
  const coordinates = [];
  checkFrameworkPublication({
    lookup(coordinate) {
      coordinates.push(coordinate);
      return {
        status: 0,
        stdout: JSON.stringify(
          coordinate.includes("workspace") ? ["0.2.0"] : "0.1.2"
        ),
      };
    },
  });
  assert.ok(coordinates.includes("@lapis-notes/api@^0.2.0"));
  assert.ok(coordinates.includes("@lapis-notes/workspace@^0.3.0"));
  assert.ok(coordinates.includes("@lapis-notes/file-explorer@^0.2.0"));
  assert.ok(coordinates.includes("@lapis-notes/ui@^0.1.4"));
  assert.ok(coordinates.includes("@lapis-notes/language-service@^0.1.2"));
  assert.ok(coordinates.includes("@lapismd/ai-controller@^0.1.0"));
  assert.equal(coordinates.length, 6);
  assert.ok(
    coordinates.every((coordinate) => !coordinate.includes("community"))
  );
});

test("missing packages and empty npm responses fail the prerequisite", () => {
  for (const result of [
    { status: 1, stderr: "E404" },
    { status: 0, stdout: "[]" },
    { status: 0, stdout: "{}" },
  ]) {
    assert.throws(
      () => checkFrameworkPublication({ lookup: () => result }),
      /prerequisite unavailable|no published versions/
    );
  }
});

test("the actual aggregate rejects every skipped, failed, and cancelled lane", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  const script = workflow
    .split("  validate:")[1]
    .split("        run: |\n")[1]
    .replace(/^          /gm, "");
  const lanes = [
    "PREREQUISITE",
    "IMAGE_PIN",
    "BUILD_CACHE",
    "QUALITY",
    "UNIT",
    "STORYBOOK_STATIC",
    "STORYBOOK_INTERACTION",
    "RELEASE_ARTIFACTS",
  ];
  const success = Object.fromEntries(lanes.map((lane) => [lane, "success"]));
  Object.assign(success, {
    CHANGES: "success",
    SPEC_ONLY: "false",
    SPECIFICATION: "skipped",
  });
  const run = (env) =>
    spawnSync("bash", ["-c", script], {
      env: { ...process.env, ...env },
      encoding: "utf8",
    });
  assert.equal(run(success).status, 0);
  for (const lane of lanes)
    for (const result of ["skipped", "failure", "cancelled"]) {
      assert.notEqual(
        run({ ...success, [lane]: result }).status,
        0,
        `${lane}: ${result}`
      );
    }
  assert.notEqual(
    run({
      ...success,
      FRAMEWORK_READY: "false",
      ...Object.fromEntries(lanes.slice(2).map((lane) => [lane, "skipped"])),
    }).status,
    0
  );
  for (const result of ["skipped", "failure", "cancelled", ""]) {
    assert.notEqual(run({ ...success, CHANGES: result }).status, 0);
  }
  for (const mode of ["", "unknown"]) {
    assert.notEqual(run({ ...success, SPEC_ONLY: mode }).status, 0);
  }
  assert.notEqual(run({ ...success, SPECIFICATION: "failure" }).status, 0);
});

test("the actual aggregate accepts only a successful spec route with full lanes skipped", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  const script = workflow
    .split("  validate:")[1]
    .split("        run: |\n")[1]
    .replace(/^          /gm, "");
  const fullLanes = [
    "PREREQUISITE",
    "BUILD_CACHE",
    "QUALITY",
    "UNIT",
    "STORYBOOK_STATIC",
    "STORYBOOK_INTERACTION",
    "RELEASE_ARTIFACTS",
  ];
  const success = {
    CHANGES: "success",
    SPEC_ONLY: "true",
    IMAGE_PIN: "success",
    SPECIFICATION: "success",
    ...Object.fromEntries(fullLanes.map((lane) => [lane, "skipped"])),
  };
  const run = (env) =>
    spawnSync("bash", ["-c", script], {
      env: { ...process.env, ...env },
      encoding: "utf8",
    });
  assert.equal(run(success).status, 0);
  for (const lane of ["CHANGES", "IMAGE_PIN", "SPECIFICATION"]) {
    for (const result of ["skipped", "failure", "cancelled", ""]) {
      assert.notEqual(
        run({ ...success, [lane]: result }).status,
        0,
        `${lane}: ${result}`
      );
    }
  }
  for (const lane of fullLanes) {
    for (const result of ["success", "failure", "cancelled", ""]) {
      assert.notEqual(
        run({ ...success, [lane]: result }).status,
        0,
        `${lane}: ${result}`
      );
    }
  }
  assert.notEqual(run({ ...success, SPEC_ONLY: "false" }).status, 0);
});
