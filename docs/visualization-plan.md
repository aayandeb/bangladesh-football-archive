# Visualization Plan — Knowledge Graph Web View

Status: proposed, 16 November 2026. Based on the v2 export (`data/export/archive_export-v2.json`: 608 incidents, 719 nodes, 7,758 edges), pending the owner's confirmation that v2 replaces v1. The v1 export (`data/export/archive_export.json`: 273 incidents, 600 nodes, 7,835 edges) stays in the repo as the baseline.

## Goal

Build a small static webpage that lets a reader answer the project's real question: do the same few names keep appearing across many different kinds of incidents? Every number on screen must lead back to the incidents and Facebook posts behind it.

The page is a view of the data, not the product. It reads the export, derives what it needs with a script, and never writes back.

## Ground rules from the project brief

- **Allegations, not verdicts.** The page shows that fans alleged something, with sources. Wording such as "appears in 54 incidents" is fine. Wording such as "involved in 54 scandals" is not. A short, permanent note on the page says this.
- **Every claim is one click from its source.** Entity, then incidents, then post permalinks.
- **Show the data version.** The page header shows the export version (`meta.version`, which v2 has and v1 lacks, so a missing value means v1) and the generation date. The build script takes the export path as an argument, so switching versions means rerunning it.
- **Free to run.** Static files only, with no backend, paid hosting, or API keys. It runs locally with `python3 -m http.server`, and later on GitHub Pages if the owner wants it public.
- **No visual formatting in data files.** Colours, sizes, and layout live in `web/`, never in `data/`.
- **Fresh design.** The earlier preview was rejected. Don't reuse its look; phase 1 settles the visual direction before the build.

## What the data says about the design

These findings from the v2 export drive the choices below. v1 figures are given where the comparison matters.

1. **The raw graph is a hairball.** 6,427 of the 7,758 edges (83%) come from a single shared incident. Showing only edges with 2 or more shared incidents leaves 1,331.
2. **Two hubs connect everything.** The Bangladesh Football Federation appears in 293 of the 608 incidents and has 488 edges. The national team has 276 edges. Drawn by default, they pull every node into one blob. Hiding both, with a minimum of 2 shared incidents, leaves 1,048 edges and 217 nodes.
3. **Organisations and clubs dominate the category-span ranking.** BFF spans 19 categories, the national team 18, Bashundhara Kings 17, and Abahani and Mohammedan 16 each. The syndicate question is mostly about people, so the main ranking needs a "people only" view.
4. **The people signal is clearer in v2.** Not counting `other`, 58 people span 3 or more categories and 22 span 5 or more (v1: 44 and 10). The top names are Mamunul Islam (12 categories, 31 incidents), Jamal Bhuyan (12, 30), Kazi Salahuddin (11, 83), Zahid Hassan Emily (9, 22), and Oscar Bruzon (8, 19). Counting `other` adds one to each of those five. The page must state which way it counts.
5. **v2 incidents are tighter.** The average incident names 4.7 entities, down from 7.1 in v1. That is why v2 has more than twice the incidents but slightly fewer edges: v1's large clusters (up to 32 entities) created many weak links.
6. **Edges carry no relation type.** Every edge is "appears with" plus a list of incident IDs. The useful edge attributes are the number of shared incidents and which categories those incidents fall in. Both are derived by the build script.
7. **All 20 categories are now in use.** The three promoted categories have real counts in v2: `player_welfare_neglect` 31, `broadcast_blackout` 18, `foreign_player_naturalisation` 11. `other` is the largest category at 87 incidents, so a filter to hide it matters. The views keep all 20 categories in a fixed taxonomy order.

## v3 export (17 November 2026)

The web view now builds from `archive_export-v3.json`. Checked against v2.1 and against its own posts:

- Every v2.1 incident ID is still present. 431 incidents are new, from the 2022–2025 posts. The window is 3 September 2014 to 31 December 2025: 1,039 incidents, 8,080 incident posts, 40,118 posts, 1,130 graph nodes.
- `INC-2021-12-012` absorbed the January 2022 continuation and grew from 4 posts to 77. `INC-2022-01-001` is not a separate incident.
- No broken references. 28 incidents name no one, so they stay in the list and out of the graph. Three name pairs are still unmerged: Club Eagles / Eagles FC, Dhaka Wanderers / Dhaka Wanderers Club, Mohammedan / Mohammedan SC.
- The same 23 categories are in use. The strip and the header years follow this export's dates.

## v2.1 export (16 November 2026)

`archive_export-v2.1.json` is a relabel-only update of v2, checked against it:

