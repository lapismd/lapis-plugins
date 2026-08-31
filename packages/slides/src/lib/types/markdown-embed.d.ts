declare module "@lapis-notes/markdown/embed" {
  import type { Component } from "svelte";

  export const MarkdownEmbed: Component<{
    app: import("@lapis-notes/api").App;
    inline?: boolean;
    value: string;
    sourcePath?: string;
    highlight?: boolean;
  }>;
}
