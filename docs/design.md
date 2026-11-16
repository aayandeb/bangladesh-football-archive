# Design

Rules for the archive's web view. Read this before changing anything under `web/`. If a change needs a rule this file doesn't have, add the rule here first.

## The brief in one paragraph

The page is a reading tool for Bangladeshi fans and for the project owner. Its job is to show which names keep appearing across different kinds of incident, and to let anyone check the fan posts behind every number. It deals with allegations about real people, so it should feel calm and exact, like a well-kept register, not like an exposé. Nothing on the page should raise the temperature of the content.

## Principles

1. **The data is the design.** The category matrix is the one memorable element. Everything else is quiet, with plain type, no decoration, and a lot of space.
2. **Every number is a door.** A count on screen opens the incidents behind it, and an incident opens its Facebook posts. If something can't be clicked through to a source, it shouldn't look like a finding.
3. **Attribute, don't accuse.** Copy says "named in 83 incidents", never "involved in 83 scandals". The allegation disclaimer stays in the page header, above the tabs, in Bangla and then English. The About tab explains the project. It does not replace the disclaimer.
4. **One accent, used only for data.** Green marks data: matrix cells, people in the network, timeline ticks. Links, buttons, and headings stay ink-coloured.
5. **Remove one more thing.** Before shipping a change, look at the screen and remove one element. If nothing can go, it's done.

## Colour

| Name | Hex | Use |
|---|---|---|
| Paper | `#FFFFFF` | Page background. Plain white, not cream. |
| Ink | `#17241F` | Text, links, and button outlines. A green-black, taken from the accent so the page reads as one family. |
| Quiet | `#5D6A65` | Secondary text: dates, counts, notes. |
| Line | `#DCE3E0` | The few rules and outlines the layout needs, and empty matrix cells. |
| Field | `#006A4E` | The accent: the green of the Bangladesh flag. Data only. |
| Field steps | `#D3E6DE` `#93C2AF` `#4A9479` `#006A4E` | Matrix cells for 1, 2–3, 4–7, and 8 or more incidents. |

The flag's red is deliberately not used. Red reads as alarm, and on a page of allegations it would editorialise.

Non-person network nodes use Quiet and Line, never a second hue. Colour is never the only signal: matrix cells carry their count in the accessible label, and network node types differ in shape as well as colour.

## Type

One family: **Anek Bangla** (Google Fonts, variable weight and width). It was drawn for Bangla with a matching Latin, so names, summaries, and any Bangla text share one voice. The fallback is `system-ui`.

The width axis does the work a second typeface would:

| Role | Size / line height | Weight | Width |
|---|---|---|---|
| Page title | 34 / 38 | 600 | 112% |
| Entity name in the panel | 28 / 32 | 600 | 106% |
| Section heading | 18 / 24 | 600 | 100% |
| Body and summaries | 16 / 24 | 400 | 100% |
| Small text: dates, counts, notes | 13 / 18 | 400 | 100% |
| Matrix row names and column headers | 14 / 18 | 500 | 88% |

- Numbers use `font-variant-numeric: tabular-nums` wherever they line up in a column.
- Sentence case everywhere. No all-caps text, no letter-spaced labels.
- Bangla prose on the About tab uses the same size and weight, with line height 28px so the lines can breathe.

## Layout

Left-aligned throughout. The header row spans the page: the title on the left, Contact on the right. Landing is the Categories page. On the right of that grid, the incident count sits immediately left of Kinds. Rows are sorted by the incident count, so a name that appears often ranks above a name that merely spans many kinds. The squares stay 20px and the grid scrolls sideways on a narrow window.

```
Bangladesh Football Archive
One sentence on what this is. The allegation note, in Quiet.
v2, generated 16 Nov 2026, 608 incidents from 3,397 posts.

Categories    Connections    Incidents    About   (text tabs, the current one underlined)

[ People | Teams | Organisations | Tournaments ]   At least [3] kinds

             On the pitch   Conduct   ...          Incidents   Kinds
Kazi Salahuddin   ■ ■ ■ ■ ...                 83        11
Mamunul Islam     ■ ■ □ ■ ...                 31        12
...
```

The entity panel opens on the right as a 30rem column and pushes the main view to the left. On narrow screens it covers the whole screen instead.

