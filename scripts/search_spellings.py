"""Find names the archive spells more than one way, for the web search.

Usage: python3 scripts/search_spellings.py     # lists the groups in web/data/archive.js

Bangla names have no single English spelling, so the same name turns up as
Salahuddin and Salauddin, or Bhuyan and Bhuiyan. The build groups such spellings
so a search for one also finds the others. This only widens a search. It never
merges entities; that stays with entity_aliases.json and the owner.

Two words are grouped when both are names and they differ only in ways that
don't change how the name sounds:

- a doubled letter (Hasan, Hassan)
- an h that is not the first letter (Sohag, Shohag)
- a vowel added or dropped inside the word (Yasin, Yeasin)
- one vowel swapped for a near one: a/o, o/u, e/i, i/y, a/e (Rabiul, Robiul)
- j/z, c/k, k/q, u/w, v/w (Jahid, Zahid)

One such difference is allowed, or two in a word of 8 letters or more. A
different consonant (Jamal, Kamal), or a vowel added at the end (Khaled,
Khaleda), is a different name and is never grouped.

A word counts as a name when it is part of an entity label or alias, or when the
titles and summaries write it with a capital away from the start of a sentence
and never in lower case. That keeps ordinary words (roles, rules) out.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pairs the rule would group that are different names. Add to this list when a
# review of the groups finds another.
APART = [
    ("asean", "asian"),
    ("jahan", "johan"),
]

MIN_LENGTH = 5
LONG = 8
NEVER = 9.0

_VOWELS = set("aeiou")
_NEAR = {frozenset(p) for p in ("ao", "ou", "ei", "iy", "ae", "jz", "ck", "kq", "uw", "vw")}
_FINAL_OK = ({"o", "u"}, {"e", "i"})


def _fold(word):
    return re.sub(r"(.)\1+", r"\1", word)


def _swap(a, b, final):
    if a == b:
        return 0.0
    if frozenset((a, b)) not in _NEAR:
        return NEVER
    if final and {a, b} <= _VOWELS and {a, b} not in _FINAL_OK:
        return NEVER
    return 0.5


def _gap(letter, first, final):
    if first:
        return NEVER
    if letter == "h":
        return 0.5
    if letter in _VOWELS and not final:
        return 0.5
    return NEVER


def _difference(a, b):
    """0 for the same sound, 0.5 for each small difference, NEVER or more for a different name."""
    n, m = len(a), len(b)
    if abs(n - m) > 2:
        return NEVER
    d = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        d[i][0] = d[i - 1][0] + _gap(a[i - 1], i == 1, i == n)
    for j in range(1, m + 1):
        d[0][j] = d[0][j - 1] + _gap(b[j - 1], j == 1, j == m)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(
                d[i - 1][j] + _gap(a[i - 1], i == 1, i == n),
                d[i][j - 1] + _gap(b[j - 1], j == 1, j == m),
                d[i - 1][j - 1] + _swap(a[i - 1], b[j - 1], i == n and j == m),
            )
    return d[n][m]


def _plain(text):
    return re.sub(r"[’']s\b", "", text).replace("’", "").replace("'", "")


def _names(texts, labels):
    lower, capital, seen = Counter(), Counter(), set()
    for text in texts:
        text = _plain(text)
        for match in re.finditer(r"[A-Za-z]+", text):
            word = match.group()
            key = word.lower()
            seen.add(key)
            if word[0].islower():
                lower[key] += 1
                continue
            before = text[: match.start()].rstrip()
            if before and before[-1] not in '.!?:"“(':
                capital[key] += 1
    in_labels = {w.lower() for label in labels for w in re.findall(r"[A-Za-z]+", _plain(label))}
    return sorted(
        w for w in seen | in_labels
        if (w in in_labels or capital[w]) and not lower[w] and len(_fold(w)) >= MIN_LENGTH
    )


def spelling_groups(texts, labels):
    """Groups of lower-case name spellings, each sorted, from titles, summaries and labels."""
    words = _names(texts, labels)
    apart = {frozenset(pair) for pair in APART}
    parent = {w: w for w in words}

    def find(w):
        while parent[w] != w:
            parent[w] = parent[parent[w]]
            w = parent[w]
        return w

    folded = {w: _fold(w) for w in words}
    for i, a in enumerate(words):
        for b in words[i + 1:]:
            if frozenset((a, b)) in apart:
                continue
            fa, fb = folded[a], folded[b]
            limit = 1.0 if min(len(fa), len(fb)) >= LONG else 0.5
            if fa == fb or _difference(fa, fb) <= limit:
                parent[find(a)] = find(b)

    groups = defaultdict(list)
    for w in words:
        groups[find(w)].append(w)
    return sorted(sorted(g) for g in groups.values() if len(g) > 1)


def main():
    text = (ROOT / "web" / "data" / "archive.js").read_text()
    data = json.loads(text[text.index("{"): text.rindex("}") + 1])
    groups = data.get("spellings", [])
    for group in groups:
        print(", ".join(group))
    print(f"{len(groups)} groups")


if __name__ == "__main__":
    main()
