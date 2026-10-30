import { expect, it } from "vitest";
import { CANVAS_SEARCH_DOCUMENT_PROVIDER } from "./built-in-search-document-providers";
import fixtures from "../../../../crates/lapis-plugin-services/tests/fixtures/search-canvas.json";

for (const fixture of fixtures) {
  it(`retains complete native Canvas source: ${fixture.name}`, async () => {
    // This pure provider reads only content; it has no App or file effects.
    const context = { content: fixture.content } as Parameters<
      typeof CANVAS_SEARCH_DOCUMENT_PROVIDER.extract
    >[0];
    expect(await CANVAS_SEARCH_DOCUMENT_PROVIDER.extract(context)).toEqual({
      content: fixture.expected,
    });
  });
}
