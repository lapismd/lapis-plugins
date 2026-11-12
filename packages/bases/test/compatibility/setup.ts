// Query-only acceptance does not mount a surface. The public API imports UI
// modules whose observer class must exist in jsdom, even without any observers.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
