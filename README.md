# Habersham Active Mapping — Public Taxonomy Package

This is the complete flat GitHub Pages application root.

## Approved public fields

Only these CRM values are rendered by the browser:

- Name
- Lot Number
- DMP#
- Lot Status
- Plat Dimensions
- Property Type
- Square Footage (Heated)
- Stage
- Listing Status
- Amount
- Updated
- Neighborhood Zoning
- Neighborhood District
- Architect
- Builder
- Habersham Plan Name
- ARB Folder Link (Drive)
- Photo Archive (Drive)
- Image URL

The browser does not define or display ID, Pipeline Deal ID, HSCR Face ID, geometry diagnostics, arbitrary `crm_*` fields, or other CRM columns.

## Required live root files

The package intentionally does not overwrite these live geometry/data files:

- `Habersham_Geolocated_Parcel_CAD.geojson`
- `habersham-parcels.geojson`

Keep the root-level master geometry file. Replace the Publisher first and run it to regenerate the sanitized `habersham-parcels.geojson`.

## Installation order

1. In Google Apps Script, replace Publisher.gs with the file in `GOOGLE-APPS-SCRIPT`.
2. Run `validateHabershamData`.
3. Run `publishAllHabershamData`.
4. Delete the obsolete public `habersham-parcels-report.json` from GitHub if it exists.
5. Upload every file in this `GITHUB-ROOT` folder to the repository root.
6. Preserve `Habersham_Geolocated_Parcel_CAD.geojson` and the newly published `habersham-parcels.geojson`.
7. Wait for GitHub Pages deployment and hard-refresh.

## Callable views

- `./` or `?view=default`
- `property-types.html`
- `construction.html`
- `builders.html`
- `explorer.html`

Every view uses one master UI and permits switching among the approved public taxonomies.
