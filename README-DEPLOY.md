# HSCR FINAL GEOMETRY DEPLOYMENT

This package replaces the mixed historical geolocation with a hybrid authoritative registry:
- County-recorded faces use Beaufort County EnerGov parcel geometry directly.
- County-unresolved/new faces retain their CAD shape and use the County-control-derived affine georeference.
- `master-plan-2025.webp` is untouched.
- PipelineCRM is untouched.

## Test branch
Use: `fix/final-geometry`

Replace these two repository files:
1. `/data/master-parcel-faces.geojson`
2. `/habersham-parcels.geojson`

Commit and load:
`https://habershamsc.github.io/HSCR/?base=plan`

Visually QA established neighborhoods and Pondcrest before merging to main.

The included `apps-script/Publisher_FaceID.gs` preserves the Face-ID based publication architecture for future CRM updates.
