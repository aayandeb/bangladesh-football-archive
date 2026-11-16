# Bangladesh Football Archive — Project Context

A shareable brief for anyone — a person or another AI agent — picking up this project cold. It explains what the project is, why it exists, how it is being built, what is already done, and what must not be started yet.

## What this project is

This project is building an archive of controversies in Bangladesh football from roughly the past 15 years, using posts and comments from a Bangladeshi fan group on Facebook as the primary source, with newspaper stories to be added later as corroboration.

The archive is intended as a repository that raises awareness among Bangladeshi fans. It is not a news report, a verdict, or a list of proven charges. Every claim in it stays attached to the posts that made it, so a reader can check the source for themselves.

The practical product is data, not a finished website. The findings are kept as clean, portable JSON files that anyone can rebuild a timeline, a search tool, or a visualisation from later, from scratch.

## The real purpose is the syndicate question

The deeper purpose, in the project owner's words, is to look for evidence of a so-called "syndicate" in Bangladesh football — a deep-state-like network that is said to control the game.

That purpose shapes the whole method:

- A syndicate is not a single incident or a single category. It would show up as a pattern across incidents.
- The signature to look for is the same small set of names appearing again and again across different kinds of incidents — team and player selection, coach recruitment, federation politics, finance, refereeing, and more.
- No single post proves a syndicate. The pattern across many sourced incidents is the evidence, if it is there.
- A knowledge graph is the main tool for surfacing that pattern, because it makes cross-incident overlap visible: who spans the most incident types, who keeps appearing together, and who keeps benefiting from decisions.

Keep allegations in that frame. Fan posts allege; the archive records that they alleged it, with sources. It does not present an allegation as established fact.

## Source and scope

The primary source is the Facebook group **Bangladesh Football Walking Around the Dreams**.

- The group is a large, public fan group with about 60,000 members. It was created on 3 September 2014.
- The project owner has the permission of the group's admins to gather its post information.
- The collection window is September 2014 to December 2021 — 76 monthly windows. That is the group's life from its creation through 2021, rather than its more recent posts.
- Only posts still visible can be collected. Deleted or removed posts are gone and are not in the archive.
- Posts are mostly Bangla or Bangla/English mixed (64% of the corpus), with 27% mostly English and 9% with no text at all (photo or video only).

A second source — newspapers — is planned but has not started. See "What is on hold" below.

## Principles and constraints

Anyone continuing this work should hold to these rules, because they were set by the project owner:

- Use the official and legal route only. Collection runs through the owner's own connected Facebook account, paced slowly, even though the group admins have given permission. Do not use scraper tools that violate Facebook's terms.
- Aim to pay no money at all where possible. The owner wants to use AI models for technical work they do not have, rather than paid services.
- Keep every claim sourced. An incident must link back to the Facebook posts behind it, and later to any newspaper coverage that corroborates it.
- Do not present corruption or other serious claims from fan posts as established fact. Attribute them, with sources.
- Respect Facebook's limits. When Facebook rate-limits collection, stop and resume later rather than pushing through. Comments collection is limited by a daily cap of roughly 3,000 calls a day.
- For newspapers, store only headline, date, link, and a short summary. Do not store full article text, which is the newspaper's copyrighted content.
- Deliver work in phases. Finished phases are uploaded to the owner's Google Drive folder called "Bangladesh Football Archive" as each phase finishes, rather than shared only through expiring download links.

## Method — classify everything first, then find the controversies

This ordering is a deliberate decision by the owner, and reversing it would change the results:

> Do not pre-filter for "controversy" posts. Classify all posts first, then figure out the controversies from the classified data.

Filtering first would bake in assumptions about what counts as a controversy and would throw away context — you cannot tell what is anomalous if you never classified what normal fan talk looks like.

The work therefore runs in two layers.

### Layer 1 — classify every post

Every post is classified, with no controversy judgement at that stage, by:

- Topic (1–2 topics per post, from the Layer 1 list below)
- Sentiment: positive, neutral, negative, or mixed
- Entities: people, clubs, teams, organisations, and tournaments named in the post, resolved to one canonical name even when the same entity appears under several Bangla and English spellings

### Layer 2 — derive incidents from the classified posts

Controversies are figured out afterwards, from the classified data:

- Posts about the same event, with the same names, in the same time window, are clustered into one incident.
- A single post can become an incident only if it carries enough engagement on its own. In the first clustering pass that threshold was 100+ engagement; the looser second pass lowered it to 50.
- Each incident is then assigned one or more controversy categories from the Layer 2 list below. Categories apply to incidents, not to individual posts.
- Entities from the incidents become the nodes of the knowledge graph, and shared incidents become its edges.

## Taxonomy

### Layer 1 topics — for all posts

