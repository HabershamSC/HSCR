"use strict";

const CONFIG = Object.freeze({
  geoJsonUrl: "./data/habersham-parcels.geojson",
  mapCenter: { lat: 32.42598, lng: -80.777523 },
  initialZoom: 16,
  fitToParcelBounds: true,
  minimumLabelZoom: 17
});

let map;
let infoWindow;
let parcelFeatures = [];
let geoJsonMetadata = {};
const labelMarkers = new Map();

function text(value) { return String(value ?? "").trim(); }
function normalize(value) { return text(value).toLowerCase(); }

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHttpUrl(value) {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function property(feature, ...names) {
  for (const name of names) {
    const value = feature.getProperty(name);
    if (value !== undefined && value !== null && text(value) !== "") return value;
  }
  return "";
}

function setStatus(message, isError = false) {
  const el = document.getElementById("mapStatus");
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function formatAmount(value) {
  const cleaned = text(value).replace(/[$,]/g, "");
  const number = Number(cleaned);
  if (!cleaned || !Number.isFinite(number) || number === 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(number);
}

async function initMap() {
  try {
    map = new google.maps.Map(document.getElementById("map"), {
      center: CONFIG.mapCenter,
      zoom: CONFIG.initialZoom,
      mapTypeId: "satellite",
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      tilt: 0
    });

    infoWindow = new google.maps.InfoWindow();
    installInteractions();
    attachFilterListeners();

    await loadParcels();
    populateFilters();
    buildLotLabels();
    applyFilters();

    map.addListener("zoom_changed", updateLabelVisibility);

    if (CONFIG.fitToParcelBounds) fitMapToFeatures();
  } catch (error) {
    console.error(error);
    setStatus(`Map initialization failed: ${error.message}`, true);
  }
}

async function loadParcels() {
  setStatus("Loading restored parcel GeoJSON…");
  const separator = CONFIG.geoJsonUrl.includes("?") ? "&" : "?";
  const response = await fetch(
    `${CONFIG.geoJsonUrl}${separator}v=${Date.now()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Unable to load GeoJSON (${response.status}).`);
  }

  const geoJson = await response.json();
  if (geoJson?.type !== "FeatureCollection" || !Array.isArray(geoJson.features)) {
    throw new Error("The parcel file is not a valid GeoJSON FeatureCollection.");
  }

  geoJsonMetadata = geoJson.metadata || {};

  labelMarkers.forEach(marker => marker.setMap(null));
  labelMarkers.clear();

  map.data.forEach(feature => map.data.remove(feature));
  parcelFeatures = map.data.addGeoJson(geoJson, {
    idPropertyName: "feature_id"
  });

  map.data.setStyle(styleFeature);
}

function stagePalette(feature) {
  const recordType = normalize(property(feature, "record_type"));
  const stage = normalize(property(feature, "stage"));
  const lotStatus = normalize(property(feature, "lot_status"));

  if (recordType === "unassigned_model_face") {
    return {
      fill: "#d9bd55",
      opacity: .18,
      stroke: "#f4d35e",
      strokeOpacity: .95,
      strokeWeight: 1.2,
      zIndex: 1
    };
  }

  if (stage.includes("listed for sale")) return { fill: "#3d7d46", opacity: .68 };
  if (stage.includes("under contract")) return { fill: "#c48b28", opacity: .68 };
  if (stage.includes("under construction")) return { fill: "#356f9f", opacity: .60 };
  if (stage.includes("completed construction")) return { fill: "#397c78", opacity: .54 };
  if (stage.includes("property sold")) return { fill: "#737373", opacity: .38 };
  if (stage.includes("inactive")) return { fill: "#888888", opacity: .30 };
  if (lotStatus.includes("unimproved")) return { fill: "#667f5d", opacity: .46 };

  return { fill: "#607d8b", opacity: .44 };
}

function styleFeature(feature) {
  const palette = stagePalette(feature);
  const visible = feature.getProperty("_visible") !== false;

  return {
    clickable: true,
    visible,
    fillColor: palette.fill,
    fillOpacity: palette.opacity,
    strokeColor: palette.stroke || "#ffffff",
    strokeOpacity: palette.strokeOpacity ?? .95,
    strokeWeight: palette.strokeWeight ?? 1.4,
    zIndex: palette.zIndex ?? 2
  };
}

function populateFilters() {
  const fields = [
    ["lotNumberFilter", "lot_number", true],
    ["propertyTypeFilter", "property_type", false],
    ["statusFilter", "lot_status", false],
    ["stageFilter", "stage", false],
    ["builderFilter", "builder", false]
  ];

  for (const [selectId, propertyName, natural] of fields) {
    const values = new Set();

    parcelFeatures.forEach(feature => {
      if (normalize(property(feature, "record_type")) === "unassigned_model_face") {
        return;
      }
      const value = text(property(feature, propertyName));
      if (value) values.add(value);
    });

    const sorted = [...values].sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: natural,
        sensitivity: "base"
      })
    );

    const select = document.getElementById(selectId);
    select.replaceChildren(new Option("All", ""));
    sorted.forEach(value => select.add(new Option(value, value)));
  }
}

