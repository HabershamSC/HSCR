# Deployment checklist

1. Back up the current GitHub repository or create a release/tag.
2. Copy the existing Google Maps browser API key into `config/runtime.js`.
3. Confirm the key allows the Maps JavaScript API and is restricted to:
   - `https://habershamsc.github.io/HSCR/*`
   - Any custom production domain used for the map.
4. Replace `data/habersham-active.geojson` with the current Publisher.gs output.
5. Upload the complete folder structure to the root of the `HSCR` GitHub repository.
6. Confirm GitHub Pages deploys from the intended branch and root folder.
7. Test these URLs:
   - `./?view=default`
   - `./?view=property-types`
   - `./?view=construction`
   - `./?view=builders`
   - `./?view=explorer`
8. Test filters, map-key toggles, Shift-click isolation, lot labels, popup content and full-screen mode.
9. Test a shared filtered URL, such as `?view=property-types&status=Available`.
10. Confirm the browser console contains no API-key, CORS, mixed-content or GeoJSON errors.

## Updating a taxonomy

Edit only `config/taxonomies.js`. A taxonomy determines the classification field, key labels, colors, aliases and fallback behavior.

## Creating a new map version

Add a profile to `config/profiles.js`, then call it with `?view=NEW_PROFILE_ID`. A profile selects the taxonomy, filters, popup fields, labels and polygon style.

## Changing the dataset location

Edit `dataUrl` in `config/runtime.js`. The endpoint must return a valid GeoJSON FeatureCollection and permit browser access from the GitHub Pages origin.
