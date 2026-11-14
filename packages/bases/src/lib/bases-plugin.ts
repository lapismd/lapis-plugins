import packagedAgentSkills from "@lapis-notes/bases/skills.json";
import { BASES_FILE_ICON } from "./bases-file-icon";
import {
  type App,
  MarkdownRenderChild,
  Plugin,
  type PluginManifest,
} from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor/core";
import { yaml } from "@codemirror/lang-yaml";
import { mount, unmount } from "svelte";
import BasesEmbed from "./bases-view/components/bases-embed.svelte";
import BasesError from "./bases-view/components/bases-error.svelte";
import {
  BasesView,
  BasesViewType,
  createBasesViewRegistrations,
  parseBasesDocument,
} from "./bases-view";
import manifestSpec from "@lapis-notes/bases/manifest.json";

type BasesRenderHandle = {
  destroy: () => void;
};

export class BasesPlugin extends Plugin {
  readonly packagedAgentSkills = packagedAgentSkills;
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload() {
    const fileIcon = this.registerIcon("file", BASES_FILE_ICON);
    this.registerView(BasesViewType, (leaf) => new BasesView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: BasesViewType,
      label: "Bases",
      fileIcon,
      filenamePatterns: ["*.bases", "*.base"],
      priority: "default",
    });
    this.registerExtensions(["bases", "base"], BasesViewType);
    this.registerEditorExtension(
      () => [markupEditor({ language: "yaml", app: this.app }), yaml()],
      BasesViewType,
    );
    this.registerReadOnlyEmbedRenderer("base");
    this.registerReadOnlyEmbedRenderer("bases");
    this.registerReadOnlyCodeBlockRenderer("base");
    this.registerReadOnlyCodeBlockRenderer("bases");
  }

  private registerReadOnlyEmbedRenderer(extension: string): void {
    this.register(
      this.app.embedRegistry.register(extension, ({ containerEl, state }) => {
        const file = state.file;
        if (!file) {
          return;
        }

        let activeHandle: BasesRenderHandle | null = null;
        let disposed = false;

        void this.app.vault
          .read(file)
          .then((content) => {
            if (disposed) {
              return;
            }

            activeHandle = this.mountReadOnlyBases(
              containerEl,
              content,
              file.name,
            );
          })
          .catch((error) => {
            if (disposed) {
              return;
            }

            activeHandle = this.renderError(
              containerEl,
              error instanceof Error
                ? `Unable to render this embedded base: ${error.message}`
                : `Unable to render this embedded base: ${String(error)}`,
            );
          });

        return {
          destroy: () => {
            disposed = true;
            activeHandle?.destroy();
            activeHandle = null;
            containerEl.replaceChildren();
          },
        };
      }),
    );
  }

  private registerReadOnlyCodeBlockRenderer(language: string): void {
    this.registerMarkdownCodeBlockProcessor(language, (source, el, ctx) => {
      const handle = this.mountReadOnlyBases(el, source);
      const child = new MarkdownRenderChild(el);
      child.register(() => {
        handle.destroy();
      });
      ctx.addChild(child);
    });
  }

  private mountReadOnlyBases(
    containerEl: HTMLElement,
    content: string,
    fileName?: string,
  ): BasesRenderHandle {
    containerEl.replaceChildren();

    let document;
    try {
      document = parseBasesDocument(content);
    } catch (error) {
      return this.renderError(
        containerEl,
        error instanceof Error
          ? `Unable to render this base: ${error.message}`
          : `Unable to render this base: ${String(error)}`,
      );
    }

    const component = mount(BasesEmbed, {
      target: containerEl,
      props: {
        app: this.app,
        document,
        registrations: createBasesViewRegistrations(this.app),
        fileName,
      },
    });

    return {
      destroy: () => {
        void unmount(component);
        containerEl.replaceChildren();
      },
    };
  }

  private renderError(
    containerEl: HTMLElement,
    message: string,
  ): BasesRenderHandle {
    containerEl.replaceChildren();
    const component = mount(BasesError, {
      target: containerEl,
      props: { message },
    });
    return {
      destroy: () => {
        void unmount(component);
        containerEl.replaceChildren();
      },
    };
  }
}

export default BasesPlugin;
