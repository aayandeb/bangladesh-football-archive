"""Integrity checks for an archive export.

Usage: python3 scripts/validate_export.py [path/to/archive_export.json]

Errors are broken references between incidents, posts, and sources; the web
build refuses to run on them. Warnings are things the owner should review,
including disagreements between the export's graph block and its incidents.
Those don't block the build because the web data recomputes the graph from the
incidents.
"""

import itertools
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXPORT = ROOT / "data" / "export" / "archive_export-v2.json"

_NAME_NOISE = re.compile(r"\b(the|fc|sc|ks|club|limited|ltd)\b")


def _name_key(label):
    key = re.sub(r"[^a-z0-9\u0980-\u09ff ]", " ", label.lower())
    return " ".join(_NAME_NOISE.sub(" ", key).split())


def validate(export, aliases=None):
    aliases = aliases or {}
    errors, warnings = [], []
    graph, incidents = export["graph"], export["incidents"]

    incident_ids = Counter(i["incident_id"] for i in incidents)
    for iid, n in incident_ids.items():
        if n > 1:
            errors.append(f"incident ID {iid} appears {n} times")

    post_ids = {p["post_id"] for p in export["posts"]}
    post_owner = defaultdict(list)
    for inc in incidents:
        for pid in inc["post_ids"]:
            post_owner[pid].append(inc["incident_id"])
            if pid not in post_ids:
                errors.append(f"{inc['incident_id']} cites post {pid}, which is not in posts")
        if not inc.get("sources", {}).get("facebook"):
            errors.append(f"{inc['incident_id']} has no Facebook permalinks")
    for pid, owners in post_owner.items():
        if len(owners) > 1:
            warnings.append(f"post {pid} is in several incidents: {', '.join(owners)}")

    node_ids = Counter(n["id"] for n in graph["nodes"])
    for nid, n in node_ids.items():
        if n > 1:
            labels = [x["label"] for x in graph["nodes"] if x["id"] == nid]
            warnings.append(f"graph: node ID {nid} is used by {n} nodes: {labels}")

    for edge in graph["edges"]:
        for end in (edge["source"], edge["target"]):
            if end not in node_ids:
                errors.append(f"edge endpoint {end} is not a node")
        for iid in edge["incident_ids"]:
            if iid not in incident_ids:
                errors.append(f"edge {edge['source']}–{edge['target']} cites unknown incident {iid}")

    pair_counts = Counter(tuple(sorted((e["source"], e["target"]))) for e in graph["edges"])
    for pair, n in pair_counts.items():
        if n > 1:
            warnings.append(f"graph: edge {pair[0]}–{pair[1]} appears {n} times")

    # Recount node statistics from the incidents, matching entities by label.
    by_label = {n["label"]: n for n in graph["nodes"]}
    count, cats = Counter(), defaultdict(set)
    pairs = defaultdict(set)
    unmatched = Counter()
    for inc in incidents:
        labels = set()
        for ent in inc["entities"]:
            if ent["name"] in by_label:
                labels.add(ent["name"])
            else:
                unmatched[ent["name"]] += 1
        for label in labels:
            count[label] += 1
            cats[label] |= set(inc["categories"])
        for a, b in itertools.combinations(sorted(labels), 2):
            pairs[(a, b)].add(inc["incident_id"])
    for name, n in unmatched.most_common():
        warnings.append(f"entity name {name!r} in {n} incident(s) matches no node label")
    for label, node in by_label.items():
        if node["incident_count"] != count[label] or set(node["categories"]) != cats[label]:
            warnings.append(
                f"graph: node {label!r} says {node['incident_count']} incidents, "
                f"recount from incidents gives {count[label]}"
            )
    if len(pairs) != len(pair_counts):
        warnings.append(
            f"graph: {len(pair_counts)} distinct entity pairs, "
            f"incidents imply {len(pairs)}"
        )

    no_entities = [i["incident_id"] for i in incidents if not i["entities"]]
    if no_entities:
        warnings.append(f"{len(no_entities)} incidents name no entities and will not appear in the graph")

    groups = defaultdict(list)
    for node in graph["nodes"]:
        groups[_name_key(node["label"])].append(node["label"])
    for labels in groups.values():
        if len(labels) < 2:
            continue
        canon = {aliases.get(l, l) for l in labels}
        status = "merged by entity_aliases.json" if len(canon) == 1 else "not merged"
        warnings.append(f"possible duplicate entity ({status}): {' / '.join(labels)}")

    return errors, warnings


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_EXPORT
    export = json.loads(path.read_text())
    aliases_path = ROOT / "scripts" / "entity_aliases.json"
    aliases = json.loads(aliases_path.read_text()) if aliases_path.exists() else {}
    errors, warnings = validate(export, aliases)
    print(f"{path.name}: {len(errors)} errors, {len(warnings)} warnings")
    for e in errors:
        print("  error:", e)
    for w in warnings:
        print("  warning:", w)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
