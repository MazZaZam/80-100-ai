# eightyhundred.ai - Maz runbook (steps only you can do)

Version 1, 5 Sep 2026. Claude does everything not listed here. Order matters: 2 before 3 and 4 (they need the Supabase callback URL).

## 0. Unlock 1Password on the laptop
- Open the 1Password app and unlock it, then in this Claude session type: `! op signin` (or just unlock the app if CLI integration is on).
- Needed for: Linear issue creation, saving secrets, Claude reading the Supabase token.

## 1. Buy the domain
- Register `eightyhundred.ai` at any registrar (Cloudflare Registrar, Namecheap, Porkbun all fine). .ai is typically a 2-year minimum.
- Before pointing DNS: https://github.com/settings/pages -> Add a domain -> `eightyhundred.ai`, add the TXT record it gives you, verify. This stops anyone else claiming the domain on Pages.
- DNS records (set once bought):

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | mazzazam.github.io |

- If the registrar is Cloudflare: set the records to DNS only (grey cloud), not proxied, or GitHub cannot issue the certificate.

## 2. Create the Supabase project
- https://supabase.com -> sign in with your personal Google account -> New organisation "Maz personal" (Free) if none. The Free plan allows two active projects per owner; check a slot is free. New project:
  - Name: eightyhundred
  - Region: West EU (Ireland)
  - Database password: let Supabase generate it. Save it in 1Password, vault "Agents & VMs", item "eightyhundred supabase db password". You will not need it day to day.
- Note the Project URL (`https://<ref>.supabase.co`). The callback URL for step 3 and 4 is `https://<ref>.supabase.co/auth/v1/callback`.
- Personal access token for Claude: avatar (top right) -> Account -> Access Tokens -> Generate new token, name "claude eightyhundred". Save in 1Password "Agents & VMs" as item "eightyhundred supabase pat", field `token`. Claude reads it with `op read` at runtime; it never touches disk.

## 3. Google sign-in
- https://console.cloud.google.com -> New project "eightyhundred" -> APIs and Services -> OAuth consent screen:
  - External, app name "80%/100%", support email your Gmail. Scopes exactly: openid, userinfo.email, userinfo.profile (add openid by hand). Nothing else.
  - Publishing status: In production (no verification needed for those three scopes). Left in Testing, only listed test users can sign in and their consent expires after 7 days.
- Credentials -> Create credentials -> OAuth client ID -> Web application:
  - Authorised JavaScript origins: `https://eightyhundred.ai`, `https://<ref>.supabase.co`
  - Authorised redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
- Save Client ID and Client secret in 1Password "Agents & VMs" as "eightyhundred google oauth". Paste both into Supabase -> Authentication -> Providers -> Google (Claude can do this part via the API once the PAT exists).

## 4. GitHub sign-in
- https://github.com/settings/developers -> OAuth Apps -> New OAuth App:
  - Name: 80%/100%.ai
  - Homepage: `https://eightyhundred.ai`
  - Callback: `https://<ref>.supabase.co/auth/v1/callback`
- Generate a client secret. Save Client ID + secret in 1Password "Agents & VMs" as "eightyhundred github oauth".

## 5. GitHub Pages (after Claude pushes the repo)
- https://github.com/MazZaZam/80-100-ai/settings/pages -> Source: Deploy from branch, main, / (root) -> Custom domain `eightyhundred.ai` -> tick Enforce HTTPS once the certificate shows.

## 6. Account hygiene (security audit conditions)
- Turn on 2FA on the MazZaZam GitHub account and MFA on the Google account that owns the Supabase org. Both are effectively admin of the backend.
- After Claude finishes setup, revoke the Supabase access token at https://supabase.com/dashboard/account/tokens. Mint a fresh one for future changes.
- Email magic link is OFF for launch: Supabase's built-in mailer only delivers to the project's own team members and caps at 2 emails an hour. Turning it on later means custom SMTP (Resend free tier: API key to 1Password, SPF + DKIM records on the domain), then set `emailLogin: true` in config.js.

## Not doing (decided 5 Sep 2026)
- Sign in with Apple: needs a paid Apple Developer account and a secret rotated every 6 months. Revisit if the group wants it.
- Email magic link: see section 6. Deferred until custom SMTP exists.
- Supabase Pro: Free plus a keep-alive is enough for now.