function currentFilters() {
  return {
    lot_number: normalize(document.getElementById("lotNumberFilter").value),
    property_type: normalize(document.getElementById("propertyTypeFilter").value),
    lot_status: normalize(document.getElementById("statusFilter").value),
    stage: normalize(document.getElementById("stageFilter").value),
    builder: normalize(document.getElementById("builderFilter").value)
  };
}

function featureMatchesFilters(feature, filters) {
  const recordType = normalize(property(feature, "record_type"));

  // Supplemental model faces are visible only while no CRM filters are active.
  if (recordType === "unassigned_model_face") {
    return Object.values(filters).every(value => !value);
  }

  return Object.entries(filters).every(([key, expected]) =>
    !expected || normalize(property(feature, key)) === expected
  );
}

function applyFilters() {
  const filters = currentFilters();
  let visibleCount = 0;
  let supplementalCount = 0;

  parcelFeatures.forEach(feature => {
    const matches = featureMatchesFilters(feature, filters);
    feature.setProperty("_visible", matches);

    if (matches) {
      visibleCount += 1;
      if (normalize(property(feature, "record_type")) === "unassigned_model_face") {
        supplementalCount += 1;
      }
    }
  });

  map.data.setStyle(styleFeature);
  infoWindow.close();
  updateLabelVisibility();

  const skipped = Number(geoJsonMetadata.skipped_count || 0);
  const supplementalText = supplementalCount
    ? `; ${supplementalCount} accepted but unassigned parcel faces retained`
    : "";
  const skippedText = skipped
    ? `; ${skipped} CRM records lack polygon geometry`
    : "";

  setStatus(
    `${visibleCount.toLocaleString()} of ${parcelFeatures.length.toLocaleString()} map features visible${supplementalText}${skippedText}.`
  );
}

function clearFilters() {
  [
    "lotNumberFilter",
    "propertyTypeFilter",
    "statusFilter",
    "stageFilter",
    "builderFilter"
  ].forEach(id => {
    document.getElementById(id).value = "";
  });

  applyFilters();
}

function attachFilterListeners() {
  [
    "lotNumberFilter",
    "propertyTypeFilter",
    "statusFilter",
    "stageFilter",
    "builderFilter"
  ].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFilters);
  });

  document
    .getElementById("showLotLabelsToggle")
    .addEventListener("change", updateLabelVisibility);

  document
    .getElementById("clearFiltersButton")
    .addEventListener("click", clearFilters);
}

function buildLotLabels() {
  labelMarkers.forEach(marker => marker.setMap(null));
  labelMarkers.clear();

  parcelFeatures.forEach(feature => {
    const showLabel = feature.getProperty("show_label") === true;
    const labelText = text(property(feature, "label_text"));
    const latitude = Number(property(feature, "label_latitude"));
    const longitude = Number(property(feature, "label_longitude"));

    if (!showLabel || !labelText || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const featureId = text(property(feature, "feature_id")) || String(feature.getId());

    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: null,
      clickable: false,
      optimized: false,
      zIndex: 30,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0
      },
      label: {
        text: labelText,
        color: "#1d261f",
        fontSize: "11px",
        fontWeight: "700",
        className: "parcel-lot-label"
      }
    });

    labelMarkers.set(featureId, {
      marker,
      feature
    });
  });

  updateLabelVisibility();
}

