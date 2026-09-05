# 80%/100%.ai

A daycare for projects. You get it 80% of the way. Lads who hate tinkering finish it. We take a cut of the whole thing.

Live: https://eightyhundred.ai

## How it is built

- `index.html`, `app.js`, `config.js` - static site, no build step. Hosted on GitHub Pages from `main`.
- `supabase/schema.sql` - Postgres schema, row-level security, and the RPCs that move projects between daycare, claimed, finished and reclaimed.
- `.github/workflows/keepalive.yml` - weekly ping so the Free-plan Supabase project never pauses.
- `PLAN.md` - design and decisions. `RUNBOOK.md` - the manual steps (domain, Supabase project, OAuth apps).

## Local preview

```
python3 -m http.server 8080
open http://127.0.0.1:8080/
```

With `config.js` empty the site runs in landing-only mode: the drop-off form prints an example receipt and Daycare shows an empty state.

## Keys

`config.js` holds the Supabase project URL and publishable key. Both are public by design; row-level security is the boundary. Nothing else in this repo is secret and nothing secret is ever added to it.
