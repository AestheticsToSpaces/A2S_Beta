#!/usr/bin/env bash
# One-shot migration of the A2S catalog database from Azure Postgres to Neon.
#
# Prereqs:
#   - `pg_dump` and `psql` on PATH (PostgreSQL 15+ client).
#   - Source env vars set (current Azure DB):  AZURE_PG_HOST, AZURE_PG_DB, AZURE_PG_USER, AZURE_PG_PASSWORD
#   - Target env vars set (Neon):              NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD
#
# Usage:
#   chmod +x scripts/migrate_to_neon.sh
#   ./scripts/migrate_to_neon.sh
#
# After it finishes, the script prints row counts for the main tables on both
# sides so you can confirm the dump landed cleanly before flipping DB_URL.

set -euo pipefail

require() { [ -n "${!1:-}" ] || { echo "ERROR: $1 not set" >&2; exit 1; }; }
for var in AZURE_PG_HOST AZURE_PG_DB AZURE_PG_USER AZURE_PG_PASSWORD \
           NEON_HOST NEON_DB NEON_USER NEON_PASSWORD; do
    require "$var"
done

DUMP_FILE="/tmp/a2s_neon_migration_$(date +%Y%m%d_%H%M%S).sql"

echo "[1/3] Dumping Azure Postgres -> $DUMP_FILE"
PGPASSWORD="$AZURE_PG_PASSWORD" pg_dump \
    --host="$AZURE_PG_HOST" \
    --username="$AZURE_PG_USER" \
    --dbname="$AZURE_PG_DB" \
    --no-owner --no-privileges \
    --format=plain \
    --file="$DUMP_FILE"

DUMP_BYTES=$(wc -c < "$DUMP_FILE")
echo "    Dump size: $DUMP_BYTES bytes"

echo "[2/3] Restoring into Neon"
PGPASSWORD="$NEON_PASSWORD" psql \
    --host="$NEON_HOST" \
    --username="$NEON_USER" \
    --dbname="$NEON_DB" \
    --set=sslmode=require \
    --quiet \
    --file="$DUMP_FILE"

echo "[3/3] Row-count verification"
count_table() {
    local host="$1" user="$2" pass="$3" db="$4" table="$5"
    PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -At \
        -c "SELECT count(*) FROM $table;" 2>/dev/null || echo "n/a"
}

for tbl in users designs product_list_item vastu_scan_log; do
    src=$(count_table "$AZURE_PG_HOST" "$AZURE_PG_USER" "$AZURE_PG_PASSWORD" "$AZURE_PG_DB" "$tbl")
    dst=$(count_table "$NEON_HOST"     "$NEON_USER"     "$NEON_PASSWORD"     "$NEON_DB"     "$tbl")
    if [ "$src" = "$dst" ]; then
        echo "    OK   $tbl: $src rows"
    else
        echo "    DIFF $tbl: azure=$src neon=$dst" >&2
    fi
done

echo ""
echo "Done. Next step: update DB_URL secret to the Neon JDBC URL:"
echo "  jdbc:postgresql://$NEON_HOST/$NEON_DB?sslmode=require"
