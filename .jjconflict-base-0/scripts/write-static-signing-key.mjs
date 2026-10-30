#!/usr/bin/env node
import { createPrivateKey } from "node:crypto";
import { writeFile } from "node:fs/promises";

const target = process.argv[2];
const secret = process.env.LAPIS_PLUGIN_RELEASE_PRIVATE_KEY;
if (!target || !secret)
  throw new Error("A signing-key target and encrypted CI secret are required.");
const normalized = secret.replaceAll("\\n", "\n").trim();
const pem = normalized.includes("-----BEGIN")
  ? normalized
  : Buffer.from(normalized, "base64").toString("utf8");
const key = createPrivateKey(pem);
if (key.asymmetricKeyType !== "ed25519")
  throw new Error("Static releases require an Ed25519 key.");
await writeFile(target, key.export({ format: "pem", type: "pkcs8" }), {
  mode: 0o600,
  flag: "wx",
});
