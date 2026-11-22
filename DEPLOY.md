# Deploying Signature Works BD

Hosting: **Cloudflare Workers** (via [OpenNext](https://opennext.js.org/cloudflare)) · Database & media: **Supabase** · Both on free plans.

## 1. Supabase (once)

Run in Supabase Dashboard → SQL Editor:

- Existing project: `supabase/migrations/20261122_security_lockdown.sql`
- New project: `supabase/schema.sql`

Then confirm under Advisors → Security that no table is flagged.

## 2. Cloudflare resources (once)

```bash
npx wrangler login
npx wrangler kv namespace create NEXT_INC_CACHE_KV      # paste id into wrangler.jsonc
npx wrangler kv namespace create NEXT_TAG_CACHE_KV      # paste id into wrangler.jsonc
```

## 3. Secrets

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_SECRET          # random, >= 32 chars
npx wrangler secret put ADMIN_PASSWORD        # first-admin bootstrap only
npx wrangler secret put EMAILJS_PRIVATE_KEY
npx wrangler secret put EMAILJS_RESET_TEMPLATE_ID
```

`NEXT_PUBLIC_*` values are inlined at **build** time: put them in `.env.production.local` for CLI deploys,
or in Workers Builds → Build variables when deploying from GitHub.

## 4. Deploy

```bash
npm ci
npm run deploy
```

Or connect the GitHub repo in Cloudflare → Workers & Pages → Create → Import repository
(build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`).

## 5. Domain

Workers → `signatureworksbd` → Settings → Domains & Routes → add `signatureworks.com.bd` and
`www.signatureworks.com.bd`. Remove the old Vercel DNS records first.

## Architecture notes

- Public pages are cached (ISR, 1 hour) and purged instantly when an admin saves portfolio, blog or settings.
- The browser's anon key can only submit forms and read public content (enforced by RLS).
- All admin reads/writes go through `/api/admin/db` and `/api/admin/storage`, which check the session
  and section permissions and use the service_role key server-side.
- Media uploads use one-time signed URLs and go straight to Supabase Storage.
- Login, forgot-password and reset are rate limited (table `admin_auth_attempts`).
