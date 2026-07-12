#!/usr/bin/env python3
"""Build dico-btp-lot-12.json from source lexique text."""
import json
import re
from pathlib import Path

SOURCE = r"""
Abattage :
Définition : Opération qui consiste à couper et supprimer des arbres présents dans l'emprise du projet.
À quoi ça sert ? : Libérer les zones de terrassement, de voirie ou de réseaux avant intervention des engins.
Point de vigilance : Vérifier les arbres à conserver, les autorisations éventuelles et l'évacuation des souches.
Accessibilité PMR :
Définition : Ensemble des dispositions permettant l'usage des cheminements et stationnements par les personnes à mobilité réduite.
À quoi ça sert ? : Garantir des pentes, ressauts, largeurs et dévers compatibles avec l'usage des piétons et fauteuils.
Point de vigilance : Contrôler les pentes, paliers de repos, ressauts de 2 cm maximum et largeur minimale de cheminement.
"""

# Full source loaded from external file for parsing
SOURCE_FILE = Path(__file__).parent / "_source-lot-12.txt"

def parse_source(text: str) -> list[dict]:
    lines = [ln.rstrip() for ln in text.strip().split("\n")]
    entries = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        # Skip non-term lines
        if line.startswith("Définition :") or line.startswith("À quoi ça sert") or line.startswith("Point de vigilance"):
            i += 1
            continue
        if not line.endswith(" :"):
            i += 1
            continue

        terme = line[:-2].strip()  # remove trailing " :"
        entry: dict = {"terme": terme}

        i += 1
        if i < len(lines) and lines[i].startswith("Définition :"):
            entry["definition_courte"] = lines[i][len("Définition :"):].strip()
            i += 1
        if i < len(lines) and lines[i].startswith("À quoi ça sert ? :"):
            entry["explication_pedagogique"] = lines[i][len("À quoi ça sert ? :"):].strip()
            i += 1
        if i < len(lines) and lines[i].startswith("Point de vigilance :"):
            entry["points_vigilance"] = [lines[i][len("Point de vigilance :"):].strip()]
            i += 1

        entries.append(entry)
    return entries

if __name__ == "__main__":
    # Read full source from stdin or file argument
    import sys
    if len(sys.argv) > 1:
        text = Path(sys.argv[1]).read_text(encoding="utf-8")
    else:
        text = Path(__file__).parent / "dico-btp-lot-12-source.txt"
        text = text.read_text(encoding="utf-8")

    entries = parse_source(text)
    out = Path(__file__).parent / "dico-btp-lot-12.json"
    out.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Written {len(entries)} terms to {out}")
    print(f"First: {entries[0]['terme']}")
    print(f"Last: {entries[-1]['terme']}")
