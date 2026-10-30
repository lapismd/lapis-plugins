import { createHash } from "node:crypto";
export const label = "dev.lapismd.lapis-plugins.validation";
export function validationConfig(local = {}, environment = process.env) {
  const config = {
    runtime: "docker",
    cpus: 8,
    memoryGiB: 24,
    shmGiB: 2,
    ...local,
  };
  config.runtime =
    environment.LAPIS_PLUGINS_VALIDATION_RUNTIME ?? config.runtime;
  config.context =
    environment.LAPIS_PLUGINS_VALIDATION_CONTEXT ?? config.context;
  config.archives =
    environment.LAPIS_PLUGINS_VALIDATION_ARCHIVES ?? config.archives;
  if (
    config.transport !== undefined &&
    !["docker", "ssh-cli"].includes(config.transport)
  )
    throw Error("Invalid Docker transport");
  if (
    config.sshMultiplexing !== undefined &&
    typeof config.sshMultiplexing !== "boolean"
  )
    throw Error("Invalid SSH multiplexing option");
  if (
    config.sshControlPath !== undefined &&
    (typeof config.sshControlPath !== "string" ||
      !/^\/[^\r\n\0]+$/.test(config.sshControlPath))
  )
    throw Error("Invalid SSH control path");
  if (!["docker", "native"].includes(config.runtime))
    throw Error("Invalid validation runtime");
  for (const key of ["cpus", "memoryGiB", "shmGiB"])
    if (!Number.isFinite(config[key]) || config[key] <= 0)
      throw Error(`Invalid ${key}`);
  if (
    config.context !== undefined &&
    (typeof config.context !== "string" || !config.context.trim())
  )
    throw Error("Invalid Docker context");
  return config;
}
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function imageKey(inputs) {
  return hash(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)),
      ),
    ),
  ).slice(0, 20);
}
export function validateArchives(entries) {
  if (!Array.isArray(entries)) throw Error("Package archives must be an array");
  const seen = new Set();
  for (const entry of entries) {
    if (
      !/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(entry.name ?? "") ||
      !/^\d+\.\d+\.\d+[-+\w.]*$/.test(entry.version ?? "") ||
      typeof entry.path !== "string" ||
      !entry.path.endsWith(".tgz") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    )
      throw Error("Invalid package archive identity, version, path or sha256");
    if (seen.has(entry.name)) throw Error(`Duplicate archive: ${entry.name}`);
    seen.add(entry.name);
  }
  return entries;
}
export const laneImage = () => "ui";

/** Eight shards bound browser lifetime. A CI quarter is two of those eighths. */
export function laneInvocations(lane, args) {
  if (lane !== "test:storybook") return [[...args]];
  if (args.length === 0)
    return Array.from({ length: 8 }, (_, index) => [`--shard=${index + 1}/8`]);
  const quarter = args.findIndex((arg) => /^--shard=[1-4]\/4$/.test(arg));
  if (quarter < 0) return [[...args]];
  const index = Number(args[quarter].slice("--shard=".length, -"/4".length));
  const rest = args.filter((_, position) => position !== quarter);
  return [index * 2 - 1, index * 2].map((eighth) => [
    `--shard=${eighth}/8`,
    ...rest,
  ]);
}
