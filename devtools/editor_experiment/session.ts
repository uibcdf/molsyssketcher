/** Unshipped P2.5 model. It issues receipt tickets, never starts provider work. */
import { prepareSuppliedMolecule, SketcherError } from "../../dist/index.js";
import type { PreparedMolecule } from "../../dist/index.js";

export interface DraftGraph {
  readonly atoms: readonly {
    readonly id: string;
    readonly element: string;
    readonly isotope: number | null;
    readonly formalCharge: number;
  }[];
  readonly bonds: readonly {
    readonly id: string;
    readonly atoms: readonly [string, string];
    readonly order: 1 | 2 | 3;
  }[];
}
export type EditOperation = {
  readonly kind: "set-bond-order";
  readonly bondId: string;
  readonly order: 1 | 2 | 3;
};
export interface ReceiptTicket {
  readonly instanceId: string;
  readonly generation: number;
  readonly requestId: number;
  readonly destination: "validation" | "layout";
}
export interface ValidationReport {
  readonly status: "valid" | "invalid" | "unsupported" | "failed";
  readonly graph: DraftGraph;
  readonly provider: {
    readonly name: string;
    readonly version: string;
    readonly operation: string;
  };
  readonly reason?: string;
  readonly isomericSmiles?: string;
}
type Selection = { readonly kind: "atom" | "bond"; readonly id: string } | null;
interface Layout {
  readonly document: PreparedMolecule;
  readonly generation: number;
  readonly basisGeneration: number;
  readonly origin: "source" | "provider" | "history";
}
interface Content {
  readonly graph: DraftGraph;
  readonly layout: Layout | null;
  readonly selection: Selection;
}
type Validation =
  | { readonly status: "unvalidated" | "pending" }
  | ValidationReport;

function owned<T>(input: T): T {
  const clone = structuredClone(input);
  const freeze = (item: unknown): void => {
    if (item && typeof item === "object") {
      Object.values(item).forEach(freeze);
      Object.freeze(item);
    }
  };
  freeze(clone);
  return clone;
}
const key = (graph: DraftGraph) => JSON.stringify(graph);

function checkGraph(graph: DraftGraph, document: PreparedMolecule): void {
  if (
    !graph ||
    !Array.isArray(graph.atoms) ||
    !Array.isArray(graph.bonds) ||
    graph.atoms.length !== document.atoms.length ||
    graph.bonds.length !== document.bonds.length ||
    graph.atoms.length > 16 ||
    graph.bonds.length > 16
  )
    throw new SketcherError(
      "invalid-input",
      "Invalid experiment graph extent.",
    );
  for (const [index, atom] of graph.atoms.entries()) {
    const source = document.atoms[index]!;
    if (
      atom.id !== source.id ||
      atom.element !== source.element ||
      atom.isotope !== source.isotope ||
      atom.formalCharge !== source.formalCharge
    )
      throw new SketcherError(
        "invalid-input",
        "Native atom correspondence differs.",
      );
  }
  for (const [index, bond] of graph.bonds.entries()) {
    const source = document.bonds[index]!;
    if (
      bond.id !== source.id ||
      JSON.stringify(bond.atoms) !== JSON.stringify(source.atoms) ||
      ![1, 2, 3].includes(bond.order)
    )
      throw new SketcherError(
        "invalid-input",
        "Native bond correspondence differs.",
      );
  }
}

function checkLayout(graph: DraftGraph, document: PreparedMolecule): void {
  checkGraph(graph, document);
  for (const bond of graph.bonds) {
    const display = document.depiction.bonds.find(
      (item) => item.bondId === bond.id,
    );
    if (
      display?.style !==
      ({ 1: "single", 2: "double", 3: "triple" } as const)[bond.order]
    )
      throw new SketcherError(
        "invalid-input",
        "Prepared bond strokes differ from the declared native draft.",
      );
  }
}

export class EditExperiment {
  readonly #source: PreparedMolecule;
  readonly #instanceId: string;
  readonly #editable: boolean;
  #generation = 1;
  #content: Content;
  #validation: Validation = Object.freeze({ status: "unvalidated" });
  #undo: Content[] = [];
  #redo: Content[] = [];
  #intent = { validation: 0, layout: 0 };
  #tickets = new Map<ReceiptTicket, string>();
  #disposed = false;

