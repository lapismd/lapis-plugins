import { describe, expect, it } from "vitest";
import {
  credentialMatchesRemote,
  remoteDisplayUrl,
  validRemoteDraft,
  type RemoteConnectionDraft,
} from "./remotes-settings";

const connection: RemoteConnectionDraft = {
  name: "origin",
  url: "https://forge.example/alex/notes.git",
  branch: "notes/main",
  bookmark: "main",
  authentication: "token",
  credential: "opaque-host-reference",
};
describe("remote connection presentation", () => {
  it("does not offer another host's saved credential or silently change ports", () => {
    const credential = {
      id: "opaque",
      label: "Notes",
      host: "forge.example",
      username: "alex",
      method: "token" as const,
      available: true,
    };
    expect(credentialMatchesRemote(credential, connection.url)).toBe(true);
    expect(credentialMatchesRemote(credential, "https://other.example/notes.git")).toBe(false);
    expect(credentialMatchesRemote(credential, "https://forge.example:8443/notes.git")).toBe(false);
    expect(credentialMatchesRemote(credential, "not a URL")).toBe(false);
  });
  it("removes URL credentials, query strings and fragments from displayed endpoints", () => {
    expect(
      remoteDisplayUrl(
        "https://alex:synthetic-secret@forge.example/notes.git?token=private#secret",
      ),
    ).toBe("https://forge.example/notes.git");
  });
  it("retains SSH usernames while removing passwords and query strings", () => {
    expect(
      remoteDisplayUrl("ssh://git:synthetic-secret@forge.example/notes.git?token=private"),
    ).toBe("ssh://git@forge.example/notes.git");
    expect(remoteDisplayUrl("git@forge.example:alex/notes.git")).toBe(
      "git@forge.example:alex/notes.git",
    );
  });
  it.each(["file:///private/notes", "javascript:secret", "not a remote address"])(
    "does not echo unsupported endpoints: %s",
    (url) => {
      expect(remoteDisplayUrl(url)).not.toContain(url);
    },
  );
  it("admits explicit HTTPS and SSH transport/authentication pairs", () => {
    expect(validRemoteDraft(connection)).toBe(true);
    expect(validRemoteDraft({ ...connection, authentication: "anonymous", credential: "" })).toBe(
      true,
    );
    expect(
      validRemoteDraft({
        ...connection,
        url: "ssh://git@forge.example/notes.git",
        authentication: "ssh-default",
      }),
    ).toBe(true);
    expect(
      validRemoteDraft({
        ...connection,
        url: "git@forge.example:alex/notes.git",
        authentication: "ssh-agent",
      }),
    ).toBe(true);
  });
  it.each([
    "https://user:secret@forge.example/notes.git",
    "https://user@forge.example/notes.git",
    "https://forge.example/notes.git?token=secret",
    "http://forge.example/notes.git",
    "file:///private/notes",
    "ssh://git@forge.example/notes.git",
  ])("refuses credential-bearing or mismatched HTTPS endpoints: %s", (url) => {
    expect(validRemoteDraft({ ...connection, url })).toBe(false);
  });
  it.each([
    "",
    "--mirror",
    "main:other",
    "main\nother",
    "refs/../main",
    "main.lock",
    "main@{1}",
    "main/",
    ".hidden",
    "a//b",
  ])("refuses invalid branch selections: %s", (branch) => {
    expect(validRemoteDraft({ ...connection, branch })).toBe(false);
  });
});
