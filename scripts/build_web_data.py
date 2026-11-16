"""Build web/data/archive.js from an archive export.

Usage: python3 scripts/build_web_data.py [path/to/archive_export.json]

The output is a plain script that sets window.ARCHIVE, so web/index.html also
works when opened straight from disk. The graph is recomputed from incidents
after applying scripts/entity_aliases.json; the export's own graph block is
only used for entity types.
"""

import itertools
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from validate_export import DEFAULT_EXPORT, ROOT, validate

OUT = ROOT / "web" / "data" / "archive.js"

# Taxonomy order from docs/project-context.md. Categories the export uses but
# this list lacks are added before "other" under "Added later".
GROUPS = [
    ("On the pitch", [
        ("biased_selection", "Biased selection"),
        ("coach_recruitment", "Coach recruitment"),
        ("refereeing", "Refereeing"),
        ("match_fixing_betting", "Match fixing, betting"),
        ("age_fraud", "Age fraud"),
        ("foreign_player_naturalisation", "Naturalisation"),
    ]),
    ("Player conduct", [
        ("disciplinary_breach", "Discipline"),
        ("drug_doping", "Doping"),
        ("social_media_abuse", "Online abuse"),
    ]),
    ("Governance", [
        ("corruption_finance", "Corruption, finance"),
        ("federation_politics", "Federation politics"),
        ("nepotism", "Nepotism"),
    ]),
    ("Clubs and structure", [
        ("contracts_pay", "Contracts, pay"),
        ("tournament_mishap", "Tournament mishaps"),
        ("infrastructure", "Infrastructure"),
        ("womens_football", "Women's football"),
        ("club_vs_federation", "Clubs vs federation"),
        ("player_welfare_neglect", "Player welfare"),
    ]),
    ("Media", [
        ("broadcast_blackout", "Broadcast blackout"),
    ]),
]

CLASSIFIER_NOTE = re.compile(r"\s*\[?Suggested (new )?categor(y|ies)\b[^.\]]*\.?\]?", re.I)


def clean_summary(text):
    return " ".join(CLASSIFIER_NOTE.sub("", text).split())


def build_categories(used):
    cats = []
    known = set()
    for group, items in GROUPS:
        for cid, label in items:
            cats.append({"id": cid, "label": label, "group": group})
            known.add(cid)
    for cid in sorted(used - known - {"other"}):
        cats.append({"id": cid, "label": cid.replace("_", " ").capitalize(), "group": "Added later"})
    cats.append({"id": "other", "label": "Other", "group": "Other"})
    return cats


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_EXPORT
    export = json.loads(path.read_text())
    aliases = json.loads((ROOT / "scripts" / "entity_aliases.json").read_text())

    errors, warnings = validate(export, aliases)
    for w in warnings:
        print("warning:", w)
    if errors:
        for e in errors:
            print("error:", e)
        sys.exit(f"{len(errors)} errors in {path.name}; not building.")

    meta = export["meta"]
    incidents_in = sorted(export["incidents"], key=lambda i: (i["date_range"]["start"], i["incident_id"]))

    used = {c for i in incidents_in for c in i["categories"]}
    categories = build_categories(used)
    cat_index = {c["id"]: n for n, c in enumerate(categories)}

    node_by_label = {}
    for node in export["graph"]["nodes"]:
        node_by_label.setdefault(node["label"], node)

    entities, ent_index = [], {}

    def entity_for(name):
        label = aliases.get(name, name)
        if label not in ent_index:
            node = node_by_label.get(label) or node_by_label.get(name)
            ent_index[label] = len(entities)
            entities.append({
                "label": label,
                "type": node["type"] if node else "other",
                "slug": node["id"] if node else re.sub(r"\W+", "_", label.lower()).strip("_"),
            })
        return ent_index[label]

    incidents = []
    for inc in incidents_in:
        ents = sorted({entity_for(e["name"]) for e in inc["entities"]})
        incidents.append({
            "id": inc["incident_id"],
            "title": inc["title"],
            "start": inc["date_range"]["start"],
            "end": inc["date_range"]["end"],
            "cats": sorted(cat_index[c] for c in inc["categories"]),
            "summary": clean_summary(inc["summary"]),
            "posts": inc["sources"]["facebook"],
            "ents": ents,
        })

    ent_incidents = defaultdict(list)
    pair_incidents = defaultdict(list)
    for n, inc in enumerate(incidents):
        for e in inc["ents"]:
            ent_incidents[e].append(n)
        for a, b in itertools.combinations(inc["ents"], 2):
            pair_incidents[(a, b)].append(n)

    other = cat_index["other"]
    slugs = Counter()
    for e, ent in enumerate(entities):
        cat_counts = Counter(c for n in ent_incidents[e] for c in incidents[n]["cats"])
        slugs[ent["slug"]] += 1
        if slugs[ent["slug"]] > 1:
            ent["slug"] = f"{ent['slug']}_{slugs[ent['slug']]}"
        ent["incidents"] = ent_incidents[e]
        ent["cats"] = {str(c): k for c, k in sorted(cat_counts.items())}
        ent["kinds"] = sum(1 for c in cat_counts if c != other)

    links = [[a, b, ns] for (a, b), ns in sorted(pair_incidents.items())]

    data = {
        "meta": {
            "version": str(meta.get("version", 1)),
            "generated": meta["generated"],
            "group": meta["group"],
            "group_id": meta["group_id"],
            "date_range": meta["date_range"],
            "posts": meta["posts"],
            "incident_posts": meta["incident_posts"],
            "source_file": path.name,
        },
        "categories": categories,
        "entities": entities,
        "incidents": incidents,
        "links": links,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(f"window.ARCHIVE = {payload};\n")
    print(
        f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB): "
        f"{len(incidents)} incidents, {len(entities)} entities, {len(links)} links, "
        f"{len(warnings)} warnings"
    )


if __name__ == "__main__":
    main()
