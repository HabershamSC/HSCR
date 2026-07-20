/*
 * Map profiles select the filters, taxonomy, labels, popup fields and viewport.
 * Call a profile with ?view=PROFILE_ID. Example: ?view=property-types
 */
window.HAM_PROFILES = Object.freeze({
  default: {
    title: "Habersham Active Mapping",
    subtitle: "",
    taxonomy: "dealStatus",
    taxonomyOptions: ["dealStatus"],
    filters: [
      { field: "lotNumber", control: "select" },
      { field: "propertyType", control: "select" },
      { field: "status", control: "select" },
      { field: "stage", control: "select" },
      { field: "builder", control: "select" }
    ],
    labels: {
      field: "lotNumber",
      label: "Lot Number",
      toggleVisible: true,
      enabledByDefault: true,
      minimumZoom: 17,
      maximumLabels: 1200
    },
    legend: {
      visible: true,
      interactive: true,
      showCounts: true,
      showHelp: true
    },
    popupFields: ["lotNumber", "dmpNumber", "propertyType", "status", "stage", "builder", "architect", "price", "primaryImage", "hscrFaceId", "dealId", "dealUrl"],
    map: {
      mapTypeId: "satellite",
      fitToData: true,
      fallbackCenter: { lat: 32.40, lng: -80.75 },
      fallbackZoom: 15,
      maxInitialZoom: 18
    },
    style: {
      fillOpacity: 0.48,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 1.45,
      hoverFillOpacity: 0.72,
      hoverStrokeWeight: 2.5
    }
  },

  "property-types": {
    title: "Habersham Property Types",
    subtitle: "Property-use taxonomy",
    taxonomy: "propertyType",
    taxonomyOptions: ["propertyType"],
    filters: [
      { field: "propertyName", control: "search" },
      { field: "lotNumber", control: "search" },
      { field: "propertyType", control: "select" },
      { field: "status", control: "select" },
      { field: "stage", control: "select" },
      { field: "architect", control: "select" },
      { field: "builder", control: "select" }
    ],
    labels: {
      field: "lotNumber",
      label: "Lot Number",
      toggleVisible: true,
      enabledByDefault: false,
      minimumZoom: 17,
      maximumLabels: 1200
    },
    legend: {
      visible: true,
      interactive: true,
      showCounts: true,
      showHelp: true
    },
    popupFields: ["propertyName", "lotNumber", "dmpNumber", "propertyType", "status", "stage", "architect", "builder", "price", "primaryImage", "hscrFaceId", "dealId", "dealUrl"],
    map: {
      mapTypeId: "satellite",
      fitToData: true,
      fallbackCenter: { lat: 32.40, lng: -80.75 },
      fallbackZoom: 15,
      maxInitialZoom: 18
    },
    style: {
      fillOpacity: 0.62,
      strokeColor: "#171717",
      strokeOpacity: 0.86,
      strokeWeight: 1.2,
      hoverFillOpacity: 0.78,
      hoverStrokeWeight: 2.4
    }
  },

  construction: {
    title: "Habersham Construction Activity",
    subtitle: "Stage taxonomy",
    taxonomy: "constructionStage",
    taxonomyOptions: ["constructionStage"],
    filters: [
      { field: "lotNumber", control: "search" },
      { field: "stage", control: "select" },
      { field: "builder", control: "select" },
      { field: "architect", control: "select" },
      { field: "propertyType", control: "select" }
    ],
    labels: {
      field: "lotNumber",
      label: "Lot Number",
      toggleVisible: true,
      enabledByDefault: true,
      minimumZoom: 17,
      maximumLabels: 1200
    },
    legend: {
      visible: true,
      interactive: true,
      showCounts: true,
      showHelp: true
    },
    popupFields: ["lotNumber", "propertyType", "stage", "builder", "architect", "status", "price", "primaryImage", "hscrFaceId", "dealId", "dealUrl"],
    map: {
      mapTypeId: "satellite",
      fitToData: true,
      fallbackCenter: { lat: 32.40, lng: -80.75 },
      fallbackZoom: 15,
      maxInitialZoom: 18
    },
    style: {
      fillOpacity: 0.58,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 1.4,
      hoverFillOpacity: 0.78,
      hoverStrokeWeight: 2.5
    }
  },

  builders: {
    title: "Habersham Builder Map",
    subtitle: "Builder taxonomy",
    taxonomy: "builder",
    taxonomyOptions: ["builder"],
    filters: [
      { field: "lotNumber", control: "search" },
      { field: "builder", control: "select" },
      { field: "stage", control: "select" },
      { field: "status", control: "select" },
      { field: "propertyType", control: "select" }
    ],
    labels: {
      field: "lotNumber",
      label: "Lot Number",
      toggleVisible: true,
      enabledByDefault: true,
      minimumZoom: 17,
      maximumLabels: 1200
    },
    legend: {
      visible: true,
      interactive: true,
      showCounts: true,
      showHelp: true
    },
    popupFields: ["lotNumber", "builder", "architect", "propertyType", "status", "stage", "price", "primaryImage", "hscrFaceId", "dealId", "dealUrl"],
    map: {
      mapTypeId: "satellite",
      fitToData: true,
      fallbackCenter: { lat: 32.40, lng: -80.75 },
      fallbackZoom: 15,
      maxInitialZoom: 18
    },
    style: {
      fillOpacity: 0.58,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 1.4,
      hoverFillOpacity: 0.78,
      hoverStrokeWeight: 2.5
    }
  },

  explorer: {
    title: "Habersham Mapping Explorer",
    subtitle: "Change the active map key without changing the dataset",
    taxonomy: "dealStatus",
    taxonomyOptions: ["dealStatus", "propertyType", "constructionStage", "builder", "priceBand"],
    filters: [
      { field: "propertyName", control: "search" },
      { field: "lotNumber", control: "search" },
      { field: "propertyType", control: "select" },
      { field: "status", control: "select" },
      { field: "stage", control: "select" },
      { field: "builder", control: "select" },
      { field: "architect", control: "select" }
    ],
    labels: {
      field: "lotNumber",
      label: "Lot Number",
      toggleVisible: true,
      enabledByDefault: true,
      minimumZoom: 17,
      maximumLabels: 1200
    },
    legend: {
      visible: true,
      interactive: true,
      showCounts: true,
      showHelp: true
    },
    popupFields: ["propertyName", "lotNumber", "dmpNumber", "propertyType", "status", "stage", "builder", "architect", "price", "primaryImage", "hscrFaceId", "dealId", "dealUrl"],
    map: {
      mapTypeId: "satellite",
      fitToData: true,
      fallbackCenter: { lat: 32.40, lng: -80.75 },
      fallbackZoom: 15,
      maxInitialZoom: 18
    },
    style: {
      fillOpacity: 0.55,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 1.4,
      hoverFillOpacity: 0.78,
      hoverStrokeWeight: 2.5
    }
  }
});
