# Bangladesh Football Archive

An archive of controversies in Bangladesh football (September 2014 – December 2021), built from the public fan group *Bangladesh Football – Walking Around The Dreams*. Every incident stays linked to the Facebook posts behind it. Claims in the archive are fan allegations, recorded with their sources, not established facts.

Read [`docs/project-context.md`](docs/project-context.md) first. It covers the purpose, method, taxonomy, current status, and what is on hold.

## Layout

```
data/
  export/archive_export-v2.json  v2 data product (looser re-clustering, 608 incidents): classified posts, incidents, knowledge graph
  export/archive_export.json     v1 baseline (273 incidents), same format
  raw/sweep-posts/               Raw Facebook API pages by year/month (not in git; backed up to Google Drive)
docs/
  project-context.md             Project brief and handoff document
  visualization-plan.md          Plan for the knowledge graph web view
scripts/                         (planned) Data build and validation scripts
web/                             (planned) Static visualization site
```

The data files carry no visual formatting. Anything under `web/` is a view derived from `data/export/`, rebuilt by a script, and never edited by hand.
