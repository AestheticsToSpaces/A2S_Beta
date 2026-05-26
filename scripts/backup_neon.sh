#!/usr/bin/env bash
# Nightly dump of the Neon catalog DB to Cloudflare R2.
#
# Required env (CI sets these from GitHub Secrets):
#   NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD
#   R2_ENDPOINT          (e.g. https://<account>.r2.cloudflarestorage.com)
#   R2_ACCESS_KEY_ID
#   R2_SECRET_ACCESS_KEY
#   R2_BUCKET            (e.g. a2s-backups)
#
# Retention is enforced bucket-side via R2 lifecycle policy (keep 30 days).
# This script does NOT prune; it only adds new dumps.

set -euo pipefail

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DUMP_FILE="/tmp/a2s-neon-${STAMP}.sql.gz"

echo "[1/2] pg_dump | gzip -> $DUMP_FILE"
PGPASSWORD="$NEON_PASSWORD" pg_dump \
    --host="$NEON_HOST" \
    --username="$NEON_USER" \
    --dbname="$NEON_DB" \
    --no-owner --no-privileges \
    --format=plain \
    | gzip -9 > "$DUMP_FILE"

SIZE=$(stat -c%s "$DUMP_FILE" 2>/dev/null || stat -f%z "$DUMP_FILE")
echo "    Dump size (gz): $SIZE bytes"

if [ "$SIZE" -lt 1024 ]; then
    echo "ERROR: dump suspiciously small (<1KB), refusing to upload" >&2
    exit 1
fi

echo "[2/2] Uploading to R2 bucket $R2_BUCKET"
# Uses AWS CLI v2 in S3-compatible mode against the R2 endpoint.
aws s3 cp "$DUMP_FILE" "s3://$R2_BUCKET/daily/$(basename "$DUMP_FILE")" \
    --endpoint-url "$R2_ENDPOINT" \
    --no-progress

echo "Backup uploaded: s3://$R2_BUCKET/daily/$(basename "$DUMP_FILE")"

# Local cleanup
rm -f "$DUMP_FILE"
