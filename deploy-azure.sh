#!/usr/bin/env bash
# =============================================================================
# A2S — Azure Container Apps Deployment (macOS / Linux)
# =============================================================================
# BEFORE RUNNING:
#   1. Install Azure CLI: brew install azure-cli
#   2. Run: az login
#   3. Fill in the CONFIGURATION below
#   4. Run: chmod +x deploy-azure.sh && ./deploy-azure.sh
# =============================================================================
set -euo pipefail

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
RESOURCE_GROUP="a2ws"
LOCATION="centralindia"
ACR_NAME="a2sacr"
ENV_NAME="a2s-env"
BACKEND_APP="a2s-backend"
FRONTEND_APP="a2s-frontend"
LLM_APP="a2s-llm"

# ─── Load secrets from .env ──────────────────────────────────────────────────
ENV_FILE="$(dirname "$0")/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi

load_env() {
    while IFS='=' read -r key value; do
        key=$(echo "$key" | xargs)
        [[ -z "$key" || "$key" == \#* ]] && continue
        value=$(echo "$value" | xargs | sed 's/^"//;s/"$//')
        export "$key=$value"
    done < "$ENV_FILE"
}
load_env

# ─── Derived values ──────────────────────────────────────────────────────────
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
BACKEND_IMAGE="${ACR_LOGIN_SERVER}/${BACKEND_APP}:latest"
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/${FRONTEND_APP}:latest"
LLM_IMAGE="${ACR_LOGIN_SERVER}/${LLM_APP}:latest"

DB_JDBC_URL="jdbc:sqlserver://${SERVER};databaseName=${DATABASE};encrypt=true;trustServerCertificate=false;loginTimeout=30"

echo "═══════════════════════════════════════════════════"
echo "  A2S Azure Deployment Starting"
echo "  Resource Group : $RESOURCE_GROUP"
echo "  Region         : $LOCATION"
echo "  ACR            : $ACR_LOGIN_SERVER"
echo "═══════════════════════════════════════════════════"

# ─── 1. Create ACR ────────────────────────────────────────────────────────────
echo ""
echo "[1/6] Creating Azure Container Registry: $ACR_NAME"
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true 2>/dev/null || echo "  (ACR already exists)"

ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD_VAL=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# ─── 2. Build & Push Images (using ACR Build — no local Docker needed) ───────
echo ""
echo "[2/6] Building Docker images in Azure (ACR Build Tasks)..."

echo "  → Building backend..."
az acr build --registry "$ACR_NAME" --image "${BACKEND_APP}:latest" ./backend

echo "  → Building LLM service..."
az acr build --registry "$ACR_NAME" --image "${LLM_APP}:latest" ./LLM

echo "  → Building frontend..."
az acr build --registry "$ACR_NAME" --image "${FRONTEND_APP}:latest" ./frontend

# ─── 3. Create Container Apps Environment ────────────────────────────────────
echo ""
echo "[3/6] Creating Container Apps Environment: $ENV_NAME"
az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" 2>/dev/null || echo "  (Environment already exists)"

# ─── 4. Deploy Backend ──────────────────────────────────────────────────────
echo ""
echo "[4/6] Deploying Backend: $BACKEND_APP"
az containerapp create \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$BACKEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD_VAL" \
    --target-port 8080 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 3 \
    --cpu 0.5 --memory 1.0Gi \
    --env-vars \
        "DB_URL=${DB_JDBC_URL}" \
        "DB_USER=${DB_USERNAME}" \
        "DB_PASSWORD=${DB_PASSWORD}" \
        "DB_DRIVER=com.microsoft.sqlserver.jdbc.SQLServerDriver" \
        "DB_DIALECT=org.hibernate.dialect.SQLServerDialect" \
        "H2_CONSOLE=false" \
        "JWT_SECRET=${JWT_SECRET}" \
        "GEMINI_API_KEY=${GEMINI_API_KEY}" \
        "GROQ_API_KEY=${GROQ_API_KEY}" \
        "CORS_ORIGINS=http://localhost:3000" \
        "LLM_SERVICE_URL=http://${LLM_APP}" 2>/dev/null \
|| az containerapp update \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$BACKEND_IMAGE"

BACKEND_FQDN=$(az containerapp show \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)
echo "  Backend internal URL: https://$BACKEND_FQDN"

# ─── 5. Deploy LLM Service ──────────────────────────────────────────────────
echo ""
echo "[5/6] Deploying LLM Service: $LLM_APP"
az containerapp create \
    --name "$LLM_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$LLM_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD_VAL" \
    --target-port 5001 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 2 \
    --cpu 0.5 --memory 1.0Gi \
    --env-vars \
        "GEMINI_API_KEY=${GEMINI_API_KEY}" \
        "GROQ_API_KEY=${GROQ_API_KEY}" \
        "SERVER=${SERVER}" \
        "DATABASE=${DATABASE}" \
        "DB_USERNAME=${DB_USERNAME}" \
        "DB_PASSWORD=${DB_PASSWORD}" \
        "PORT=5001" 2>/dev/null \
|| az containerapp update \
    --name "$LLM_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$LLM_IMAGE"

echo "  LLM service deployed (internal)"

# ─── 6. Deploy Frontend ─────────────────────────────────────────────────────
echo ""
echo "[6/6] Deploying Frontend: $FRONTEND_APP"

# Update nginx.conf to proxy to backend
cat > ./frontend/nginx.conf <<NGINX
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass https://${BACKEND_FQDN};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host ${BACKEND_FQDN};
        proxy_cache_bypass \$http_upgrade;
        proxy_ssl_server_name on;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
NGINX

echo "  nginx.conf updated with backend: $BACKEND_FQDN"

# Rebuild frontend with updated nginx
az acr build --registry "$ACR_NAME" --image "${FRONTEND_APP}:latest" ./frontend

az containerapp create \
    --name "$FRONTEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$FRONTEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD_VAL" \
    --target-port 80 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 3 \
    --cpu 0.25 --memory 0.5Gi 2>/dev/null \
|| az containerapp update \
    --name "$FRONTEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$FRONTEND_IMAGE"

# ─── Update CORS with frontend URL ──────────────────────────────────────────
FRONTEND_URL=$(az containerapp show \
    --name "$FRONTEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

az containerapp update \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars "CORS_ORIGINS=https://${FRONTEND_URL},http://localhost:3000"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════"
echo "  Website: https://$FRONTEND_URL"
echo "  Backend: https://$BACKEND_FQDN (internal)"
echo ""
echo "  Check all apps:"
echo "  az containerapp list -g $RESOURCE_GROUP -o table"
echo "═══════════════════════════════════════════════════"
