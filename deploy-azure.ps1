# =============================================================================
# A2S — Azure Container Apps Deployment Script
# =============================================================================
# BEFORE RUNNING:
#   1. Run: az login
#   2. Fill in the CONFIGURATION block below
#   3. Run: .\deploy-azure.ps1  (from the A2S_17mar project root)
# =============================================================================

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
$RESOURCE_GROUP    = "a2ws"                     # Your existing resource group
$LOCATION          = "centralindia"             # Change to your region (e.g. eastus)
$SUBSCRIPTION_ID   = ""                         # Optional: paste your subscription ID here
$ACR_NAME          = "a2sacr"                   # Must be globally unique & lowercase
$ENV_NAME          = "a2s-env"                  # Container Apps Environment name
$BACKEND_APP       = "a2s-backend"
$FRONTEND_APP      = "a2s-frontend"
$LLM_APP           = "a2s-llm"

# ─── Load secrets from .env ───────────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env file not found at $envFile"
    exit 1
}
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match "^\s*[^#].*=.*" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $key   = $parts[0].Trim()
    $val   = $parts[1].Trim().Trim('"')
    $envVars[$key] = $val
}

# ─── Derived values ───────────────────────────────────────────────────────────
$ACR_LOGIN_SERVER  = "$ACR_NAME.azurecr.io"
$BACKEND_IMAGE     = "$ACR_LOGIN_SERVER/$BACKEND_APP`:latest"
$FRONTEND_IMAGE    = "$ACR_LOGIN_SERVER/$FRONTEND_APP`:latest"
$LLM_IMAGE         = "$ACR_LOGIN_SERVER/$LLM_APP`:latest"

# Azure SQL JDBC connection string for Spring Boot
$DB_URL     = "jdbc:sqlserver://`$($envVars['SERVER']);databaseName=`$($envVars['DATABASE']);encrypt=true;trustServerCertificate=false;loginTimeout=30"
$DB_URL     = "jdbc:sqlserver://$($envVars['SERVER']);databaseName=$($envVars['DATABASE']);encrypt=true;trustServerCertificate=false;loginTimeout=30"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  A2S Azure Deployment Starting" -ForegroundColor Cyan
Write-Host "  Resource Group : $RESOURCE_GROUP" -ForegroundColor Cyan
Write-Host "  Region         : $LOCATION" -ForegroundColor Cyan
Write-Host "  ACR            : $ACR_LOGIN_SERVER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

# ─── 0. Set subscription (if provided) ───────────────────────────────────────
if ($SUBSCRIPTION_ID -ne "") {
    Write-Host "`n[0/6] Setting subscription..." -ForegroundColor Yellow
    az account set --subscription $SUBSCRIPTION_ID
}

# ─── 1. Create Azure Container Registry ──────────────────────────────────────
Write-Host "`n[1/6] Creating Azure Container Registry: $ACR_NAME" -ForegroundColor Yellow
az acr create `
    --resource-group $RESOURCE_GROUP `
    --name $ACR_NAME `
    --sku Basic `
    --admin-enabled true

# Get ACR credentials
Write-Host "      Getting ACR credentials..." -ForegroundColor Gray
$ACR_USERNAME = $(az acr credential show --name $ACR_NAME --query "username" -o tsv)
$ACR_PASSWORD = $(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# ─── 2. Build & Push Docker Images ───────────────────────────────────────────
Write-Host "`n[2/6] Building & pushing Docker images to ACR..." -ForegroundColor Yellow

# Login to ACR (Needed for local push)
az acr login --name $ACR_NAME

# Backend
Write-Host "  → Building backend image..." -ForegroundColor Gray
$backendPath = Join-Path $PSScriptRoot "backend"
docker build -t $BACKEND_IMAGE $backendPath
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }
docker push $BACKEND_IMAGE

# LLM Service
Write-Host "  → Building LLM service image..." -ForegroundColor Gray
$llmPath = Join-Path $PSScriptRoot "LLM"
docker build -t $LLM_IMAGE $llmPath
if ($LASTEXITCODE -ne 0) { Write-Error "LLM build failed"; exit 1 }
docker push $LLM_IMAGE

# Frontend
Write-Host "  → Building frontend image (nginx)..." -ForegroundColor Gray
$frontendPath = Join-Path $PSScriptRoot "frontend"
docker build -t $FRONTEND_IMAGE $frontendPath
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }
docker push $FRONTEND_IMAGE

