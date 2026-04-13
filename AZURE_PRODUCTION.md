# Azure Production Setup

## What is now configured

- PostgreSQL-backed backend configuration is the default path.
- Azure deployment scripts now target PostgreSQL env vars instead of SQL Server assumptions.
- Frontend reverse proxy remains wired through `nginx.conf`.
- Backend logging and forwarded-header support are enabled for Azure ingress.
- Catalog scripts and tests are organized under `LLM/scripts` and `LLM/tests`.

## Required Azure inputs

Use these environment variables in `.env` before deployment:

- `POSTGRES_HOST`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `CORS_ORIGINS`
- `OAUTH2_REDIRECT_URI`
- `NVIDIA_NIM_API_KEY` if the Vastu service uses NIM vision inference

## Deployment flow

1. Create or reuse an Azure Container Registry.
2. Build and push the backend, frontend, and LLM images.
3. Create an Azure Container Apps environment.
4. Deploy the backend with PostgreSQL env vars.
5. Deploy the LLM service with its API keys.
6. Deploy the frontend and point `/api` to the backend internal FQDN.
7. Validate `/api/health`, `/api/products`, and `/api/vastu/status`.

## Operational checks

- Confirm backend health before opening traffic.
- Confirm frontend can reach backend through the Container Apps network.
- Confirm product import accepts `roomType`.
- Confirm admin shows room-based filters.
- Confirm catalog build exports room-wise data.

## Remaining production work

- Provision Azure Database for PostgreSQL Flexible Server if not already present.
- Store secrets in Azure Key Vault or Container Apps secrets rather than plain `.env`.
- Add CI/CD for image build and deploy.
- Add monitoring/alerts for backend, frontend, LLM, and database health.
- Add backup and restore automation for the catalog database.
