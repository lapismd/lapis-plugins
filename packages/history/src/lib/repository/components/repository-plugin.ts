import {
  repositoryFeedback,
  copyRepositoryIdentifier,
  reportRepositoryError,
} from "./repository-feedback.js";
import { openRepositoryView } from "./repository-navigation.js";
import type {
  HistorySource,
  HistorySourcePicker,
} from "../controllers/history-source.js";
import { Plugin, type App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { HistoryController } from "../controllers/history-controller.js";
import {
  ownedRepository,
  repositoryLeaveMode,
} from "../controllers/services.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
import { OperationController } from "../controllers/operation-controller.js";
import { OperationView } from "./operation-view.js";
import { RepositoryView } from "./repository-view.js";
import { BackgroundWork } from "../controllers/background-work.js";
import { FileHistoryController } from "../controllers/file-history-controller.js";
import { registerFileHistoryView } from "./file-history-view.js";
import { BlameController } from "../controllers/blame-controller.js";
import { BlameView } from "./blame/blame-view.js";
import { registerBlameEditorActions } from "./blame/editor-actions.js";
import { RepositoryStatus } from "./repository-status.js";
import { RepositoryBackup } from "./repository-backup.js";
import { registerRepositoryTools } from "./repository-tools.js";
import { bindAiHistory } from "../controllers/ai-history.js";
import { guardTranscriptReplacement } from "../controllers/transcript-writers.js";
type RepositoryController =
  | HistoryController
  | OperationController
  | FileHistoryController
  | BlameController;

export class RepositoryPlugin extends Plugin {
  backup?: RepositoryBackup;
  get restoreService() {
    return this.#services?.restore;
  }
  #services?: RepositoryServices;
  #status?: RepositoryStatus;
  #closeTools?: () => Promise<void>;
  #closeAiHistory?: () => void;
  #controllers = new Set<RepositoryController>();
  #activities = new Map<RepositoryController, () => void>();
  #closing?: Promise<void>;
  constructor(app: App) {
    super(app, {
      id: "repository-history",
      name: "Repository History",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Lapis Notes",
      description: "Read pinned JJ history and compare revisions in the vault.",
    });
  }
  feedback(title = "Repository history", identity?: string) {
    if (!this.#services || this.#closing)
      throw new Error("Repository history is closed");
    return repositoryFeedback(this.app, title, identity);
  }
  reader(source: HistorySource) {
    const reader =
      source === "backup" ? this.#services?.reader : this.#services?.original;
    if (!reader) throw new Error("This history source is unavailable");
    return reader;
  }
  sourcePicker(
    source: HistorySource,
    select: HistorySourcePicker["select"]
  ): HistorySourcePicker | undefined {
    if (!this.#services?.sources) return;
    return {
      selected: source,
      load: this.#services.sources,
      select,
      report: (error) => this.report(error),
    };
  }
  createController(source: HistorySource = "backup"): HistoryController {
    const feedback = this.feedback();
    const controller = new HistoryController(this.reader(source), feedback);
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading JJ Log",
        controller
      )
    );
    return controller;
  }
  createOperationController(
    source: HistorySource = "backup"
  ): OperationController {
    const feedback = this.feedback("Repository operation log");
    const controller = new OperationController(this.reader(source), feedback);
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading Op Log",
        controller
      )
    );
    return controller;
  }
  async release(controller: RepositoryController): Promise<void> {
    await controller.close();
    this.#activities.get(controller)?.();
    this.#activities.delete(controller);
    this.#controllers.delete(controller);
  }
  createFileHistoryController(): FileHistoryController {
    const controller = new FileHistoryController(
      this.#services!.reader,
      this.feedback("File history")
    );
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading file history",
        controller
      )
    );
    return controller;
  }
  async onload(): Promise<void> {
    this.#closing = undefined;
    this.#services = ownedRepository(this.app);
    if (this.#services.backup) {
      this.backup = new RepositoryBackup(this, this.#services);
      await this.backup.start();
    }
    this.#closeTools = registerRepositoryTools(this, this.#services);
    if (this.#services.aiHistory)
      this.#closeAiHistory = bindAiHistory(this.app, {
        service: this.#services.aiHistory,
        reader: this.#services.reader,
        enabled: () => !!this.backup?.enabled && !this.#closing,
        guard: (action) =>
          guardTranscriptReplacement(this.app, undefined, action),
        reveal: (record) =>
          this.open(
            record.after?.operation ?? record.before.operation,
            record.after?.commit ?? record.before.commit
          ),
      });
    registerFileHistoryView(this);
    registerBlameEditorActions(this);
    this.registerView(
      "repository-file-blame",
      (leaf) => new BlameView(leaf, this)
    );
    this.registerView(
      "repository-history",
      (leaf) => new RepositoryView(leaf, this),
      {
        kind: "command",
        command: {
          id: "open-history",
          name: "Open Repository History",
          callback: () => {
            void this.open().catch((error) => this.report(error));
          },
        },
      }
    );
    this.registerView(
      "repository-oplog",
      (leaf) => new OperationView(leaf, this),
      {
        kind: "command",
        command: {
          id: "open-oplog",
          name: "Open Repository Op Log",
          callback: () => {
            void this.openOperations().catch((error) => this.report(error));
          },
        },
      }
    );
    this.addRibbonIcon("git-pull-request-arrow", "Repository Op Log", () => {
      void this.openOperations().catch((error) => this.report(error));
    });
    this.addRibbonIcon("git-branch", "Repository History", () => {
      void this.open().catch((error) => this.report(error));
    });
    this.#status = new RepositoryStatus(this, this.#services);
    await this.#status.start();
  }
  async copyIdentifier(value: string): Promise<void> {
    return copyRepositoryIdentifier(this.app, value);
  }
  report(error: unknown): void {
    reportRepositoryError(this.app, error);
  }
  async open(
    operation?: string,
    revision?: string,
    source: HistorySource = "backup"
  ): Promise<void> {
    await openRepositoryView(
      getWorkspaceHostBinding(this.app.workspace).controller.workspace,
      "repository-history",
      source,
      operation ? { operation, revision } : {}
    );
  }
  async openOperations(source: HistorySource = "backup"): Promise<void> {
    await openRepositoryView(
      getWorkspaceHostBinding(this.app.workspace).controller.workspace,
      "repository-oplog",
      source
    );
  }
  createBlameController(source: HistorySource = "backup"): BlameController {
    const controller = new BlameController(
      this.reader(source),
      this.feedback("File blame")
    );
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading file blame",
        {
          subscribe: (listener) =>
            controller.subscribe((state) =>
              listener({
                busy: state.busy,
                phase: state.status === "failed" ? "unavailable" : state.status,
              })
            ),
        }
      )
    );
    return controller;
  }
  async openBlame(
    operation: string,
    commit: string,
    path: string,
    source: HistorySource = "backup"
  ): Promise<void> {
    await openRepositoryView(
      getWorkspaceHostBinding(this.app.workspace).controller.workspace,
      "repository-file-blame",
      source,
      {
        operation,
        commit,
        path,
      }
    );
  }
  async onunload(): Promise<void> {
    return (this.#closing ??= (async () => {
      this.#closeAiHistory?.();
      this.#closeAiHistory = undefined;
      await this.#closeTools?.();
      this.#closeTools = undefined;
      await this.#status?.close();
      await this.backup?.close();
      this.backup = undefined;
      this.#status = undefined;
      await Promise.allSettled(
        [...this.#controllers].map((controller) => controller.close())
      );
      // Full native release proves closure even after an unknown per-handle outcome.
      await this.#services?.close(repositoryLeaveMode(this.app));
      for (const dispose of this.#activities.values()) dispose();
      this.#activities.clear();
      this.#controllers.clear();
      this.#services = undefined;
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
