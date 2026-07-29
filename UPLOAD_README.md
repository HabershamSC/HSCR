# HSCR Master Plan Production Replacement v7

Upload the following five files to the root of the HSCR GitHub repository and overwrite the existing files:

- `index.html`
- `map-app.js`
- `master-plan-layer.js`
- `master-plan-overlay.json`
- `master-plan-2025.webp`

## What changed

The Master Plan raster has been pre-warped against the current authoritative CAD parcel geometry across the full mapped site. The browser no longer applies rotation, translation, shear, or scale calibration. `master-plan-layer.js` uses a standard Google Maps `GroundOverlay` with the existing geographic bounds.

The corrected raster uses a sitewide affine registration derived from parcel-boundary edge correspondence. This avoids the inconsistent results produced by the prior CSS-rotated overlay.

## Deployment

1. Upload all five files together.
2. Commit directly to `main`.
3. Wait for the GitHub Pages deployment to complete.
4. Open the site in an Incognito window.
5. Hard refresh with Ctrl+Shift+R on Windows or Command+Shift+R on macOS.

The cache token in `index.html` is `20260729-7`.

## Rollback

Keep the prior v6 ZIP until visual QA is complete. To roll back, restore the five v6 files together.
