export type DiagnosticCode =
  | "invalid-input"
  | "unsupported-schema"
  | "unsupported-feature"
  | "input-limit"
  | "preparation-failed"
  | "disposed";

/** Transportable core diagnostics; Python adapters retain their SMonitor context. */
export class SketcherError extends Error {
  readonly code: DiagnosticCode;
  readonly path: string;

  constructor(code: DiagnosticCode, message: string, path = "$") {
    super(message);
    this.name = "SketcherError";
    this.code = code;
    this.path = path;
  }
}
