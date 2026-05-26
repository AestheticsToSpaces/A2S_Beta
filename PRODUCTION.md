# A2S Production Runbook — Free-Tier Setup

Target lifetime: **6+ months without recurring cost or operator attention.**

This document is the operator's reference for the post-Azure, free-tier
deployment of A2S. The original Azure runbook is `AZURE_PRODUCTION.md`; that
deployment is the rollback path and stays warm for 7 days after cutover.

## Architecture

| Layer       | Provider             | Free tier limit                     | Notes                                            |
|-------------|----------------------|--------------------------------------|--------------------------------------------------|
| Frontend    | Cloudflare Pages     | Unlimited bandwidth, custom domain   | Static build, no card required                   |
| Backend     | Fly.io               | 3× shared-cpu-1x 256 MB always-on    | `backend/fly.toml`, sleeps when idle             |
| LLM service | Fly.io               | (same pool as backend)               | `LLM/fly.toml`, sleeps when idle                 |
| Database    | Neon Postgres        | 0.5 GB storage, autopause            | Autopauses after 5 min idle, wakes on connection |
| Backups     | Cloudflare R2        | 10 GB storage, 10 M Class A ops/mo   | Nightly pg_dump via GitHub Actions               |
| Secrets     | GitHub Secrets + Fly | n/a                                  | Per-app Fly secrets, mirrored from GH for CI     |
| Uptime      | UptimeRobot          | 50 monitors                          | Probes `/api/health` and the Pages URL           |
| Logs        | BetterStack          | 3-day retention free                 | Receives `flyctl logs` drain                     |
| CI/CD       | GitHub Actions       | 2000 min/mo (private), unlimited pub | `deploy-fly.yml`, `deploy-pages.yml`             |

## One-time setup

The scripts and workflows in this PR are the durable parts. The one-time
account setup steps that must be done by hand:

1. **Neon** — create project `a2s` in region `aws-ap-south-1` (Mumbai). Note
   the database host, name, role, and password.
2. **Fly.io** — `flyctl auth signup`. Create the two apps:
   ```bash
   flyctl apps create a2s-backend --org personal
   flyctl apps create a2s-llm     --org personal
   ```
3. **Cloudflare** — create a Pages project named `a2s`. Disable the built-in
   GH integration (we deploy via Actions instead so failures show up in one
   place).
4. **Cloudflare R2** — create a bucket `a2s-backups`. Generate an API token
   with R/W on that bucket. Add a lifecycle rule: delete objects under
   `daily/` after 30 days.
5. **GitHub Secrets** — add these at the repo level:
   ```
   FLY_API_TOKEN
   CLOUDFLARE_API_TOKEN
   CLOUDFLARE_ACCOUNT_ID
   DB_URL DB_USER DB_PASSWORD JWT_SECRET
   GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
   GEMINI_API_KEY GROQ_API_KEY NVIDIA_NIM_API_KEY
   NEON_HOST NEON_DB NEON_USER NEON_PASSWORD
   NEON_API_KEY NEON_PROJECT_ID
   R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY
   ```
6. **UptimeRobot** — add 2 HTTP monitors:
   - `https://a2s.pages.dev/` (5 min interval)
   - `https://a2s-backend.fly.dev/api/health` (5 min interval)

## Cutover from Azure to free tier

Run once, in order:

```bash
# 1. Migrate DB (script verifies row counts on the way out)
export AZURE_PG_HOST=... AZURE_PG_DB=... AZURE_PG_USER=... AZURE_PG_PASSWORD=...
export NEON_HOST=...     NEON_DB=...     NEON_USER=...     NEON_PASSWORD=...
./scripts/migrate_to_neon.sh

# 2. Push secrets to Fly
echo "DB_URL=jdbc:postgresql://$NEON_HOST/$NEON_DB?sslmode=require" >> .env.prod
# (fill the rest of .env.prod with the GitHub Secrets values)
./scripts/fly_secrets_sync.sh a2s-backend .env.prod
./scripts/fly_secrets_sync.sh a2s-llm     .env.prod

# 3. First deploy (subsequent deploys auto-trigger via GH Actions on push)
flyctl deploy --remote-only --config backend/fly.toml ./backend
flyctl deploy --remote-only --config LLM/fly.toml     ./LLM

# 4. Index hot-paths (B1)
psql "postgresql://$NEON_USER:$NEON_PASSWORD@$NEON_HOST/$NEON_DB?sslmode=require" \
    -f backend/src/main/resources/db/migration/V2__product_indexes.sql

# 5. Push a frontend commit (or click "Run workflow" on deploy-pages.yml)
# Once Pages is green, point DNS at it.
```

Then **leave Azure running for 7 days** as warm rollback. After that:
```bash
az group delete -n a2ws --yes
```

## Day-to-day operations

| Question | Where to look |
|----------|---------------|
| Is prod healthy? | UptimeRobot status page |
| Are backups working? | GH Actions tab → "Nightly Neon backup" runs |
| Did the last deploy succeed? | GH Actions tab → "Deploy to Fly.io" |
| Why is request X slow? | BetterStack logs, filter by `req_id` |
| Did the catalog drift stale? | `python LLM/scripts/incremental_refresh.py --catalog-path LLM/data/catalog.json --dry-run` |
| What's in the DB? | `psql $DB_URL` (autoaped Neon wakes on connection) |

## Cost ceiling — when do we exit the free tier?

| Trigger                                 | Action                                       |
|-----------------------------------------|----------------------------------------------|
| DB > 0.4 GB (80% of 0.5 GB)             | Prune old `vastu_scan_log` rows, or upgrade  |
| Fly compute > 3 always-on VMs           | Merge LLM and backend into one VM            |
| GH Actions > 1800 min/mo                | Switch repo to public (unlimited free)       |
| R2 storage > 8 GB                       | Tighten retention from 30 to 14 days         |

Each trigger has 20% headroom before a hard limit. Monitor monthly.

## Rollback

For 7 days post-cutover, Azure is still running. To rollback:

1. Repoint DNS / Pages domain back to the Azure frontend FQDN.
2. Re-enable the old workflow: `git revert <cutover-commit>`.
3. The Neon DB still has the post-cutover writes — replay them into Azure
   with `pg_dump --data-only` if needed.

After day 7, rollback means a fresh redeploy to Azure from this same repo
using `deploy-azure.sh` (preserved for that reason).
