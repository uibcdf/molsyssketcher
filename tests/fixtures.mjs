export function reference(id, generation = "1", owner = "synthetic-source") {
  return { owner, id, generation };
}

export function context(id = "molecule-a", structure = "0") {
  return {
    molecule: reference(id),
    chemicalState: "declared-state-0",
    structure,
    preparation: reference(`preparation-${id}`),
  };
}

// Synthetic structural controls only; this is not a validated RDKit depiction.
export function molecule(id = "molecule-a") {
  return {
    schemaVersion: 1,
    kind: "prepared-molecule",
    id,
    original: {
      format: "smiles",
      data: "CO\n",
      source: reference(`original-${id}`),
    },
    context: context(id),
    provider: {
      name: "synthetic-contract-fixture",
      version: "1",
      route: "supplied",
      options: {},
    },
    atoms: [
      {
        id: "oxygen",
        providerIndex: 1,
        element: "O",
        isotope: null,
        formalCharge: 0,
        hydrogenCount: 1,
      },
      {
        id: "carbon",
        providerIndex: 0,
        element: "C",
        isotope: null,
        formalCharge: 0,
        hydrogenCount: 3,
      },
    ],
    bonds: [{ id: "bond-co", providerIndex: 0, atoms: ["carbon", "oxygen"] }],
    depiction: {
      generation: "drawing-1",
      profile: "supplied-bijective@1",
      coordinates: "drawing",
      axes: "x-right-y-up",
      atoms: [
        {
          id: "display-c",
          atomId: "carbon",
          origin: "mapped",
          x: 0,
          y: 0,
          label: "",
        },
        {
          id: "display-o",
          atomId: "oxygen",
          origin: "mapped",
          x: 1.5,
          y: 0,
          label: "OH",
        },
      ],
      bonds: [
        {
          id: "display-co",
          bondId: "bond-co",
          atoms: ["display-c", "display-o"],
          style: "single",
        },
      ],
      coverage: { status: "complete", missing: [] },
    },
  };
}

export function interaction(mode = "interface-centered") {
  const parents = [context("molecule-a"), context("molecule-b")];
  return {
    schemaVersion: 1,
    kind: "interaction-document",
    id: "diagram-a",
    mode,
    parents,
    analyses: [
      {
        result: reference("analysis-a", "3", "synthetic-analysis"),
        parents: structuredClone(parents),
      },
    ],
  };
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
