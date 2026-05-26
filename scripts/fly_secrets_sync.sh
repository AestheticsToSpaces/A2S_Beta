#!/usr/bin/env bash
# Sync the secret set for a Fly.io app from a local .env.prod file.
# Reads only known A2S keys so a stray local var can't accidentally leak to prod.
#
# Usage:
#   ./scripts/fly_secrets_sync.sh a2s-backend  .env.prod
#   ./scripts/fly_secrets_sync.sh a2s-llm      .env.prod
#
# .env.prod is gitignored. Treat it like a password file.

set -euo pipefail

APP="${1:?usage: $0 <fly-app-name> <env-file>}"
ENV_FILE="${2:?usage: $0 <fly-app-name> <env-file>}"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found" >&2
    exit 1
fi

# Keys allowed per app. Add new keys here only after they're documented in
# .env.example.
case "$APP" in
    a2s-backend)
        KEYS=(DB_URL DB_USER DB_PASSWORD JWT_SECRET JWT_EXPIRATION
              CORS_ORIGINS OAUTH2_REDIRECT_URI
              GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
              LLM_SERVICE_URL GEMINI_API_KEY GROQ_API_KEY) ;;
    a2s-llm)
        KEYS=(GEMINI_API_KEY GROQ_API_KEY NVIDIA_NIM_API_KEY
              NVIDIA_NIM_URL NVIDIA_NIM_MODEL
              VASTU_AUTO_MIN_CONFIDENCE VASTU_AUTO_TARGET_ACCURACY) ;;
    *)
        echo "ERROR: unknown app '$APP'" >&2; exit 1 ;;
esac

declare -a PAIRS=()
for key in "${KEYS[@]}"; do
    val=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//')
    if [ -n "$val" ]; then
        PAIRS+=("${key}=${val}")
    fi
done

if [ "${#PAIRS[@]}" -eq 0 ]; then
    echo "ERROR: no matching keys found in $ENV_FILE for app $APP" >&2
    exit 1
fi

echo "Setting ${#PAIRS[@]} secrets on $APP..."
fly secrets set --app "$APP" "${PAIRS[@]}"
