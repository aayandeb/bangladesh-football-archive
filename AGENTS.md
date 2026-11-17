# Handoff for agents

Read this first, then `docs/project-context.md` (what the project is and its rules), `docs/design.md` (visual rules, binding for anything in `web/`), and `docs/visualization-plan.md` (the plan and data findings).

## Where things stand (16 November 2026)

- **Data.** The current export is `data/export/archive_export-v2.1.json` (608 incidents, 716 entities). It is a relabel-only update of v2, checked: the same incident IDs and post lists, three new categories, `broadcast_blackout` renamed to `broadcast_coverage`, and duplicate entities merged. Spelling variants of the same person (for example Tarafdar Ruhul Amin and Tarafder Md Ruhul Amin) were still left apart, so `scripts/entity_aliases.json` maps them to one name at build time. The owner confirmed that "Ibrahim" is the winger Mohammad Ibrahim, that Shahidul Alam and the goalkeeper "Sohel" are Shahidul Alam Sohel, that Sohel Rana (senior) and Md. Sohel Rana (junior) are two different players, that "Faisal" stays on its own, that the two Christian goalkeeping-coach spellings are one person, and that Minhazul Islam is Minhazul Islam Minhaz. Samad Yousuf is merged into Samad Yusuf on the owner's word that they are probably the same player. Other first-name-only entries are not merged. v1 and v2 are kept for comparison. The raw Facebook pages in `data/raw/` are not in git.
- **Web view.** Done and working: a category matrix (main view), an entity side panel, a co-appearance network, and a searchable incident list. Every number clicks through to incidents and then to Facebook posts.
- **Incident pages.** Done, awaiting owner review. Every incident title links to `#incident/<incident_id>`, shown in the side panel with a related-incidents list (rule in `docs/design.md`). The hash names only the incident, so the view behind it travels in `history.state`; a link opened fresh shows the incident list behind it. The incident search also matches the names in each incident, not only the title and summary.
- **Forgiving search.** Done, awaiting owner review. `web/search.js` holds it, with no page code, and both the incident search and the Find boxes use it. It ignores capitals, punctuation and word endings, reads kind names, alias spellings and short forms (BFF, U-19, Md.), and falls back to the closest spelling only when a word matches nothing. The build adds two things for it: each entity's alias spellings (`aka`) and the groups of names the archive spells more than one way (`spellings`, 38 groups in v2.1). `python3 scripts/search_spellings.py` lists the groups. Meaning-based search and per-incident keywords were discussed with the owner and are not built.
- **Owner feedback so far.** The owner wants it minimal, with nothing flashy and no "AI slop" look. The name dropdown and label overlaps were fixed after the owner's review. The header now carries a Bangla and English allegation disclaimer, there is an About tab written in Bangla, and Contact opens a message to aayan.deb@outlook.com. Hosting is Vercel, configured by `vercel.json` to serve `web/` with no build.

## How to run

```
python3 scripts/build_web_data.py   # validates the export, writes web/data/archive.js
python3 scripts/serve.py            # http://localhost:8000, caching off
```

Rebuild after any change to an export or to `scripts/build_web_data.py`. Never edit `web/data/archive.js` by hand.

## Rules that are easy to break

- **Never open an export JSON in full.** Each is about 14 MB. Inspect them with small Python snippets that print counts or single records.
- **Allegations, not facts.** Interface copy says "named in N incidents", never "involved in". The allegation note stays visible.
- **No visual formatting in `data/`.** Colours, labels, and category display names live in `web/` or `scripts/build_web_data.py`.
- **Follow `docs/design.md`.** One typeface (Anek Bangla), one accent (flag green `#006A4E`, for data only), no cards, shadows, gradients, all-caps labels, middle-dot metadata, or decorative motion. If a change needs a new rule, add it to `design.md` first.
- **Spelling groups widen a search; they never merge people.** `scripts/search_spellings.py` groups name spellings that sound the same (Hasan, Hassan). If a rebuild groups two different names, add the pair to `APART` in that file. Merging entities still needs the owner and `scripts/entity_aliases.json`.
- **Category display names and order** are in `GROUPS` in `scripts/build_web_data.py`. A new category in an export shows up under "Added later" until it is added there.
- **The newspaper phase is on hold** until the owner says otherwise.

## Gotchas found while building

- The network (`force-graph`, vendored in `web/vendor/`) only advances on animation frames. In a hidden or background browser tab it stalls, and zoom-to-fit and resize don't run. That isn't a bug in the page; take a screenshot or bring the tab forward to make it render.
- Python's plain `http.server` lets the browser cache `archive.js`, so stale data shows after a rebuild. Use `scripts/serve.py`.
- Native `<datalist>` popups render in the wrong place in Cursor's embedded browser. The Find box uses a custom list (`bindFind` in `web/app.js`) for that reason.

## Later, only if the owner asks

- An incident timeline (rows by kind, 2014–2021). See the plan, view 4.
- GitHub Pages hosting. This needs the owner's decision on making the repo public.
- A newspaper corroboration badge on incidents, after the newspaper phase.

## Open questions for the owner

Also listed in the plan:

1. Does the category span count Other? The page currently does not, and says so.
2. Should Muse explain the 44 v1 incident posts that are in no v2 incident? It was asked; no answer is recorded here yet.
3. Should the page stay local or go public?