function updateLabelVisibility() {
  if (!map) return;

  const toggle = document.getElementById("showLotLabelsToggle");
  const labelsEnabled = Boolean(toggle?.checked);
  const zoomAllowsLabels = (map.getZoom() || 0) >= CONFIG.minimumLabelZoom;

  labelMarkers.forEach(({ marker, feature }) => {
    const featureVisible = feature.getProperty("_visible") !== false;
    marker.setMap(labelsEnabled && zoomAllowsLabels && featureVisible ? map : null);
  });
}

function row(label, value) {
  const cleaned = text(value);
  return cleaned
    ? `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(cleaned)}</dd>`
    : "";
}

function installInteractions() {
  map.data.addListener("click", event => {
    const feature = event.feature;
    const recordType = normalize(property(feature, "record_type"));

    if (recordType === "unassigned_model_face") {
      const faceId = property(feature, "geometry_face_id") || "Unassigned face";
      const content = `
        <div class="info-window">
          <h2>${escapeHtml(faceId)}</h2>
          <div class="property-name">Accepted geolocated parcel face</div>
          <div class="status-badge">Identity not yet assigned</div>
          <dl>
            ${row("Geometry Source", property(feature, "geometry_source"))}
            ${row("Area", property(feature, "area_sqft") ? `${property(feature, "area_sqft")} sq. ft.` : "")}
          </dl>
        </div>`;

      infoWindow.setContent(content);
      infoWindow.setPosition(event.latLng);
      infoWindow.open({ map });
      return;
    }

    const lot = property(feature, "lot_number") || "Not assigned";
    const name = property(feature, "name");
    const stage = property(feature, "stage");
    const imageUrl = safeHttpUrl(property(feature, "image_url"));
    const amount = formatAmount(property(feature, "amount"));

    const content = `
      <div class="info-window">
        <h2>Lot ${escapeHtml(lot)}</h2>
        ${name ? `<div class="property-name">${escapeHtml(name)}</div>` : ""}
        ${stage ? `<div class="status-badge">${escapeHtml(stage)}</div>` : ""}
        <dl>
          ${row("Property Type", property(feature, "property_type"))}
          ${row("Lot Status", property(feature, "lot_status"))}
          ${row("Stage", stage)}
          ${row("Amount", amount)}
          ${row("Builder", property(feature, "builder"))}
          ${row("Architect", property(feature, "architect"))}
          ${row("DMP #", property(feature, "dmp_number"))}
          ${row("Deal ID", property(feature, "deal_id"))}
          ${row("Geometry Source", property(feature, "geometry_source"))}
          ${row("Face / PIN", property(feature, "geometry_face_id"))}
        </dl>
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="Property image for Lot ${escapeHtml(lot)}">` : ""}
      </div>`;

    infoWindow.setContent(content);
    infoWindow.setPosition(event.latLng);
    infoWindow.open({ map });
  });

  map.data.addListener("mouseover", event => {
    map.data.overrideStyle(event.feature, {
      fillOpacity: .78,
      strokeWeight: 3,
      zIndex: 10
    });
  });

  map.data.addListener("mouseout", event => {
    map.data.revertStyle(event.feature);
  });
}

function fitMapToFeatures() {
  const bounds = new google.maps.LatLngBounds();
  let hasCoordinates = false;

  map.data.forEach(feature => {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    geometry.forEachLatLng(latLng => {
      bounds.extend(latLng);
      hasCoordinates = true;
    });
  });

  if (!hasCoordinates) return;

  map.fitBounds(bounds, 30);
  google.maps.event.addListenerOnce(map, "idle", () => {
    if (map.getZoom() > 18) map.setZoom(18);
    updateLabelVisibility();
  });
}

window.initMap = initMap;
