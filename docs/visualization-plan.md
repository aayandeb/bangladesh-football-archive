# Visualization Plan — Knowledge Graph Web View

Status: proposed, 16 November 2026. Based on the v1 export (`data/export/archive_export.json`: 273 incidents, 600 nodes, 7,835 edges).

## Goal

Build a small static webpage that lets a reader answer the project's real question: do the same few names keep appearing across many different kinds of incidents? Every number on screen must lead back to the incidents and Facebook posts behind it.

The page is a view of the data, not the product. It reads the export, derives what it needs with a script, and never writes back.

## Ground rules from the project brief

- **Allegations, not verdicts.** The page shows that fans alleged something, with sources. Wording such as "appears in 54 incidents" is fine. Wording such as "involved in 54 scandals" is not. A short, permanent note on the page says this.
- **Every claim is one click from its source.** Entity, then incidents, then post permalinks.
- **Show the data version.** The page header shows "v1 baseline" and the export date. When a validated v2 export replaces v1, the build script is rerun and the label changes.
- **Free to run.** Static files only, with no backend, paid hosting, or API keys. It runs locally with `python3 -m http.server`, and later on GitHub Pages if the owner wants it public.
- **No visual formatting in data files.** Colours, sizes, and layout live in `web/`, never in `data/`.
- **Fresh design.** The earlier preview was rejected. Don't reuse its look; phase 1 settles the visual direction before the build.

## What the data says about the design

These findings from the v1 export drive the choices below.

1. **The raw graph is a hairball.** 6,624 of the 7,835 edges (85%) come from a single shared incident. Showing only edges with 2 or more shared incidents leaves 1,211 edges and 198 nodes.
2. **Two hubs connect everything.** The Bangladesh Football Federation appears in 165 of the 273 incidents and has 434 edges. The national team has 247 edges. Drawn by default, they pull every node into one blob. Hiding both, with a minimum of 2 shared incidents, leaves 959 edges and 175 nodes.
3. **Organisations and clubs dominate the category-span ranking.** BFF spans 16 categories, Bashundhara Kings 14, and Mohammedan 13. The syndicate question is mostly about people, so the main ranking needs a "people only" view.
4. **The people signal is concentrated.** Not counting `other`, 44 people span 3 or more categories and 10 span 5 or more. The top names are Jamal Bhuyan (9 categories, 22 incidents), Kazi Salahuddin (8, 54), Mamunul Islam (7, 29), and Abu Nayeem Shohag (7, 16). The project brief counts `other` and reports 10 and 9 categories for the first two. The page must state which way it counts.
5. **Edges carry no relation type.** Every edge is "appears with" plus a list of incident IDs. The useful edge attributes are the number of shared incidents and which categories those incidents fall in. Both are derived by the build script.
6. **Some taxonomy categories are empty in v1.** `broadcast_blackout`, `foreign_player_naturalisation`, and `player_welfare_neglect` were promoted after v1 ran, so their v1 incidents still sit under `other`. `nepotism` has 1 incident and `drug_doping` 2. The views should keep all 20 categories in a fixed order so v1 and v2 line up.

## Views, in build order

The first two views give the clearest answer for the least effort. The network graph comes third because it is the hardest to make readable.

### 1. Category span matrix (the main view)

- Rows are entities and columns are the incident categories. Each cell shows how many incidents link that entity to that category, drawn as a shaded square with the number on hover.
- Rows are sorted by the number of categories spanned, then by incident count.
- Default filter is people only, with at least 3 categories. A toggle adds clubs, organisations, and tournaments.
- Categories are grouped as in the taxonomy: on-field, player conduct, governance, clubs and structure, media, and other.
- Clicking a row opens the entity profile. Clicking a cell opens that entity's incidents in that category.

This is a plain HTML grid and needs no chart library.

### 2. Entity profile panel

This is the evidence trail. It opens from every other view.

- Name, type, incident count, and categories spanned, with the counting rule stated.
- A small strip timeline from 2014 to 2021, with one mark per incident, coloured by category group.
- A list of incidents with title, date range, categories, summary, number of source posts, and links to the Facebook permalinks.
- "Most often appears with": the top co-appearing entities, with the number of shared incidents. Clicking one shows only the incidents the two share.

### 3. Co-appearance network