# ─── 3. Create Container Apps Environment ────────────────────────────────────
Write-Host "`n[3/6] Creating Container Apps Environment: $ENV_NAME" -ForegroundColor Yellow
az containerapp env create `
    --name $ENV_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION

# ─── 4. Deploy Backend ────────────────────────────────────────────────────────
Write-Host "`n[4/6] Deploying Backend Container App: $BACKEND_APP" -ForegroundColor Yellow
az containerapp create `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --environment $ENV_NAME `
    --image $BACKEND_IMAGE `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --target-port 8080 `
    --ingress internal `
    --min-replicas 1 `
    --max-replicas 3 `
    --cpu 0.5 --memory 1.0Gi `
    --env-vars `
        "DB_URL=$DB_URL" `
        "DB_USER=$($envVars['DB_USERNAME'])" `
        "DB_PASSWORD=$($envVars['DB_PASSWORD'])" `
        "DB_DRIVER=com.microsoft.sqlserver.jdbc.SQLServerDriver" `
        "DB_DIALECT=org.hibernate.dialect.SQLServerDialect" `
        "H2_CONSOLE=false" `
        "JWT_SECRET=$($envVars['JWT_SECRET'])" `
        "SUPABASE_URL=$($envVars['SUPABASE_URL'])" `
        "SUPABASE_ANON_KEY=$($envVars['SUPABASE_ANON_KEY'])" `
        "CORS_ORIGINS=https://$FRONTEND_APP.wonderfuldesert-13f722e8.centralindia.azurecontainerapps.io,http://localhost:3000" `
        "LLM_SERVICE_URL=http://$LLM_APP"

# Get backend internal FQDN
$BACKEND_FQDN = $(az containerapp show `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv)

Write-Host "  ✓ Backend internal URL: https://$BACKEND_FQDN" -ForegroundColor Green

# ─── 5. Deploy LLM Service ───────────────────────────────────────────────────
Write-Host "`n[5/6] Deploying LLM Service Container App: $LLM_APP" -ForegroundColor Yellow
az containerapp create `
    --name $LLM_APP `
    --resource-group $RESOURCE_GROUP `
    --environment $ENV_NAME `
    --image $LLM_IMAGE `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --target-port 5001 `
    --ingress internal `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 --memory 1.0Gi `
    --env-vars `
        "GEMINI_API_KEY=$($envVars['GEMINI_API_KEY'])" `
        "GROQ_API_KEY=$($envVars['GROQ_API_KEY'])" `
        "SERVER=$($envVars['SERVER'])" `
        "DATABASE=$($envVars['DATABASE'])" `
        "DB_USERNAME=$($envVars['DB_USERNAME'])" `
        "DB_PASSWORD=$($envVars['DB_PASSWORD'])" `
        "PORT=5001"

Write-Host "  ✓ LLM service deployed (internal only)" -ForegroundColor Green

# ─── 6. Deploy Frontend ──────────────────────────────────────────────────────
Write-Host "`n[6/6] Deploying Frontend Container App: $FRONTEND_APP" -ForegroundColor Yellow

# Update nginx.conf to proxy /api to the backend internal FQDN, then rebuild
$nginxContent = @"
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files `$uri `$uri/ /index.html;
    }

    # Proxy API calls to Azure backend Container App (internal)
    location /api {
        proxy_pass https://$BACKEND_FQDN;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $BACKEND_FQDN;
        proxy_cache_bypass `$http_upgrade;
        proxy_ssl_server_name on;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
"@

$nginxPath = Join-Path $PSScriptRoot "frontend\nginx.conf"
$nginxContent | Set-Content -Path $nginxPath -Encoding UTF8
Write-Host "  ✓ nginx.conf updated with backend URL: $BACKEND_FQDN" -ForegroundColor Green

# Rebuild & push frontend with updated nginx
docker build -t $FRONTEND_IMAGE $frontendPath
docker push $FRONTEND_IMAGE

az containerapp create `
    --name $FRONTEND_APP `
    --resource-group $RESOURCE_GROUP `
    --environment $ENV_NAME `
    --image $FRONTEND_IMAGE `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --target-port 80 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 3 `
    --cpu 0.25 --memory 0.5Gi

# ─── Done ─────────────────────────────────────────────────────────────────────
$FRONTEND_URL = $(az containerapp show `
    --name $FRONTEND_APP `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🌐 Your website: https://$FRONTEND_URL" -ForegroundColor Green
Write-Host "  🔧 Backend (internal): https://$BACKEND_FQDN" -ForegroundColor Green
Write-Host ""
Write-Host "  Run this to check all apps:" -ForegroundColor Cyan
Write-Host "  az containerapp list -g $RESOURCE_GROUP -o table" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
