/*
 * Map profiles select the initial taxonomy while preserving the shared master UI.
 * Plan Name, Square Footage, Amount and Updated remain popup fields but are not color-map options.
 * Plat Dimensions remains a popup field but is not a searchable filter.
 */
window.HAM_PROFILES = Object.freeze({
  "default": {
    "subtitle": "",
    "taxonomyOptions": [
      "lotStatus",
      "propertyType",
      "stage",
      "listingStatus",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder"
    ],
    "filters": [
      {
        "field": "searchAll",
        "control": "search",
        "section": "primary"
      },
      {
        "field": "lotStatus",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "stage",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "builder",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "propertyType",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "listingStatus",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodZoning",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodDistrict",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "architect",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "planName",
        "control": "select",
        "section": "secondary"
      }
    ],
    "labels": {
      "field": "labelText",
      "label": "Lot Number",
      "toggleVisible": true,
      "enabledByDefault": true,
      "minimumZoom": 17,
      "maximumLabels": 1200
    },
    "legend": {
      "visible": true,
      "interactive": true,
      "showCounts": true,
      "showHelp": true
    },
    "popupFields": [
      "propertyName",
      "lotNumber",
      "dmpNumber",
      "lotStatus",
      "stage",
      "listingStatus",
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName",
      "arbFolderLink",
      "photoArchiveLink",
      "imageUrl"
    ],
    "map": {
      "mapTypeId": "satellite",
      "fitToData": true,
      "fallbackCenter": {
        "lat": 32.4,
        "lng": -80.75
      },
      "fallbackZoom": 15,
      "maxInitialZoom": 18
    },
    "style": {
      "fillOpacity": 0.56,
      "strokeColor": "#ffffff",
      "strokeOpacity": 1,
      "strokeWeight": 1.45,
      "hoverFillOpacity": 0.76,
      "hoverStrokeWeight": 2.5
    },
    "title": "Habersham Active Mapping",
    "taxonomy": "lotStatus"
  },
  "property-types": {
    "subtitle": "Property-use view",
    "taxonomyOptions": [
      "lotStatus",
      "propertyType",
      "stage",
      "listingStatus",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder"
    ],
    "filters": [
      {
        "field": "searchAll",
        "control": "search",
        "section": "primary"
      },
      {
        "field": "lotStatus",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "stage",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "builder",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "propertyType",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "listingStatus",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodZoning",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodDistrict",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "architect",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "planName",
        "control": "select",
        "section": "secondary"
      }
    ],
    "labels": {
      "field": "labelText",
      "label": "Lot Number",
      "toggleVisible": true,
      "enabledByDefault": true,
      "minimumZoom": 17,
      "maximumLabels": 1200
    },
    "legend": {
      "visible": true,
      "interactive": true,
      "showCounts": true,
      "showHelp": true
    },
    "popupFields": [
      "propertyName",
      "lotNumber",
      "dmpNumber",
      "lotStatus",
      "stage",
      "listingStatus",
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName",
      "arbFolderLink",
      "photoArchiveLink",
      "imageUrl"
    ],
    "map": {
      "mapTypeId": "satellite",
      "fitToData": true,
      "fallbackCenter": {
        "lat": 32.4,
        "lng": -80.75
      },
      "fallbackZoom": 15,
      "maxInitialZoom": 18
    },
    "style": {
      "fillOpacity": 0.56,
      "strokeColor": "#ffffff",
      "strokeOpacity": 1,
      "strokeWeight": 1.45,
      "hoverFillOpacity": 0.76,
      "hoverStrokeWeight": 2.5
    },
    "title": "Habersham Property Types",
    "taxonomy": "propertyType"
  },
  "construction": {
    "subtitle": "Construction-stage view",
    "taxonomyOptions": [
      "lotStatus",
      "propertyType",
      "stage",
      "listingStatus",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder"
    ],
    "filters": [
      {
        "field": "searchAll",
        "control": "search",
        "section": "primary"
      },
      {
        "field": "lotStatus",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "stage",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "builder",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "propertyType",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "listingStatus",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodZoning",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodDistrict",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "architect",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "planName",
        "control": "select",
        "section": "secondary"
      }
    ],
    "labels": {
      "field": "labelText",
      "label": "Lot Number",
      "toggleVisible": true,
      "enabledByDefault": true,
      "minimumZoom": 17,
      "maximumLabels": 1200
    },
    "legend": {
      "visible": true,
      "interactive": true,
      "showCounts": true,
      "showHelp": true
    },
    "popupFields": [
      "propertyName",
      "lotNumber",
      "dmpNumber",
      "lotStatus",
      "stage",
      "listingStatus",
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName",
      "arbFolderLink",
      "photoArchiveLink",
      "imageUrl"
    ],
    "map": {
      "mapTypeId": "satellite",
      "fitToData": true,
      "fallbackCenter": {
        "lat": 32.4,
        "lng": -80.75
      },
      "fallbackZoom": 15,
      "maxInitialZoom": 18
    },
    "style": {
      "fillOpacity": 0.56,
      "strokeColor": "#ffffff",
      "strokeOpacity": 1,
      "strokeWeight": 1.45,
      "hoverFillOpacity": 0.76,
      "hoverStrokeWeight": 2.5
    },
    "title": "Habersham Construction Activity",
    "taxonomy": "stage"
  },
  "builders": {
    "subtitle": "Builder view",
    "taxonomyOptions": [
      "lotStatus",
      "propertyType",
      "stage",
      "listingStatus",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder"
    ],
    "filters": [
      {
        "field": "searchAll",
        "control": "search",
        "section": "primary"
      },
      {
        "field": "lotStatus",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "stage",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "builder",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "propertyType",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "listingStatus",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodZoning",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodDistrict",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "architect",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "planName",
        "control": "select",
        "section": "secondary"
      }
    ],
    "labels": {
      "field": "labelText",
      "label": "Lot Number",
      "toggleVisible": true,
      "enabledByDefault": true,
      "minimumZoom": 17,
      "maximumLabels": 1200
    },
    "legend": {
      "visible": true,
      "interactive": true,
      "showCounts": true,
      "showHelp": true
    },
    "popupFields": [
      "propertyName",
      "lotNumber",
      "dmpNumber",
      "lotStatus",
      "stage",
      "listingStatus",
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName",
      "arbFolderLink",
      "photoArchiveLink",
      "imageUrl"
    ],
    "map": {
      "mapTypeId": "satellite",
      "fitToData": true,
      "fallbackCenter": {
        "lat": 32.4,
        "lng": -80.75
      },
      "fallbackZoom": 15,
      "maxInitialZoom": 18
    },
    "style": {
      "fillOpacity": 0.56,
      "strokeColor": "#ffffff",
      "strokeOpacity": 1,
      "strokeWeight": 1.45,
      "hoverFillOpacity": 0.76,
      "hoverStrokeWeight": 2.5
    },
    "title": "Habersham Builder Map",
    "taxonomy": "builder"
  },
  "explorer": {
    "subtitle": "Select any approved public taxonomy",
    "taxonomyOptions": [
      "lotStatus",
      "propertyType",
      "stage",
      "listingStatus",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder"
    ],
    "filters": [
      {
        "field": "searchAll",
        "control": "search",
        "section": "primary"
      },
      {
        "field": "lotStatus",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "stage",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "builder",
        "control": "select",
        "section": "primary"
      },
      {
        "field": "propertyType",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "listingStatus",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodZoning",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "neighborhoodDistrict",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "architect",
        "control": "select",
        "section": "secondary"
      },
      {
        "field": "planName",
        "control": "select",
        "section": "secondary"
      }
    ],
    "labels": {
      "field": "labelText",
      "label": "Lot Number",
      "toggleVisible": true,
      "enabledByDefault": true,
      "minimumZoom": 17,
      "maximumLabels": 1200
    },
    "legend": {
      "visible": true,
      "interactive": true,
      "showCounts": true,
      "showHelp": true
    },
    "popupFields": [
      "propertyName",
      "lotNumber",
      "dmpNumber",
      "lotStatus",
      "stage",
      "listingStatus",
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName",
      "arbFolderLink",
      "photoArchiveLink",
      "imageUrl"
    ],
    "map": {
      "mapTypeId": "satellite",
      "fitToData": true,
      "fallbackCenter": {
        "lat": 32.4,
        "lng": -80.75
      },
      "fallbackZoom": 15,
      "maxInitialZoom": 18
    },
    "style": {
      "fillOpacity": 0.56,
      "strokeColor": "#ffffff",
      "strokeOpacity": 1,
      "strokeWeight": 1.45,
      "hoverFillOpacity": 0.76,
      "hoverStrokeWeight": 2.5
    },
    "title": "Habersham Mapping Explorer",
    "taxonomy": "lotStatus"
  }
});