```
                                     | Kazi Salahuddin                 Close
                                     | Person
                                     | Named in 83 incidents across 11
                                     | kinds, 2014 to 2021.
                                     |
                                     | 2014 ||| |  ||||| || |||  2021   (ticks)
                                     |
                                     | Kinds        Federation politics 23
                                     |              Corruption, finance  9 ...
                                     | Named with   Abahani Limited Dhaka 14 ...
                                     |
                                     | Incidents (83)
                                     | 12–20 Sep 2021
                                     | Title of the incident
                                     | Summary, two or three lines.
                                     | Federation politics. Named: A, B, C.
                                     | Posts: 1, 2, 3
```

## Components

- **Tabs.** Plain text with the current tab underlined in Ink. No pills or backgrounds.
- **Filter buttons.** Text in a 1px Line outline. The selected button is Ink with Paper text. Square corners at 2px radius. All controls share the same height (32px).
- **Matrix cell.** A 20px square with a 2px gap and no border. Empty cells are a small Line dot, so the grid stays readable without rules. Category groups are separated by a 10px gap instead of group labels. Hover or focus outlines the cell in Ink and shows the count and category in a single status line under the controls, not a floating tooltip. The Other column is drawn at reduced opacity.
- **Incident.** No box, no card. Date in Quiet, title in body weight 600, summary, then one Quiet line with categories and names. Incidents are separated by space (24px), not lines.
- **Links.** Ink, underlined with a 1px underline offset by 3px. Facebook links read "Facebook posts: 1, 2, 3", each with an accessible label such as "Facebook post 2 of 3", and open in a new tab.
- **Network.** People are filled Field circles. Teams are filled Quiet circles. Organisations and tournaments are Quiet outlined circles. Circle size follows the number of kinds an entity spans. Links are faint Quiet lines, with thickness following shared incidents. Defaults: at least 3 shared incidents, with the federation and national team hidden. Only the 14 names spanning the most kinds are labelled until you zoom in. Hovering or selecting a name fades everything else and labels it plus its 10 strongest connections. Labels are drawn after all circles, with a Paper halo, so nothing covers them.

## Motion

- The entity panel slides in over 160ms. Nothing else moves on its own.
- The network layout settles once on load and then stops. Hover highlights neighbours instantly, without animation.
- `prefers-reduced-motion` removes the slide and makes the panel appear in place.

## Copy

- Say what something is in plain words: "kinds of incident", "named with", "shared incidents". Don't use internal terms like "entity", "node", "edge", or "span" in the interface.
- Counts are sentences or plain labels, not slogans: "Named in 30 incidents across 12 kinds", not "30 INCIDENTS".
- Remove classifier notes such as "Suggested new category: …" from summaries before display.
- Empty states say what to change: "No one spans 6 or more kinds with this filter. Lower the number to see more."
- The disclaimer is a note, not a banner. It sits under the introduction, separated by one Line rule, with no background and no accent colour.
- The About tab is in Bangla. It states the aim, the Facebook source, how incidents were gathered, and the syndicate question as a question for the reader. It does not conclude that a syndicate exists.
- One Contact link, in the header, uses the filter-button style. It opens a new issue on this repository. No email address is published on the page.

## Accessibility and quality floor

- Everything clickable is a real `button` or `a` and can be reached by keyboard. Focus shows a 2px Ink outline offset by 2px.
- Matrix cells have accessible labels such as "Kazi Salahuddin, federation politics, 23 incidents".
- Text contrast is at least 4.5:1. Quiet on Paper is about 5.6:1.
- Works from 360px wide. The matrix scrolls sideways, with names pinned on the left.
- Escape closes the panel. The URL hash records the view and the open entity, so a link opens exactly what you were looking at.

## Do not use

These are the habits that make a page look generated or noisy. None of them belong here:

- Cards, drop shadows, gradients, glassmorphism, or blurred backgrounds.
- Hero sections, big-number stat blocks, or a "key findings" banner.
- All-caps or letter-spaced eyebrow labels above headings.
- Metadata joined with middle dots, or labels like "WORD — fragment".
- Monospace for numbers or labels.
- Arrows appended to links or buttons.
- Emoji or decorative icons. Text labels instead.
- Hover animations, entrance animations, or anything that scrolls into view.
- More than one accent colour, or any colour used only for decoration.
- Highlighting a single word in a heading with colour, italic, or bold.
- Rounded corners larger than 2px.
- Cream backgrounds, dark mode with a neon accent, or broadsheet-style hairline columns.