- Built with [force-graph](https://github.com/vasturiano/force-graph) from a CDN.
- Defaults: at least 2 shared incidents, BFF and the national team hidden but available behind a toggle, and labels shown only for larger nodes and the hovered node's neighbours.
- Colour shows entity type (person, team, organisation, tournament, other). Size shows the number of categories spanned, not raw incident count, so the syndicate signal is what stands out.
- Edge thickness shows the number of shared incidents.
- Controls: minimum-shared-incidents slider, entity type checkboxes, category filter (keep only edges whose shared incidents include the chosen categories), and a search box.
- Clicking a node highlights its neighbours and opens the entity profile. Clicking an edge lists the shared incidents.

### 4. Incident timeline (optional, after review)

- Rows are categories and the horizontal axis runs from September 2014 to December 2021. Each incident is a dot sized by its number of source posts.
- It can be filtered by entity, which shows when a person's incidents cluster.
- Lowest priority. Build it only if the owner wants it after seeing views 1 to 3.

## Architecture

```
scripts/
  build_web_data.py      Reads data/export/archive_export.json and writes web/data/*.json
  validate_export.py     Checks the export before building (see below)
web/
  index.html             One page, tabbed or stacked views
  app.js                 Plain JavaScript, no framework, no bundler
  style.css
  data/
    entities.json        id, label, type, incident_count, per-category incident counts, span with and without "other"
    edges.json           source, target, incident_ids, weight, categories of shared incidents
    incidents.json       id, title, date range, categories, summary, post count, permalinks, entity ids
    meta.json            export version, generation date, counts, counting rules
```

- Python standard library only, with no dependencies.
- The web data is committed so the page works on GitHub Pages without a build step. It is small, under 1 MB, because classified posts are left out.
- The browser never loads the 13.6 MB export.
- Bangla text uses Noto Sans Bengali as a fallback font. In v1 only one node label is non-ASCII, but summaries and later data may have more.

### Validation in `validate_export.py`

The build stops if any of these fail:

- Every edge endpoint exists as a node.
- Every incident ID on an edge exists in the incidents list.
- Every incident's post IDs exist among the posts, and every incident has at least one Facebook permalink.
- Each node's `incident_count` and `categories` match a recount from the incidents.
- Possible duplicate entities are flagged as warnings for the owner to review, not merged automatically. These are labels that are near-identical after lowercasing and removing punctuation and words like "FC", "SC", or "Limited".

## Phases

| Phase | Work | Done when | Rough agent budget |
|---|---|---|---|
| 0 | Repo structure, git, this plan | Committed | Done |
| 1 | Settle the visual direction: two quick static mockups of the span matrix with the real top 15 people, in clearly different styles | Owner picks one or asks for changes | 40k–80k tokens |
| 2 | `validate_export.py` and `build_web_data.py` | Validation passes, or prints a short list of issues, and `web/data/` is generated | 60k–120k tokens |
| 3 | Span matrix and entity profile | Owner can go from a name to its incidents to the Facebook posts in two clicks | 100k–200k tokens |
| 4 | Co-appearance network | Default view is readable without adjusting controls, and clicking a node opens the profile | 100k–200k tokens |
| 5 | Review with owner, polish, optional timeline, optional GitHub Pages | Owner signs off | Varies |

Budgets assume the agent inspects the export only through small Python snippets and never opens the 13.6 MB file directly.

**Model choice.** A fast model is enough for phases 2 to 4 if it is given this document. Phase 1 involves design judgment, so a stronger model is worth using there, or anywhere a fast model loops on visual fixes.

## Out of scope

- Newspaper collection or corroboration. It is on hold until the owner authorises it. The data model already has a `sources.newspapers` slot, and the incident list can show a "press-corroborated" badge once it is filled.
- Changing classifications, incidents, or entity normalisation from the web page.
- Comment-level data, which is incomplete, especially for 2014–2015.

## Open questions for the owner

1. Should the category span count `other`? The plan shows both numbers but needs one as the default.
2. Should BFF and the national team be hidden from the network by default? They stay visible in the matrix either way.
3. Is the page private (local only) or eventually public on GitHub Pages? If public, the repo must be public too, or hosted elsewhere for free.
4. When v2 is validated, should the page show v1 and v2 side by side, or switch to v2 only?
