import { SketcherError } from "./diagnostics.js";
import {
  prepareSuppliedInteractionDocument,
  prepareSuppliedMolecule,
} from "./documents.js";
import { snapshotJson } from "./json.js";
import type {
  InteractionDocument,
  JsonValue,
  PreparedMolecule,
} from "./types.js";

export interface PreparationContext {
  readonly instanceId: string;
  readonly requestId: number;
  readonly acceptedGeneration: number;
  readonly signal: AbortSignal;
}

export type PrepareDocument = (
  input: JsonValue,
  context: PreparationContext,
) => unknown | Promise<unknown>;

export interface AcceptedSnapshot<T> {
  readonly instanceId: string;
  readonly generation: number;
  readonly document: T;
}

export type ReplacementResult<T> =
  | {
      readonly status: "accepted";
      readonly requestId: number;
      readonly snapshot: AcceptedSnapshot<T>;
    }
  | { readonly status: "superseded" | "disposed"; readonly requestId: number }
  | {
      readonly status: "failed";
      readonly requestId: number;
      readonly error: SketcherError;
    };

export interface ControllerState<T> {
  readonly lifecycle: "ready" | "disposed";
  readonly accepted: AcceptedSnapshot<T> | null;
  readonly operation: {
    readonly requestId: number;
    readonly status: "idle" | "pending" | "accepted" | "failed" | "disposed";
    readonly error: SketcherError | null;
  };
  readonly work: { readonly running: number; readonly queued: number };
}

interface Request<T> {
  readonly id: number;
  readonly input: JsonValue;
  readonly resolve: (result: ReplacementResult<T>) => void;
}

export interface ControllerOptions {
  readonly instanceId: string;
  /** Omit for already supplied data. No engine or transport is loaded implicitly. */
  readonly prepare?: PrepareDocument;
}

