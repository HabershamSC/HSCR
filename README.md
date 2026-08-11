# HSCR — Beaufort County Geocalibration

This package does **not** alter `master-plan-2025.webp`, PipelineCRM records, or HSCR Face IDs.

It uses Beaufort County's public parcel service as the geodetic reference, matches established County parcels to the existing Face registry primarily by DMP and secondarily by lot number, with distance rejection to prevent same-number false matches, and evaluates three transformations in South Carolina State Plane (EPSG:2273):

1. translation
2. similarity (translation + rotation + uniform scale)
3. affine (translation + rotation + independent scale + shear)

Twenty percent of matches are withheld from fitting and used as validation. The script produces all three candidate registries and selects the simplest transformation that materially improves holdout error.

## Recommended GitHub workflow

1. Create a branch, e.g. `fix/county-geocalibration`.
2. Copy this package's `data/`, `scripts/`, `requirements.txt`, and `.github/` into the repository.
3. Push the branch.
4. In GitHub open **Actions → Beaufort County parcel geocalibration → Run workflow**.
5. Download the `HSCR-Beaufort-County-Geocalibration` artifact.
6. Review `calibration-report.json` and `match-audit.csv`.
7. Visually QA `master-parcel-faces.CANDIDATE.geojson` against Beaufort County GIS and the unchanged town-plan WebP.
8. Only after QA passes, replace `data/master-parcel-faces.geojson` with the candidate and rerun the Face-ID Publisher.

## Pass/fail guidance

A good result should show low holdout residuals distributed across the development, not merely low training error. If affine training error is excellent but holdout error remains large, do **not** deploy: that indicates inconsistent source geometry or bad matches rather than a valid sitewide transform.

The script deliberately never overwrites the production registry.