| Topic | Covers |
|---|---|
| match_discussion | Match reports, scores, live match talk, results |
| team_selection | Squad announcements and selection debates, any stance |
| coach | Coaching news, appointments, sackings, tactics |
| federation | BFF news, elections, officials, administration |
| transfers | Player transfers, signings, rumours |
| player_news | Individual player news, injuries, form, milestones |
| club_news | Club news and the domestic league |
| tournament | SAFF, World Cup qualifiers, AFC competitions, Bangabandhu Cup |
| fan_content | Photos, memes, birthday wishes, general fan posts |
| media | Newspaper and TV links, interviews, press coverage |
| other | Does not fit; the summary should name what it looks like |

BFF in this document is the Bangladesh Football Federation.

### Layer 2 categories — for incidents only (20 categories)

The owner's original four categories were biased selection, coach recruitment, tournament mishaps, and corruption. The list grew from suggestions and from the data, including player conduct categories the owner named directly.

**On-field and sporting**

- biased_selection — players picked or dropped unfairly; club favouritism or politics over form
- coach_recruitment — questionable hires, sudden sackings, foreign vs local coach rows
- refereeing — biased or incompetent refereeing, intimidation of referees
- match_fixing_betting — fixed matches, suspicious results, betting involvement
- age_fraud — falsified ages, especially in youth teams
- foreign_player_naturalisation — naturalising foreign players for the national team

**Player conduct**

- disciplinary_breach — on-field violence, brawls, walkouts, repeated red cards
- drug_doping — failed tests and substance abuse
- social_media_abuse — players, coaches, or officials abusing others online, and fans abusing players

**Federation and governance**

- corruption_finance — missing funds, FIFA and AFC money, kickbacks, financial mismanagement
- federation_politics — elections, power struggles, and BFF leadership fights
- nepotism — family or club connections driving decisions

**Clubs, contracts, and structure**

- contracts_pay — unpaid wages, transfer rows, and contract breaches. This belongs here, not under player conduct: unpaid wages are something done to players, usually by clubs not paying them.
- tournament_mishap — hosting failures, scheduling chaos, withdrawals, organisational blunders
- infrastructure — stadium conditions, training facilities, neglect
- womens_football — funding, support, and treatment of the women's game
- club_vs_federation — league boycotts, licensing fights, club pullouts
- player_welfare_neglect — injured or ill players left without care, poor camp and living conditions

**Media and coverage**

- broadcast_blackout — matches not televised or streamed, leaving fans without coverage

**Catch-all**

- other — does not fit any category above; the classifier should name what it looks like instead, so new categories can grow from the data

Three categories — broadcast_blackout, foreign_player_naturalisation, and player_welfare_neglect — began in "other" and were promoted to full categories by the owner on 16 November 2026.

## What has been collected

### Posts — complete

All 24,370 posts in the window have been collected:

| Part | Posts |
|---|---:|
| 2019 pilot | 3,561 |
| Full sweep, additional posts | 20,809 |
| Total | 24,370 |

Posts by year: 2014 — 499; 2015 — 4,526; 2016 — 2,961; 2017 — 1,621; 2018 — 2,754; 2019 — 3,561; 2020 — 3,056; 2021 — 5,392.

Corpus notes that matter for analysis:

- Total reactions across the corpus are 1,099,824. The median post has 16 reactions, 2 comments, and 117 characters of text.
- 2,230 posts have no text, so they can only be assessed by engagement, not by content.
- Post data has no author field, so author-based analysis is not possible from posts alone.
- Engagement tracks controversy: the most-reacted post in the archive (1,482 reactions, 144 comments) is a call to remove Kazi Salahuddin, the BFF president, after a SAFF failure.
- The busiest periods are mid-2015 and late 2021, especially September 2021 (1,030 posts in that month alone).

### Comments — partly complete, and slow

- The 2019 pilot is complete and verified: 3,561 posts with 8,221 top-level comments and 7,615 replies — 15,836 comment objects in total, 96.4% of what Facebook's counts imply should exist, in 5,382 files with zero corrupt files and zero duplicate IDs. The missing remainder is most likely deleted or hidden content.
- Comments for the full sweep are not complete. Facebook enforces a daily cap of roughly 3,000 calls a day, so this phase takes days rather than hours and resumes after each day's limit resets.
- Comments on 2014–2015 posts mostly come back empty from Facebook even when the post says it has comments — a tested 2015 post claiming 217 comments returned zero. The gap is hit-or-miss by post, not whole years lost, but the earliest years' threads are largely unrecoverable through the API. Comments from 2016 onward work.

## What analysis is done so far

Status as of 15–16 November 2026 (CST). Where a later pass was still running, that is stated rather than assumed finished.

### Triage — complete and validated

All 24,370 posts were classified under Layer 1, in 88 monthly files, and validated with 0 missing, 0 extra, and 0 bad lines.

Headline shape:

- Largest relevant topics include federation (1,993 posts), coach (1,406), and team_selection (1,037). The largest topics overall are everyday fan talk, such as match_discussion (4,452) and fan_content (3,784).
- 5,976 posts are negative in sentiment, and negativity climbs over time: 31% of 2021 posts are negative, and 37% in September–December 2021 alone, the densest negative stretch in the archive.
- The most-mentioned entities include the BFF (1,776 mentions) and Kazi Salahuddin (711 mentions).
- Entity names need normalising before graph work, because the same entity appears under several spellings — for example the national team under three names and Abahani under two.

