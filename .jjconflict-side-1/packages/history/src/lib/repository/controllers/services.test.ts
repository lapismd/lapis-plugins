import { describe, expect, it } from "vitest";
import type { App } from "@lapis-notes/api";
import { bindRepository, ownedRepository } from "./services.js";
import type { RepositoryServices } from "./history-reader.js";

describe("repository App ownership", () => {
  it("keeps another App's services independent", () => {
    const first = {} as App;
    const second = {} as App;
    const services = {} as RepositoryServices;
    const dispose = bindRepository(first, () => services);
    expect(ownedRepository(first)).toBe(services);
    expect(() => ownedRepository(second)).toThrow("unavailable");
    expect(() => bindRepository(first, () => services)).toThrow(
      "already bound"
    );
    dispose();
    expect(() => ownedRepository(first)).toThrow("unavailable");
  });

  it("cannot release a later lease that reuses the same factory", () => {
    const app = {} as App;
    const services = {} as RepositoryServices;
    const factory = () => services;
    const oldLease = bindRepository(app, factory);
    oldLease();
    const currentLease = bindRepository(app, factory);
    oldLease();
    expect(ownedRepository(app)).toBe(services);
    currentLease();
    expect(() => ownedRepository(app)).toThrow("unavailable");
  });
});
