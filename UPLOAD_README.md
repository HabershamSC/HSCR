# HSCR Master Plan v9 - Zero Adjustment Reset

This package resets the 2025 Master Plan to the untouched, north-up PDF canvas.

## Geometry policy

The raster receives no crop, rotation, local warp, shear, differential scaling, perspective correction, or pixel translation.

The PDF page is rendered directly at 240 dpi to 6180 x 5400 pixels and compressed to WebP. The browser uses one standard Google Maps `GroundOverlay` with the configured geographic bounds.

## Upload to the GitHub repository root

Replace:

- `index.html`
- `map-app.js`
- `master-plan-layer.js`
- `master-plan-overlay.json`
- `master-plan-2025.webp`

Add or replace:

- `source/2025_Master_Plan_Canvas_converted.pdf`

Do not upload the enclosing folder. Upload its contents into the repository root.

## Verification

After GitHub Pages deploys, open `https://habershamsc.github.io/HSCR/?base=plan` and hard-refresh.

In the browser console, run:

```javascript
window.HabershamMasterPlan.version
```

Expected result: `9.0.0-zero-adjustment`.
