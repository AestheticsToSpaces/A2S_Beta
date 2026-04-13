# Catalog and Platform Enhancements

## Completed in this pass

- Added `roomType` support to the product model and import flow.
- Added product type to room type mapping utilities.
- Updated scrapers to emit room type metadata.
- Added a high-volume catalog builder entry point.
- Added backend import and pipeline verification test helpers.
- Updated the admin product catalog view to filter by room type.
- Cleaned up the backend production settings for PostgreSQL and Azure ingress.
- Organized the catalog scripts and tests into dedicated folders.

## Enhancements that can still be done

- Increase scraper coverage to reach and maintain 28k+ products.
- Add a dedicated import job for incremental catalog refreshes.
- Add database indexes for `roomType`, `category`, and `brand`.
- Add admin bulk-edit and delete actions for catalog moderation.
- Add product deduplication metrics and source-quality reporting.
- Add catalog export/download controls in admin.
- Add Azure Key Vault integration for secrets.
- Add automated CI/CD deployment to Azure Container Apps.
- Add backup/restore scripts for the catalog database.
- Add monitoring dashboards for catalog growth and import health.
