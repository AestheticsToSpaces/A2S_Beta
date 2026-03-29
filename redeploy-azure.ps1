# =============================================================================
# A2S — Quick Redeploy Script (run after initial deploy-azure.ps1)
# Use this to push updated images after code changes
# =============================================================================

$RESOURCE_GROUP   = "a2ws"
$ACR_NAME         = "a2sacr"
$ACR_LOGIN_SERVER = "$ACR_NAME.azurecr.io"
$BACKEND_APP      = "a2s-backend"
$FRONTEND_APP     = "a2s-frontend"
$LLM_APP          = "a2s-llm"

# Which services to update? Pass flags: .\redeploy-azure.ps1 -Backend -Frontend
param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Llm,
    [switch]$All
)

if ($All) { $Backend = $true; $Frontend = $true; $Llm = $true }
if (-not $Backend -and -not $Frontend -and -not $Llm) {
    Write-Host "Usage: .\redeploy-azure.ps1 [-Backend] [-Frontend] [-Llm] [-All]"
    exit 0
}

az acr login --name $ACR_NAME

if ($Backend) {
    Write-Host "→ Rebuilding backend..." -ForegroundColor Cyan
    docker build -t "$ACR_LOGIN_SERVER/$BACKEND_APP`:latest" ./backend
    docker push "$ACR_LOGIN_SERVER/$BACKEND_APP`:latest"
    az containerapp update --name $BACKEND_APP --resource-group $RESOURCE_GROUP `
        --image "$ACR_LOGIN_SERVER/$BACKEND_APP`:latest"
    Write-Host "  ✓ Backend redeployed" -ForegroundColor Green
}

if ($Llm) {
    Write-Host "→ Rebuilding LLM service..." -ForegroundColor Cyan
    docker build -t "$ACR_LOGIN_SERVER/$LLM_APP`:latest" ./LLM
    docker push "$ACR_LOGIN_SERVER/$LLM_APP`:latest"
    az containerapp update --name $LLM_APP --resource-group $RESOURCE_GROUP `
        --image "$ACR_LOGIN_SERVER/$LLM_APP`:latest"
    Write-Host "  ✓ LLM service redeployed" -ForegroundColor Green
}

if ($Frontend) {
    Write-Host "→ Rebuilding frontend..." -ForegroundColor Cyan
    docker build -t "$ACR_LOGIN_SERVER/$FRONTEND_APP`:latest" ./frontend
    docker push "$ACR_LOGIN_SERVER/$FRONTEND_APP`:latest"
    az containerapp update --name $FRONTEND_APP --resource-group $RESOURCE_GROUP `
        --image "$ACR_LOGIN_SERVER/$FRONTEND_APP`:latest"
    Write-Host "  ✓ Frontend redeployed" -ForegroundColor Green
}

Write-Host ""
$URL = $(az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv)
Write-Host "🌐 Live URL: https://$URL" -ForegroundColor Green