### First incident clustering (v1) — complete, and kept as the baseline

- 273 incidents derived from 1,612 posts. The other posts are still classified and in the export; they simply did not converge into an incident under the stricter first-pass rules. Only 45 of the 273 incidents are single-post incidents.
- Knowledge graph: 600 nodes and 7,835 edges.
- Largest incident categories in v1: federation_politics (37), biased_selection (33), other (32), coach_recruitment (28), infrastructure (24), and corruption_finance (19).

Early syndicate signal from v1 — read as a pattern to investigate, not as proof:

- Kazi Salahuddin spans 9 incident categories across 54 incidents.
- Jamal Bhuyan spans 10 categories across 22 incidents.
- The BFF appears in 165 of the 273 incidents.

### Looser re-clustering (v2) — started, with v1 retained

4,447 negative posts did not cluster into any incident in v1. The owner asked for smaller clusters and approved a looser second pass:

- Single-post threshold lowered from 100 to 50 engagement
- Cluster window widened to 60 days
- The full 20-category taxonomy used, including the three promoted categories
- The 4,447 unclustered negative posts revisited specifically

The owner chose to let this pass finish rather than stop it. Until a validated v2 export replaces it, treat the v1 counts above as the citable baseline.

## The data product

The data is the product. A web page is only a view of it.

The consolidated handoff file is `archive_export.json` (13.6 MB for v1). One file contains:

- Metadata: 24,370 posts, date range 2014-09-03 to 2021-12-31, and the source group
- All classified posts
- All incidents
- The knowledge graph (nodes and edges)

Supporting files use the same data in separate pieces:

- Classified posts: one JSON Lines file per month, with post ID, date, topics, sentiment, confidence, entities, a one-line summary, reaction count, and comment count
- `incidents.json`: one object per incident, with title, date range, category, the post IDs behind it, entities, a summary, and sources — Facebook permalinks, plus a newspapers list to be filled in the newspaper phase
- `graph.json`: nodes and edges only, with no visual formatting. A node's incident count and the categories it spans are the syndicate signal described above.
- `entity_map.json`: the normalisation that resolves different spellings of the same entity to one canonical entity

A preview web page was built to show the intended shape — timeline, incident list, and clickable graph. The owner rejected its look, so visuals are deferred. Do not treat any preview as the design to copy; rebuild visuals from the JSON from scratch when that work is eventually requested.

Finished phases are also uploaded to the Google Drive folder "Bangladesh Football Archive". The 2019 archive and the full-sweep posts file are already in that folder.

## What is on hold

### Newspaper phase — do not start yet

The owner has explicitly said not to start the newspaper phase yet. They want to review the current outputs with another agent for clarity first. Do not begin newspaper collection until the owner says so.

When it is eventually authorised, the planned method is:

- Start from the incident list, not from blind collection of years of football news.
- Search the major papers that cover Bangladesh football — Prothom Alo, Daily Star, Dhaka Tribune, New Age, Jugantor, and Kaler Kantho were the titles discussed — for coverage of each incident.
- Match a story to an incident by names, tournament, and time window.
- Attach it to that incident as independent corroboration, storing headline, date, link, and a short summary only.
- An incident backed by both fan posts and press coverage carries a different weight from one backed by fan posts alone. That distinction matters for the syndicate question.

### Visuals — deferred

The owner will think about visuals later. Keep producing clean data in the meantime and add no visual formatting to the data files.

## If you are picking this up

For a person or agent starting from this document:

1. Start from `archive_export.json`. It is the single file that contains the classified posts, the v1 incidents, and the graph.
2. Keep the two layers separate. Do not re-run classification as a controversy filter, and do not apply incident categories to individual posts.
3. Normalise entities before any graph claim. The same person, club, or team appears under multiple spellings in Bangla and English.
4. Quote v1 numbers as the baseline unless a validated v2 export is in front of you. Check which version a file is before citing its counts.
5. Keep every incident sourced to its post IDs and permalinks. If a claim has no source in the data, do not state it.
6. Do not start the newspaper phase, and do not redesign the visuals, until the owner asks for that work.
7. Expect comments data to be incomplete, especially for 2014–2015, and say so in any analysis that relies on comments.

## Open questions for the owner

- Does the validated v2 re-clustering replace v1 as the main incident set, and how much of the 4,447 previously unclustered negative posts does it account for?
- After the owner's review for clarity, should the newspaper phase proceed, and in the planned per-incident order?
- What should the eventual public presentation look like, now that the first preview has been set aside?

## Handoff checklist

Share these together so the next person or agent has the full picture:

- This project context document
- `archive_export.json` — the consolidated data file
- Optionally, `incidents.json` and `graph.json` on their own, if the other party only needs incidents or the graph
