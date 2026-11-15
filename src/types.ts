/** Serializable provider/host data. Instances, accessors and cycles are refused. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** Identity is scoped by owner and generation, never inferred from a label. */
export interface ResourceReference {
  readonly owner: string;
  readonly id: string;
  readonly generation: string;
}

export interface MolecularContext {
  readonly molecule: ResourceReference;
  readonly chemicalState: string;
  readonly structure: string;
  readonly preparation: ResourceReference;
}

export interface SemanticAtom {
  readonly id: string;
  readonly providerIndex: number;
  readonly element: string;
  readonly isotope: number | null;
  readonly formalCharge: number;
  readonly hydrogenCount: number | null;
}

export interface SemanticBond {
  readonly id: string;
  readonly providerIndex: number;
  readonly atoms: readonly [string, string];
}

export interface DepictionAtom {
  readonly id: string;
  readonly atomId: string;
  readonly origin: "mapped";
  readonly x: number;
  readonly y: number;
  /** Provider-prepared text; the core neither parses nor infers this label. */
  readonly label: string;
}

export interface DepictionBond {
  readonly id: string;
  readonly bondId: string;
  readonly atoms: readonly [string, string];
  readonly style:
    | "single"
    | "double"
    | "triple"
    | "solid-wedge"
    | "hashed-wedge"
    | "wavy";
  /** Required originating depiction endpoint for a directed wedge. */
  readonly from?: string;
}

/** Experimental supplied-input profile; not a chemical interchange codec. */
export interface PreparedMolecule {
  readonly schemaVersion: 1;
  readonly kind: "prepared-molecule";
  readonly id: string;
  readonly original: {
    readonly format: string;
    readonly data: string;
    readonly source: ResourceReference;
  };
  readonly context: MolecularContext;
  readonly provider: {
    readonly name: string;
    readonly version: string;
    readonly build?: string;
    readonly route: string;
    readonly options: { readonly [key: string]: JsonValue };
  };
  readonly atoms: readonly SemanticAtom[];
  readonly bonds: readonly SemanticBond[];
  readonly depiction: {
    readonly generation: string;
    readonly profile: "supplied-bijective@1";
    readonly coordinates: "drawing";
    readonly axes: "x-right-y-up" | "x-right-y-down";
    readonly atoms: readonly DepictionAtom[];
    readonly bonds: readonly DepictionBond[];
    readonly coverage: {
      readonly status: "complete" | "partial";
      readonly missing: readonly string[];
    };
  };
}

/** References an owner-native result; no observation/result codec is defined here. */
export interface AnalysisReference {
  readonly result: ResourceReference;
  readonly parents: readonly MolecularContext[];
}

export interface InteractionDocument {
  readonly schemaVersion: 1;
  readonly kind: "interaction-document";
  readonly id: string;
  readonly mode: "ligand-centered" | "interface-centered";
  readonly parents: readonly MolecularContext[];
  readonly analyses: readonly AnalysisReference[];
}
