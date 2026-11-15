import { SketcherError } from "./diagnostics.js";
import type { JsonValue } from "./types.js";

export const INPUT_LIMITS = Object.freeze({
  maxDepth: 32,
  maxNodes: 100_000,
  maxTextLength: 1_000_000,
  maxAtoms: 4_096,
  maxBonds: 8_192,
  maxParents: 64,
  maxAnalyses: 64,
});

/** Take an owned immutable JSON snapshot with bounded traversal and text. */
export function snapshotJson(input: unknown): JsonValue {
  let nodes = 0;
  let textLength = 0;
  const ancestors = new Set<object>();
  const text = (value: string): string => {
    textLength += value.length;
    if (textLength > INPUT_LIMITS.maxTextLength) {
      throw new SketcherError("input-limit", "Input text limit exceeded.");
    }
    return value;
  };
  const visit = (value: unknown, depth: number): JsonValue => {
    if (++nodes > INPUT_LIMITS.maxNodes || depth > INPUT_LIMITS.maxDepth) {
      throw new SketcherError("input-limit", "Input traversal limit exceeded.");
    }
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "string") return text(value);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "object" || value === null) {
      throw new SketcherError("invalid-input", "Expected finite JSON data.");
    }
    const prototype: unknown = Object.getPrototypeOf(value);
    if (
      !Array.isArray(value) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      throw new SketcherError("invalid-input", "Expected a plain JSON object.");
    }
    if (ancestors.has(value)) {
      throw new SketcherError("invalid-input", "Cyclic input is unsupported.");
    }
    ancestors.add(value);
    const entries: [string, JsonValue][] = [];
    for (const key of Reflect.ownKeys(value)) {
      if (Array.isArray(value) && key === "length") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== "string" || !descriptor || !("value" in descriptor)) {
        throw new SketcherError(
          "invalid-input",
          "Accessors and symbol keys are unsupported.",
        );
      }
      if (!descriptor.enumerable) {
        throw new SketcherError(
          "invalid-input",
          "Hidden input properties are unsupported.",
        );
      }
      entries.push([text(key), visit(descriptor.value, depth + 1)]);
    }
    ancestors.delete(value);
    if (Array.isArray(value)) {
      if (
        entries.length !== value.length ||
        entries.some(([key], i) => key !== String(i))
      ) {
        throw new SketcherError(
          "invalid-input",
          "Expected a dense JSON array.",
        );
      }
      return Object.freeze(entries.map(([, item]) => item));
    }
    return Object.freeze(Object.fromEntries(entries));
  };
  return visit(input, 0);
}