  constructor(options: {
    instanceId: string;
    editable: boolean;
    source: unknown;
    graph: DraftGraph;
  }) {
    if (!options.instanceId?.trim() || typeof options.editable !== "boolean")
      throw new SketcherError(
        "invalid-input",
        "Explicit experiment identity/capability required.",
      );
    this.#instanceId = options.instanceId;
    this.#editable = options.editable;
    this.#source = prepareSuppliedMolecule(options.source);
    checkLayout(options.graph, this.source);
    if (
      this.source.atoms.map((a) => a.element).join() !== "C,C,O" ||
      this.source.atoms.some((a) => a.isotope !== null || a.formalCharge !== 0)
    )
      throw new SketcherError(
        "unsupported-feature",
        "This experiment receives only the declared implicit-H ethanol controls.",
      );
    this.#content = owned({
      graph: options.graph,
      selection: null,
      layout: {
        document: this.source,
        generation: 1,
        basisGeneration: 1,
        origin: "source",
      },
    });
  }

  get source(): PreparedMolecule {
    return this.#source;
  }

  get state() {
    return Object.freeze({
      lifecycle: this.#disposed ? "disposed" : "ready",
      generation: this.#generation,
      editable: this.#editable,
      graph: this.#content.graph,
      layout: this.#content.layout,
      selection: this.#content.selection,
      validation: this.#validation,
      undo: this.#undo.length,
      redo: this.#redo.length,
      outstanding: this.#tickets.size,
      // A declared reference only; this does not receive a native observation.
      attachedObservation: Object.freeze({
        label: "synthetic-reference-only",
        basisGeneration: 1,
        current: !this.#disposed && this.#generation === 1,
      }),
    });
  }

  #live(): void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The experiment is disposed.");
  }
  #write(): void {
    this.#live();
    if (!this.#editable)
      throw new SketcherError(
        "unsupported-feature",
        "Chemical edits are disabled in read-only mode.",
      );
  }
  #advance(content: Content): void {
    ++this.#generation;
    ++this.#intent.validation;
    ++this.#intent.layout;
    this.#validation = Object.freeze({ status: "unvalidated" });
    this.#content = owned({
      ...content,
      layout: content.layout
        ? { ...content.layout, generation: this.#generation, origin: "history" }
        : null,
    });
  }

  apply(operation: EditOperation): boolean {
    this.#write();
    if (
      operation?.kind !== "set-bond-order" ||
      ![1, 2, 3].includes(operation.order)
    )
      throw new SketcherError(
        "invalid-input",
        "Unsupported typed draft operation.",
      );
    const bond = this.#content.graph.bonds.find(
      (b) => b.id === operation.bondId,
    );
    if (!bond)
      throw new SketcherError("invalid-input", "Unknown semantic bond.");
    if (bond.order === operation.order) return false;
    this.#undo.push(this.#content);
    if (this.#undo.length > 8) this.#undo.shift();
    this.#redo = [];
    const graph = {
      ...this.#content.graph,
      bonds: this.#content.graph.bonds.map((b) =>
        b.id === bond.id ? { ...b, order: operation.order } : b,
      ),
    };
    this.#advance({ graph, layout: null, selection: this.#content.selection });
    return true;
  }

  undo(): boolean {
    this.#write();
    const previous = this.#undo.pop();
    if (!previous) return false;
    this.#redo.push(this.#content);
    this.#advance(previous);
    return true;
  }
  redo(): boolean {
    this.#write();
    const next = this.#redo.pop();
    if (!next) return false;
    this.#undo.push(this.#content);
    this.#advance(next);
    return true;
  }
  select(selection: Selection): void {
    this.#live();
    if (
      selection &&
      !(
        selection.kind === "atom"
          ? this.#content.graph.atoms
          : this.#content.graph.bonds
      ).some((item) => item.id === selection.id)
    )
      throw new SketcherError("invalid-input", "Unknown semantic selection.");
    this.#content = owned({ ...this.#content, selection });
  }

  request(destination: ReceiptTicket["destination"]): ReceiptTicket {
    this.#live();
    if (!["validation", "layout"].includes(destination))
      throw new SketcherError("invalid-input", "Unknown receipt destination.");
    if (
      [...this.#tickets.keys()].filter((t) => t.destination === destination)
        .length >= 2
    )
      throw new SketcherError(
        "input-limit",
        "Two outstanding receipts per destination are admitted; retired work still occupies its slot.",
      );
    const ticket = Object.freeze({
      instanceId: this.#instanceId,
      generation: this.#generation,
      requestId: ++this.#intent[destination],
      destination,
    });
    this.#tickets.set(ticket, key(this.#content.graph));
    if (destination === "validation")
      this.#validation = Object.freeze({ status: "pending" });
    return ticket;
  }

  #receive(
    ticket: ReceiptTicket,
    destination: ReceiptTicket["destination"],
  ): "current" | "stale" | "disposed" {
    if (this.#disposed) return "disposed";
    if (ticket.destination !== destination || !this.#tickets.has(ticket))
      return "stale";
    const graph = this.#tickets.get(ticket);
    this.#tickets.delete(ticket);
    return ticket.instanceId === this.#instanceId &&
      ticket.generation === this.#generation &&
      ticket.requestId === this.#intent[destination] &&
      graph === key(this.#content.graph)
      ? "current"
      : "stale";
  }

  receiveValidation(
    ticket: ReceiptTicket,
    report: ValidationReport,
  ): "accepted" | "stale" | "disposed" | "rejected" {
    const status = this.#receive(ticket, "validation");
    if (status !== "current") return status;
    if (
      !["valid", "invalid", "unsupported", "failed"].includes(report.status) ||
      key(report.graph) !== key(this.#content.graph)
    ) {
      this.#validation = owned({
        status: "failed",
        graph: this.#content.graph,
        provider: {
          name: "receipt-guard",
          version: "1",
          operation: "correspondence",
        },
        reason: "Mismatched native validation response",
      });
      return "rejected";
    }
    this.#validation = owned(report);
    return "accepted";
  }

  receiveLayout(
    ticket: ReceiptTicket,
    report: { graph: DraftGraph; document: unknown },
  ): "accepted" | "stale" | "disposed" | "rejected" {
    const status = this.#receive(ticket, "layout");
    if (status !== "current") return status;
    if (key(report.graph) !== key(this.#content.graph)) return "rejected";
    try {
      const document = prepareSuppliedMolecule(report.document);
      checkLayout(report.graph, document);
      this.#content = owned({
        ...this.#content,
        layout: {
          document,
          generation: this.#generation,
          basisGeneration: this.#generation,
          origin: "provider",
        },
      });
      return "accepted";
    } catch {
      return "rejected";
    }
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    ++this.#generation;
    this.#tickets.clear();
    this.#undo = [];
    this.#redo = [];
    this.#content = owned({ ...this.#content, layout: null, selection: null });
    this.#validation = Object.freeze({ status: "unvalidated" });
  }
}
