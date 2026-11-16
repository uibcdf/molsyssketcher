"""Native engine evidence for the fixed internal P2.5 corpus, not production editing."""

import json

from rdkit import Chem

from devtools.editor_experiment.corpus import OUTPUT, generate, graph


def test_native_editor_corpus_is_reproducible():
    assert generate() == json.loads(OUTPUT.read_text())


def test_native_validity_and_implicit_hydrogens_are_recomputed():
    corpus = generate()
    assert corpus["source"]["original"]["data"] == "CCO\n"
    for name, smiles in {"single": "CCO", "double": "C=CO", "carbonyl": "CC=O"}.items():
        case = corpus["cases"][name]
        assert case["validation"]["status"] == "valid"
        assert case["validation"]["isomericSmiles"] == smiles
    original = corpus["cases"]["single"]["layouts"][0]["document"]
    edited = corpus["cases"]["double"]["layouts"][0]["document"]
    assert original["atoms"][1]["hydrogenCount"] == 2
    assert edited["atoms"][1]["hydrogenCount"] == 1


def test_invalid_native_draft_is_retained_without_a_fabricated_preparation():
    case = generate()["cases"]["invalid-oxygen"]
    assert case["graph"]["bonds"][1]["order"] == 3
    assert case["validation"]["status"] == "invalid"
    assert case["validation"]["reason"] == "AtomValenceException"
    assert case["layouts"] == []


def test_all_six_native_layouts_keep_chemistry_and_stable_correspondence():
    corpus = generate()
    count = 0
    for case in corpus["cases"].values():
        for record in case["layouts"]:
            molecule = Chem.MolFromMolBlock(record["reference"]["molBlock"], removeHs=False)
            assert graph(molecule) == case["graph"]
            assert Chem.MolToSmiles(molecule) == case["validation"]["isomericSmiles"]
            assert [a["id"] for a in record["document"]["atoms"]] == ["atom:0", "atom:1", "atom:2"]
            assert record["document"]["original"]["source"]["generation"] in {
                "original",
                "double",
                "carbonyl",
            }
            count += 1
    assert count == 6