- Incident IDs, post lists, titles, and posts are identical to v2.
- 55 incidents changed category. 18 moved from `broadcast_blackout` to `broadcast_coverage`, 37 left `other` (11 to `foreign_players_domestic`, 9 to `development_neglect`, 8 to `club_mismanagement`, 6 to `broadcast_coverage`, 3 to `player_welfare_neglect`). `other` dropped from 87 to 50.
- 39 summaries changed, only to remove the "Suggested new category" notes for the promoted categories.
- The three duplicate entities are merged and the graph block now agrees with the incidents, so the alias list in `scripts/` was removed.
- Top people by kinds, not counting Other: Jamal Bhuyan 13 kinds and 30 incidents, Mamunul Islam 12 and 31, Kazi Salahuddin 11 and 83, Zahid Hassan Emily 10 and 22, Oscar Bruzon 10 and 19. 62 people span 3 or more kinds and 23 span 5 or more.

## v2 export check (16 November 2026)

Checked against its own posts and incidents:

- **Passes:** no duplicate incident IDs, every edge endpoint and edge incident ID exists, every incident's posts exist, every incident has Facebook permalinks, and no post sits in two incidents.
- **Relationship to v1:** 270 of the 273 v1 incident IDs are reused, but only 25 keep exactly the same posts. 1,568 of the 1,612 v1 incident posts are inside some v2 incident. v2 is a re-clustering, not v1 plus additions, so v1 and v2 incidents can't be compared by ID.
- **17 incidents name no entities**, so they never appear in the graph. They still belong in the incident list and timeline.
- **Three entities are split across two spellings:**
  - `NoFeL SC` and `NoFel SC` share the node ID `nofel_sc`. The graph therefore has two nodes with one ID and three duplicate edge pairs. Node counts on these two are wrong (3 and 2 instead of 5).
  - `Daily Star` and `The Daily Star` are separate nodes.
  - `Manang Marshyangdi` and `Manang Marshyangdi Club` are separate nodes.

  None are central names, so the main findings don't change. The right fix is upstream in Muse's entity map. Until then, the build script merges nodes that share an ID and applies a small alias list kept in `scripts/`, not in `data/`. The script reports both so they don't hide.

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
- Defaults: at least 3 shared incidents, BFF and the national team hidden but available behind a toggle, and labels shown only for larger nodes and the hovered node's strongest connections.
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
  build_web_data.py      Reads an export (default: data/export/archive_export-v2.json) and writes web/data/*.json
  entity_aliases.json    Temporary spelling merges until the entity map is fixed upstream
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
- The browser never loads the 14 MB export.
- Bangla text uses Noto Sans Bengali as a fallback font. Node labels are almost all in English, but summaries and later data may contain Bangla.

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
| 1 | Settle the visual direction | Owner chose a minimal direction; rules are in `docs/design.md` | Done |
| 2 | `validate_export.py` and `build_web_data.py` | Validation passes, or prints a short list of issues, and `web/data/` is generated | Done |
| 3 | Span matrix and entity profile, plus a searchable incident list | Owner can go from a name to its incidents to the Facebook posts in two clicks | Done, awaiting owner review |
| 4 | Co-appearance network | Default view is readable without adjusting controls, and clicking a node opens the profile | Done, awaiting owner review. The default is 3 shared incidents rather than 2, which gives 117 names instead of 218 |
| 5 | Review with owner, polish, optional timeline, optional GitHub Pages | Owner signs off | Varies |

Budgets assume the agent inspects the export only through small Python snippets and never opens an export file directly.

**Model choice.** A fast model is enough for phases 2 to 4 if it is given this document. Phase 1 involves design judgment, so a stronger model is worth using there, or anywhere a fast model loops on visual fixes.

## Out of scope

- Newspaper collection or corroboration. It is on hold until the owner authorises it. The data model already has a `sources.newspapers` slot, and the incident list can show a "press-corroborated" badge once it is filled.
- Changing classifications, incidents, or entity normalisation from the web page.
- Comment-level data, which is incomplete, especially for 2014–2015.

## Open questions for the owner

1. Should the category span count `other`? The plan shows both numbers but needs one as the default.
2. Should BFF and the national team be hidden from the network by default? They stay visible in the matrix either way.
3. Is the page private (local only) or eventually public on GitHub Pages? If public, the repo must be public too, or hosted elsewhere for free.
4. Does v2 replace v1 for the page? The plan assumes yes. Since v2 re-clusters rather than extends v1, a side-by-side comparison would only make sense at the entity level (incident counts and categories per name), not incident by incident.
5. Should Muse fix the three split entities in its entity map and re-export, or is the alias list in the build script enough?
