# eightyhundred.ai - make 80%/100%.ai real

Status: spec v3, 5 Sep 2026 (post security audit + architect review). Decisions ratified by Maz: domain eightyhundred.ai; auth Google + GitHub (magic link deferred with Apple: Supabase's built-in mailer only delivers to the project's own team and caps at 2 emails an hour, so it needs custom SMTP first); Supabase Free + daily keep-alive; friends can claim and finish each other's projects.

## What it is

A daycare for projects. Punters sign in, drop off a project that is stuck at 80%. Anyone can act as a Lad: claim a project, finish it, post proof. Two public leaderboards: The Bastards (drop-offs, days at 80%, reclaims, nopes) and The Lads (finishes).

## Architecture (two providers)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Static `index.html` + `app.js` + `config.js` | supabase-js 2.115.0 self-hosted in `vendor/` (no CDN origin); PKCE flow; hash routing; no build step |
| Backend | Supabase Free project (personal Google account) | Postgres + Auth + PostgREST + RLS. Region eu-west-1 (Ireland) |
| Auth | Google, GitHub | OAuth secrets live only in Supabase dashboard + 1Password. Email magic link behind `emailLogin` flag, off until custom SMTP exists |
| Hosting | GitHub Pages, repo MazZaZam/80-100-ai (public), branch main root | CNAME eightyhundred.ai, HTTPS enforced |
| Keep-alive | GitHub Actions daily cron: PostgREST query on `stats`, export of the four public tables to `backup/`, heartbeat commit if main is 30 days stale | Free projects pause on low weekly DB activity; GitHub disables schedules after 60 days without commits |

## Data model

- `profiles` (id = auth.users.id, handle, display_name, avatar_url). Created by trigger on signup. Users update only their own row.
- `projects` (owner_id, name, type enum, pct 0-80 enforced by CHECK, distraction, since_date, status enum daycare/claimed/finished/reclaimed, lad_id, claimed_at, finished_at, proof_url, note). Lad can never be the owner (CHECK). Status/columns consistency enforced by CHECK.
- `nopes` (project_id, voter_id) - "that is not 80%". One per voter per project, cannot nope your own.
- Views: `leaderboard_bastards`, `leaderboard_lads`, `stats` (security_invoker, public read).

## Write paths

- Insert project: RLS - authenticated, owner_id = auth.uid(), status = daycare. Trigger overwrites id and created_at server-side, takes a per-owner advisory lock, caps 10 drop-offs per user per day.
- Delete project: owner only, status daycare (remove test entries).
- No direct UPDATE on projects from clients. All transitions via SECURITY DEFINER RPCs with explicit checks and `set search_path = public`:
  - `claim_project(id)` daycare -> claimed. Caller != owner. Max 3 open claims per lad.
  - `finish_project(id, proof_url, note)` claimed -> finished. Caller = lad.
  - `release_project(id)` claimed -> daycare. Caller = lad. Counts against lad score.
  - `reclaim_project(id)` daycare|claimed -> reclaimed. Caller = owner. Counts against bastard score.
  - `unclaim_stale(id)` claimed (14+ days) -> daycare. Caller = owner, no shame; logged as a stale release against the lad.
- Nopes: insert own, delete own, not on own project (RLS + CHECK via trigger).

## Keys and secrets

| Item | Where | Exposure |
|---|---|---|
| Supabase publishable key + project URL | `config.js` and the keep-alive workflow, both in the public repo | Public by design; RLS is the boundary |
| Supabase secret key | Not created. Legacy JWT keys disabled if the dashboard offers the toggle | Nothing to protect, nothing to rotate |
| Supabase personal access token (management API) | 1Password "Agents & VMs"; read inline with `op item get ... --reveal`, never echoed or cached; revoked after setup | Full control of the backend while it exists |
| Google OAuth client id + secret | Google Cloud Console -> Supabase dashboard; secret in 1Password | Secret never in repo |
| GitHub OAuth app client id + secret | GitHub settings -> Supabase dashboard; secret in 1Password | Secret never in repo |

## Frontend security

- `<meta http-equiv="Content-Security-Policy">`: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src https://<ref>.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://avatars.githubusercontent.com https://*.googleusercontent.com; object-src 'none'; base-uri 'none'; form-action 'self'. Referrer policy no-referrer. (frame-ancestors is ignored in meta CSP and GitHub Pages sets no headers.)
- All user text rendered via textContent, never innerHTML.
- proof_url must match ^https?:// (DB CHECK) and is rendered as rel="noopener noreferrer nofollow".
- Auth: Site URL `https://eightyhundred.ai`. Redirect allowlist exact: `https://eightyhundred.ai/`, `https://mazzazam.github.io/80-100-ai/`, plus `http://127.0.0.1:8080/` during development only (remove after). Client uses PKCE (`?code=`), so auth redirects never collide with hash routes.

## Blast radius

Personal project, no estate infra touched (no VPS, no Mem0, no hooks). Worst case: abuse of the public insert path (rate-limited per user, auth required) or a bad RLS policy exposing writes. Rollback: revert the repo commit; Supabase project can be paused or deleted.

## Maz-only steps

1. Buy eightyhundred.ai. Verify the domain under GitHub account settings (Pages -> Add a domain) first, then A records to GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153), AAAA to 2606:50c0:8000::153 through 8003::153, CNAME www -> mazzazam.github.io.
2. Create the Supabase project (personal Google account, Free, eu-west-1). Generate a personal access token; save to 1Password "Agents & VMs" as "eightyhundred supabase pat".
3. Google Cloud: consent screen External, publishing status In production, scopes exactly openid + userinfo.email + userinfo.profile. OAuth client (web), authorised redirect https://<ref>.supabase.co/auth/v1/callback. Save secret to 1Password.
4. GitHub: Settings -> Developer settings -> OAuth Apps -> new app, callback https://<ref>.supabase.co/auth/v1/callback. Save secret to 1Password.
5. Repo settings -> Pages -> source main / root; custom domain eightyhundred.ai; enforce HTTPS.

Everything else (SQL, auth config, keep-alive, frontend, deploy) Claude does with the PAT from 1Password.

## Rollback

Pause the Supabase project (instant, reversible) -> remove the custom domain in Pages settings -> remove DNS records -> revert or delete the workflow -> revoke the Google and GitHub OAuth apps -> delete the PAT. Free plan has no downloadable database backups; the daily `backup/*.json` export in the repo is the restore source.

## Launch smoke test (before anything is saved as done)

Sign up via Google and via GitHub on the same email (one profile); drop off; claim from a second account; finish with proof; release; reclaim; nope; both leaderboards and `stats` readable with the publishable key and no session; every RPC rejected without a session; `workflow_dispatch` run of keep-alive green; Security Advisor and Performance Advisor clean.