/** One writer and one replacement destination; one running plus one newest queued request. */
export class DocumentController<T> {
  readonly #instanceId: string;
  readonly #validate: (input: unknown) => T;
  readonly #prepare: PrepareDocument;
  #generation = 0;
  #intent = 0;
  #disposed = false;
  #accepted: AcceptedSnapshot<T> | null = null;
  #operation: ControllerState<T>["operation"] = Object.freeze({
    requestId: 0,
    status: "idle",
    error: null,
  });
  #running: AbortController | null = null;
  #queued: Request<T> | null = null;

  constructor(options: ControllerOptions, validate: (input: unknown) => T) {
    if (typeof options.instanceId !== "string" || !options.instanceId.trim()) {
      throw new SketcherError(
        "invalid-input",
        "A nonempty live instance identity is required.",
      );
    }
    this.#instanceId = options.instanceId;
    this.#validate = validate;
    this.#prepare = options.prepare ?? ((input) => input);
  }

  get state(): ControllerState<T> {
    return Object.freeze({
      lifecycle: this.#disposed ? "disposed" : "ready",
      accepted: this.#accepted,
      operation: this.#operation,
      work: Object.freeze({
        running: this.#running ? 1 : 0,
        queued: this.#queued ? 1 : 0,
      }),
    });
  }

  /** Replacement is explicitly supersedable; this is not a scientific job scheduler. */
  replace(input: unknown): Promise<ReplacementResult<T>> {
    const id = ++this.#intent;
    if (this.#disposed)
      return Promise.resolve(
        Object.freeze({ status: "disposed", requestId: id }),
      );
    this.#queued?.resolve(
      Object.freeze({ status: "superseded", requestId: this.#queued.id }),
    );
    this.#queued = null;
    let owned: JsonValue;
    try {
      owned = snapshotJson(input);
    } catch (error) {
      const diagnostic = this.#diagnostic(error);
      if (this.#disposed)
        return Promise.resolve(
          Object.freeze({ status: "disposed", requestId: id }),
        );
      if (id !== this.#intent)
        return Promise.resolve(
          Object.freeze({ status: "superseded", requestId: id }),
        );
      this.#operation = Object.freeze({
        requestId: id,
        status: "failed",
        error: diagnostic,
      });
      this.#running?.abort();
      return Promise.resolve(
        Object.freeze({ status: "failed", requestId: id, error: diagnostic }),
      );
    }
    if (this.#disposed)
      return Promise.resolve(
        Object.freeze({ status: "disposed", requestId: id }),
      );
    if (id !== this.#intent)
      return Promise.resolve(
        Object.freeze({ status: "superseded", requestId: id }),
      );
    this.#operation = Object.freeze({
      requestId: id,
      status: "pending",
      error: null,
    });
    return new Promise((resolve) => {
      const request = { id, input: owned, resolve };
      if (this.#running) {
        this.#queued = request;
        // Publish coherent intent/queue state before invoking provider abort listeners.
        this.#running.abort();
      } else void this.#run(request);
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    ++this.#intent;
    this.#queued?.resolve(
      Object.freeze({ status: "disposed", requestId: this.#queued.id }),
    );
    this.#queued = null;
    this.#accepted = null;
    this.#operation = Object.freeze({
      requestId: this.#intent,
      status: "disposed",
      error: null,
    });
    this.#running?.abort();
  }

  #diagnostic(error: unknown): SketcherError {
    // Core validation diagnostics are safe; provider exceptions stay with their owner.
    return Object.freeze(
      error instanceof SketcherError
        ? new SketcherError(error.code, error.message, error.path)
        : new SketcherError(
            "preparation-failed",
            "Document preparation failed; inspect the selected provider's diagnostics.",
          ),
    );
  }

  async #run(request: Request<T>): Promise<void> {
    const abort = new AbortController();
    this.#running = abort;
    try {
      const candidate = await this.#prepare(
        request.input,
        Object.freeze({
          instanceId: this.#instanceId,
          requestId: request.id,
          acceptedGeneration: this.#generation,
          signal: abort.signal,
        }),
      );
      if (this.#disposed)
        request.resolve(
          Object.freeze({ status: "disposed", requestId: request.id }),
        );
      else if (request.id !== this.#intent)
        request.resolve(
          Object.freeze({ status: "superseded", requestId: request.id }),
        );
      else {
        const document = this.#validate(snapshotJson(candidate));
        // A custom validator cannot leak its own mutable objects into accepted state.
        const ownedDocument = snapshotJson(document) as T;
        if (this.#disposed || request.id !== this.#intent) {
          request.resolve(
            Object.freeze({
              status: this.#disposed ? "disposed" : "superseded",
              requestId: request.id,
            }),
          );
          return;
        }
        const snapshot = Object.freeze({
          instanceId: this.#instanceId,
          generation: ++this.#generation,
          document: ownedDocument,
        });
        this.#accepted = snapshot;
        this.#operation = Object.freeze({
          requestId: request.id,
          status: "accepted",
          error: null,
        });
        request.resolve(
          Object.freeze({
            status: "accepted",
            requestId: request.id,
            snapshot,
          }),
        );
      }
    } catch (error) {
      if (this.#disposed)
        request.resolve(
          Object.freeze({ status: "disposed", requestId: request.id }),
        );
      else if (request.id !== this.#intent)
        request.resolve(
          Object.freeze({ status: "superseded", requestId: request.id }),
        );
      else {
        const diagnostic = this.#diagnostic(error);
        this.#operation = Object.freeze({
          requestId: request.id,
          status: "failed",
          error: diagnostic,
        });
        request.resolve(
          Object.freeze({
            status: "failed",
            requestId: request.id,
            error: diagnostic,
          }),
        );
      }
    } finally {
      this.#running = null;
      const next = this.#queued;
      this.#queued = null;
      if (next && !this.#disposed) void this.#run(next);
    }
  }
}

export function createMolecularController(
  options: ControllerOptions,
): DocumentController<PreparedMolecule> {
  return new DocumentController(options, prepareSuppliedMolecule);
}

export function createInteractionController(
  options: ControllerOptions,
): DocumentController<InteractionDocument> {
  return new DocumentController(options, prepareSuppliedInteractionDocument);
}
