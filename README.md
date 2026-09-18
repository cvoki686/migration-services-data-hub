# Migration Services Data Hub — GitHub Pages

Public static website for the Migration Services Data Hub.

## Architecture

Private Microsoft 365 workbook -> GitHub Actions -> generated `data/catalogue.json` -> GitHub Pages.

The public browser **never receives Microsoft credentials**. The GitHub Actions workflow downloads the workbook using repository secrets, extracts the catalogue and embedded Excel hyperlink targets, then deploys the resulting static website.

The workflow refreshes approximately hourly, on pushes to `main`, and when manually triggered from **Actions**.

## Required GitHub Actions secrets

Create these under **Repository -> Settings -> Secrets and variables -> Actions -> New repository secret**:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `WORKBOOK_SHARE_URL`

For `WORKBOOK_SHARE_URL`, use:

`https://coventrycc-my.sharepoint.com/:x:/r/personal/cvhum644_coventry_gov_uk/_layouts/15/Doc.aspx?sourcedoc=%7B3974171D-697B-4C24-BC2A-71EE10FB1031%7D&file=Migration%20Data%20Repo%20-%20Copy.xlsx&action=default&mobileredirect=true`

The Microsoft values must come from a Coventry-approved Entra application with the least-privilege read access approved for the workbook/site.

## Publishing

In **Settings -> Pages -> Build and deployment -> Source**, select **GitHub Actions**.

Then run the workflow named **Refresh catalogue and publish GitHub Pages** from the Actions tab, or push to `main`.

## Important public-data warning

GitHub Pages is public internet hosting. Everything deployed in `data/catalogue.json`, including descriptions, comments, source links and dashboard links, should be treated as public. Do not publish confidential, personal, restricted or internal-only information. Confirm Coventry City Council approval before making the repository/site public.

For production resilience, use a team-owned SharePoint library rather than a workbook tied to an individual's OneDrive.
