(() => {
  "use strict";

  const APP_VERSION = "1.0.0";
  const FALLBACK_COLOR = "#b8b8b8";

  const state = {
    runtime: window.HAM_RUNTIME || {},
    fields: window.HAM_FIELDS || {},
    taxonomies: window.HAM_TAXONOMIES || {},
    profiles: window.HAM_PROFILES || {},
    profileId: "",
    profile: null,
    taxonomyId: "",
    taxonomy: null,
    payload: null,
    metadata: {},
    map: null,
    infoWindow: null,
    labelLayer: null,
    features: [],
    records: [],
    recordByFeature: new WeakMap(),
    visualByFeature: new WeakMap(),
    filterState: {},
    filterControls: new Map(),
    activeCategoryKeys: new Set(),
    selectedFeature: null,
    updateTimer: null
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", boot);

  async function boot() {
    cacheDom();
    bindStaticUi();

    try {
      validateConfiguration();
      resolveProfile();
      applyProfileText();
      setLoading("Loading map data…");

      const [payload] = await Promise.all([
        loadGeoJson(),
        loadGoogleMaps()
      ]);

      state.payload = normalizePayload(payload);
      state.metadata = state.payload.metadata || {};

      initializeMap();
      loadFeaturesIntoMap();
      buildRecordIndex();
      renderTaxonomySwitcher();
      renderFilters();
      configureLabels();
      activateTaxonomy(getRequestedTaxonomyId());
      applyUrlState();
      refreshMap({ updateUrl: false });
      fitInitialViewport();

      setLoading(null);
      dom.app.setAttribute("aria-busy", "false");
      exposePublicApi();
      debug("Application ready", { version: APP_VERSION, profile: state.profileId });
    } catch (error) {
      showError(error);
    }
  }

  function cacheDom() {
    dom.app = document.getElementById("app");
    dom.map = document.getElementById("map");
    dom.panel = document.getElementById("control-panel");
    dom.panelToggle = document.getElementById("panel-toggle");
    dom.panelBody = document.getElementById("panel-body");
    dom.title = document.getElementById("map-title");
    dom.subtitle = document.getElementById("map-subtitle");
    dom.taxonomySection = document.getElementById("taxonomy-switcher-section");
    dom.taxonomySwitcher = document.getElementById("taxonomy-switcher");
    dom.filterControls = document.getElementById("filter-controls");
    dom.labelSection = document.getElementById("label-section");
    dom.labelToggle = document.getElementById("label-toggle");
    dom.labelToggleText = document.getElementById("label-toggle-text");
    dom.clearFilters = document.getElementById("clear-filters");
    dom.legendSection = document.getElementById("legend-section");
    dom.legendTitle = document.getElementById("legend-title");
    dom.legend = document.getElementById("map-legend");
    dom.legendReset = document.getElementById("legend-reset");
    dom.legendHelp = document.getElementById("legend-help");
    dom.featureStatus = document.getElementById("feature-status");
    dom.dataStatus = document.getElementById("data-status");
    dom.loadingOverlay = document.getElementById("loading-overlay");
    dom.loadingMessage = document.getElementById("loading-message");
    dom.errorPanel = document.getElementById("error-panel");
    dom.errorMessage = document.getElementById("error-message");
    dom.errorDetailsWrap = document.getElementById("error-details-wrap");
    dom.errorDetails = document.getElementById("error-details");
  }

  function bindStaticUi() {
    dom.panelToggle.addEventListener("click", () => {
      const collapsed = dom.panel.classList.toggle("is-collapsed");
      dom.panelToggle.setAttribute("aria-expanded", String(!collapsed));
      dom.panelToggle.title = collapsed ? "Expand map controls" : "Collapse map controls";
      dom.panelToggle.querySelector("[aria-hidden='true']").textContent = collapsed ? "+" : "−";
      dom.panelToggle.querySelector(".sr-only").textContent = collapsed ? "Expand map controls" : "Collapse map controls";
    });

    dom.clearFilters.addEventListener("click", clearFilters);
    dom.labelToggle.addEventListener("change", () => {
      if (state.labelLayer) {
        state.labelLayer.setEnabled(dom.labelToggle.checked);
      }
      refreshMap();
    });

    dom.legendReset.addEventListener("click", () => {
      activateAllCategories();
      refreshMap();
    });

    dom.taxonomySwitcher.addEventListener("change", () => {
      activateTaxonomy(dom.taxonomySwitcher.value);
      refreshMap();
    });
  }

  function validateConfiguration() {
    if (!state.runtime || typeof state.runtime !== "object") {
      throw new Error("runtime.js did not define HAM_RUNTIME.");
    }
    if (!Object.keys(state.fields).length) {
      throw new Error("fields.js did not define any fields.");
    }
    if (!Object.keys(state.taxonomies).length) {
      throw new Error("taxonomies.js did not define any taxonomies.");
    }
    if (!Object.keys(state.profiles).length) {
      throw new Error("profiles.js did not define any profiles.");
    }
  }

  function resolveProfile() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("view") || state.runtime.defaultProfile || "default";
    const fallbackId = state.runtime.defaultProfile && state.profiles[state.runtime.defaultProfile]
      ? state.runtime.defaultProfile
      : Object.keys(state.profiles)[0];

    state.profileId = state.profiles[requested] ? requested : fallbackId;
    state.profile = state.profiles[state.profileId];

    if (!state.profile) {
      throw new Error("No valid map profile is configured.");
    }
  }

  function applyProfileText() {
    dom.title.textContent = state.profile.title || "Habersham Active Mapping";
    document.title = state.profile.title || "Habersham Active Mapping";

    if (state.profile.subtitle) {
      dom.subtitle.textContent = state.profile.subtitle;
      dom.subtitle.hidden = false;
    } else {
      dom.subtitle.hidden = true;
    }
  }

  async function loadGeoJson() {
    const configuredUrl = state.profile.dataUrl || state.runtime.dataUrl;
    if (!configuredUrl) {
      throw new Error("No GeoJSON data URL is configured in runtime.js or the active profile.");
    }

    const url = new URL(configuredUrl, window.location.href);
    if (state.runtime.cacheBustData) {
      url.searchParams.set("v", String(Date.now()));
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`GeoJSON request failed with HTTP ${response.status}: ${url.pathname}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`The data file is not valid JSON: ${error.message}`);
    }
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("The GeoJSON response is empty or invalid.");
    }

    if (payload.type === "FeatureCollection" && Array.isArray(payload.features)) {
      return payload;
    }

    if (payload.geojson && payload.geojson.type === "FeatureCollection") {
      return {
        ...payload.geojson,
        metadata: payload.metadata || payload.geojson.metadata || {}
      };
    }

    throw new Error("The data file must be a GeoJSON FeatureCollection.");
  }

  function loadGoogleMaps() {
    if (window.google && window.google.maps) {
      return Promise.resolve();
    }

    const apiKey = String(state.runtime.googleMapsApiKey || "").trim();
    if (!apiKey || apiKey.includes("REPLACE_WITH")) {
      throw new Error(
        "A Google Maps browser API key has not been configured. Open runtime.js and provide the Google Maps browser key."
      );
    }

    return new Promise((resolve, reject) => {
      const callbackName = `__hamGoogleMapsReady_${Date.now()}`;
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Google Maps did not finish loading within 25 seconds."));
      }, 25000);

      function cleanup() {
        window.clearTimeout(timeout);
        try {
          delete window[callbackName];
        } catch (_) {
          window[callbackName] = undefined;
        }
      }

      window[callbackName] = () => {
        cleanup();
        resolve();
      };

      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: apiKey,
        callback: callbackName,
        loading: "async",
        v: "weekly",
        language: state.runtime.googleLanguage || "en",
        region: state.runtime.googleRegion || "US"
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(new Error("Google Maps JavaScript API failed to load. Verify the API key, referrer restrictions and API enablement."));
      };
      document.head.appendChild(script);
    });
  }

  function initializeMap() {
    const mapConfig = state.profile.map || {};
    const options = {
      center: mapConfig.fallbackCenter || { lat: 32.40, lng: -80.75 },
      zoom: mapConfig.fallbackZoom || 15,
      mapTypeId: mapConfig.mapTypeId || "satellite",
      mapTypeControl: Boolean(mapConfig.mapTypeControl),
      streetViewControl: mapConfig.streetViewControl !== false,
      fullscreenControl: mapConfig.fullscreenControl !== false,
      zoomControl: mapConfig.zoomControl !== false,
      clickableIcons: false,
      tilt: 0,
      gestureHandling: "greedy"
    };

    if (state.runtime.googleMapId) {
      options.mapId = state.runtime.googleMapId;
    }

    state.map = new google.maps.Map(dom.map, options);
    state.infoWindow = new google.maps.InfoWindow({ maxWidth: 390 });
    state.labelLayer = createLotLabelLayer(state.map);

    state.map.data.addListener("mouseover", (event) => {
      const visual = state.visualByFeature.get(event.feature);
      if (!visual || !visual.visible) return;
      const style = state.profile.style || {};
      state.map.data.overrideStyle(event.feature, {
        fillOpacity: numberOr(style.hoverFillOpacity, 0.74),
        strokeWeight: numberOr(style.hoverStrokeWeight, 2.5),
        zIndex: 5
      });
    });

    state.map.data.addListener("mouseout", (event) => {
      state.map.data.revertStyle(event.feature);
    });

    state.map.data.addListener("click", (event) => {
      const visual = state.visualByFeature.get(event.feature);
      if (!visual || !visual.visible) return;
      openFeaturePopup(event.feature, event.latLng);
    });

    state.map.addListener("zoom_changed", () => {
      if (state.labelLayer) state.labelLayer.draw();
    });
  }

  function loadFeaturesIntoMap() {
    const validFeatures = [];
    let missingGeometry = 0;

    for (const feature of state.payload.features) {
      if (feature && feature.geometry) {
        validFeatures.push(feature);
      } else {
        missingGeometry += 1;
      }
    }

    state.metadata.detectedMissingGeometry = missingGeometry;
    const collection = { type: "FeatureCollection", features: validFeatures };
    state.features = state.map.data.addGeoJson(collection);

    if (!state.features.length) {
      throw new Error(
        "The GeoJSON file loaded, but it contains no polygon features. Replace habersham-parcels.geojson in the repository root with the current Publisher.gs output."
      );
    }
  }

  function buildRecordIndex() {
    state.records = state.features.map((feature, index) => {
      const properties = {};
      feature.forEachProperty((value, key) => {
        properties[key] = value;
      });

      const baseId = String(feature.getId() ?? getFieldValue(properties, "hscrFaceId") ?? `feature-${index + 1}`);
      const record = {
        feature,
        properties,
        index,
        id: `${baseId}:${index}`,
        center: getPreferredLabelPoint(properties) || getFeatureCenter(feature)
      };

      state.recordByFeature.set(feature, record);
      return record;
    });
  }

  function renderTaxonomySwitcher() {
    const options = (state.profile.taxonomyOptions || [state.profile.taxonomy]).filter((id) => state.taxonomies[id]);
    dom.taxonomySwitcher.replaceChildren();

    for (const taxonomyId of options) {
      const option = document.createElement("option");
      option.value = taxonomyId;
      option.textContent = state.taxonomies[taxonomyId].label || taxonomyId;
      dom.taxonomySwitcher.appendChild(option);
    }

    dom.taxonomySection.hidden = options.length <= 1;
  }

  function renderFilters() {
    state.filterState = {};
    state.filterControls.clear();
    dom.filterControls.replaceChildren();

    const filters = Array.isArray(state.profile.filters) ? state.profile.filters : [];

    for (const filterConfigRaw of filters) {
      const filterConfig = typeof filterConfigRaw === "string"
        ? { field: filterConfigRaw }
        : filterConfigRaw;
      const fieldId = filterConfig.field;
      const field = state.fields[fieldId];

      if (!field) {
        console.warn(`Unknown filter field: ${fieldId}`);
        continue;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "field-control";

      const label = document.createElement("label");
      const inputId = `filter-${fieldId}`;
      label.className = "control-label";
      label.htmlFor = inputId;
      label.textContent = filterConfig.label || field.label || fieldId;

      const controlType = filterConfig.control || field.control || "select";
      let control;

      if (controlType === "search") {
        control = document.createElement("input");
        control.type = "search";
        control.placeholder = filterConfig.placeholder || field.placeholder || `Search ${field.label || fieldId}…`;
        control.autocomplete = "off";
        control.addEventListener("input", () => scheduleFilterRefresh(fieldId, control.value));
      } else {
        control = document.createElement("select");
        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = filterConfig.allLabel || field.allLabel || "All";
        control.appendChild(allOption);

        const values = getUniqueFieldValues(fieldId);
        for (const value of values) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          control.appendChild(option);
        }

        control.addEventListener("change", () => {
          state.filterState[fieldId] = control.value;
          refreshMap();
        });
      }

      control.id = inputId;
      control.className = "control-input";
      control.dataset.field = fieldId;
      state.filterState[fieldId] = "";
      state.filterControls.set(fieldId, control);

      wrapper.append(label, control);
      dom.filterControls.appendChild(wrapper);
    }
  }

  function scheduleFilterRefresh(fieldId, value) {
    state.filterState[fieldId] = value;
    window.clearTimeout(state.updateTimer);
    state.updateTimer = window.setTimeout(() => refreshMap(), 120);
  }

  function getUniqueFieldValues(fieldId) {
    const values = new Map();
    for (const record of state.records) {
      const value = getFieldValue(record.properties, fieldId);
      if (isBlank(value)) continue;
      const display = String(value).trim();
      values.set(normalize(display), display);
    }

    return [...values.values()].sort(naturalCompare);
  }

  function configureLabels() {
    const labelConfig = state.profile.labels || {};
    if (!labelConfig.toggleVisible) {
      dom.labelSection.hidden = true;
      dom.labelToggle.checked = false;
      state.labelLayer.setEnabled(false);
      return;
    }

    dom.labelSection.hidden = false;
    dom.labelToggle.checked = labelConfig.enabledByDefault !== false;
    dom.labelToggleText.textContent = `Show ${labelConfig.label || "Lot Number"} labels`;
    state.labelLayer.setMinimumZoom(numberOr(labelConfig.minimumZoom, 17));
    state.labelLayer.setEnabled(dom.labelToggle.checked);
  }

  function getRequestedTaxonomyId() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("taxonomy");
    const allowed = state.profile.taxonomyOptions || [state.profile.taxonomy];
    return requested && allowed.includes(requested) ? requested : state.profile.taxonomy;
  }

  function activateTaxonomy(taxonomyId) {
    const taxonomyDefinition = state.taxonomies[taxonomyId];
    if (!taxonomyDefinition) {
      throw new Error(`Unknown taxonomy: ${taxonomyId}`);
    }

    state.taxonomyId = taxonomyId;
    state.taxonomy = resolveTaxonomy(taxonomyDefinition);
    state.activeCategoryKeys = new Set(state.taxonomy.categories.map((category) => category.key));
    dom.taxonomySwitcher.value = taxonomyId;
    dom.legendTitle.textContent = `Map Key — ${state.taxonomy.label}`;
  }

  function resolveTaxonomy(definition) {
    const type = definition.type || "categorical";
    if (type === "range") return resolveRangeTaxonomy(definition);
    return resolveCategoricalTaxonomy(definition);
  }

  function resolveCategoricalTaxonomy(definition) {
    const categories = [];
    const categoryByNormalized = new Map();
    const configured = Array.isArray(definition.classes) ? definition.classes : [];

    configured.forEach((item, index) => {
      const category = {
        key: `configured:${index}:${normalize(item.value || item.label)}`,
        value: item.value,
        label: item.label || String(item.value),
        color: item.color || FALLBACK_COLOR,
        configured: true,
        showWhenZero: Boolean(definition.showZeroCountConfiguredClasses)
      };
      categories.push(category);

      const accepted = [item.value, ...(item.aliases || [])];
      for (const value of accepted) {
        categoryByNormalized.set(normalize(value), category);
      }
    });

    if (definition.includeObservedValues !== false) {
      const unmatched = new Map();
      for (const record of state.records) {
        const value = getFieldValue(record.properties, definition.field);
        if (isBlank(value)) continue;
        const normalized = normalize(value);
        if (!categoryByNormalized.has(normalized)) {
          unmatched.set(normalized, String(value).trim());
        }
      }

      const palette = definition.autoPalette || ["#457b9d", "#2a9d8f", "#e76f51", "#8e6caa", "#6a994e"];
      [...unmatched.entries()]
        .sort((a, b) => naturalCompare(a[1], b[1]))
        .forEach(([normalized, display], index) => {
          const category = {
            key: `observed:${normalized}`,
            value: display,
            label: display,
            color: palette[index % palette.length],
            configured: false,
            showWhenZero: false
          };
          categories.push(category);
          categoryByNormalized.set(normalized, category);
        });
    }

    const fallback = {
      key: "__fallback__",
      value: null,
      label: definition.fallback?.label || "Not Assigned",
      color: definition.fallback?.color || FALLBACK_COLOR,
      configured: true,
      showWhenZero: false,
      fallback: true
    };
    categories.push(fallback);

    return {
      type: "categorical",
      label: definition.label || definition.field,
      field: definition.field,
      categories,
      categoryByNormalized,
      fallback
    };
  }

  function resolveRangeTaxonomy(definition) {
    const categories = (definition.classes || []).map((item, index) => ({
      key: `range:${index}`,
      label: item.label || `Range ${index + 1}`,
      color: item.color || FALLBACK_COLOR,
      min: item.min,
      max: item.max,
      showWhenZero: Boolean(definition.showZeroCountConfiguredClasses),
      configured: true
    }));

    const fallback = {
      key: "__fallback__",
      label: definition.fallback?.label || "Not Assigned",
      color: definition.fallback?.color || FALLBACK_COLOR,
      fallback: true,
      showWhenZero: false
    };
    categories.push(fallback);

    return {
      type: "range",
      label: definition.label || definition.field,
      field: definition.field,
      categories,
      fallback
    };
  }

  function classifyRecord(record) {
    const raw = getFieldValue(record.properties, state.taxonomy.field);
    if (state.taxonomy.type === "range") {
      const numeric = toNumber(raw);
      if (numeric === null) return state.taxonomy.fallback;
      return state.taxonomy.categories.find((category) => {
        if (category.fallback) return false;
        const passesMin = category.min === null || category.min === undefined || numeric >= category.min;
        const passesMax = category.max === null || category.max === undefined || numeric <= category.max;
        return passesMin && passesMax;
      }) || state.taxonomy.fallback;
    }

    if (isBlank(raw)) return state.taxonomy.fallback;
    return state.taxonomy.categoryByNormalized.get(normalize(raw)) || state.taxonomy.fallback;
  }

  function refreshMap(options = {}) {
    if (!state.map || !state.taxonomy) return;

    const counts = new Map(state.taxonomy.categories.map((category) => [category.key, 0]));
    const visibleLabelItems = [];
    let baseVisibleCount = 0;
    let finalVisibleCount = 0;

    for (const record of state.records) {
      const passesFilters = recordPassesFilters(record);
      const category = classifyRecord(record);

      if (passesFilters) {
        baseVisibleCount += 1;
        counts.set(category.key, (counts.get(category.key) || 0) + 1);
      }

      const categoryVisible = state.activeCategoryKeys.has(category.key);
      const visible = passesFilters && categoryVisible;
      if (visible) {
        finalVisibleCount += 1;
        const labelText = getFieldValue(record.properties, state.profile.labels?.field || "lotNumber");
        const showLabelValue = getFieldValue(record.properties, "showLabel");
        const labelAllowed = isBlank(showLabelValue) || !["false", "0", "no"].includes(normalize(showLabelValue));
        if (labelAllowed && !isBlank(labelText) && record.center) {
          visibleLabelItems.push({
            id: record.id,
            position: record.center,
            text: String(labelText)
          });
        }
      }

      state.visualByFeature.set(record.feature, { visible, category });
    }

    state.map.data.setStyle((feature) => styleFeature(feature));
    renderLegend(counts);
    updateLabels(visibleLabelItems);
    updateFeatureStatus(finalVisibleCount, baseVisibleCount);

    if (state.selectedFeature) {
      const selectedVisual = state.visualByFeature.get(state.selectedFeature);
      if (!selectedVisual?.visible) {
        state.infoWindow.close();
        state.selectedFeature = null;
      }
    }

    if (options.updateUrl !== false) updateUrlState();
  }

  function recordPassesFilters(record) {
    for (const [fieldId, selectedValue] of Object.entries(state.filterState)) {
      if (isBlank(selectedValue)) continue;
      const fieldValue = getFieldValue(record.properties, fieldId);
      const control = state.filterControls.get(fieldId);
      const isSearch = control?.tagName === "INPUT";

      if (isSearch) {
        if (!normalize(fieldValue).includes(normalize(selectedValue))) return false;
      } else if (normalize(fieldValue) !== normalize(selectedValue)) {
        return false;
      }
    }
    return true;
  }

  function styleFeature(feature) {
    const visual = state.visualByFeature.get(feature);
    const style = state.profile.style || {};

    if (!visual?.visible) {
      return { visible: false };
    }

    return {
      visible: true,
      clickable: true,
      fillColor: visual.category.color || FALLBACK_COLOR,
      fillOpacity: numberOr(style.fillOpacity, 0.5),
      strokeColor: style.strokeColor || "#ffffff",
      strokeOpacity: numberOr(style.strokeOpacity, 1),
      strokeWeight: numberOr(style.strokeWeight, 1.4),
      zIndex: 1
    };
  }

  function renderLegend(counts) {
    const legendConfig = state.profile.legend || {};
    if (legendConfig.visible === false) {
      dom.legendSection.hidden = true;
      return;
    }

    dom.legendSection.hidden = false;
    dom.legendHelp.hidden = !(legendConfig.interactive && legendConfig.showHelp);
    dom.legend.replaceChildren();

    const categoriesToShow = state.taxonomy.categories.filter((category) => {
      const count = counts.get(category.key) || 0;
      return count > 0 || category.showWhenZero;
    });

    for (const category of categoriesToShow) {
      const count = counts.get(category.key) || 0;
      const row = document.createElement(legendConfig.interactive ? "button" : "div");
      row.className = "legend-row";
      if (legendConfig.interactive) {
        row.type = "button";
        row.classList.add("is-interactive");
        row.setAttribute("aria-pressed", String(state.activeCategoryKeys.has(category.key)));
        row.title = `Toggle ${category.label}`;
        row.addEventListener("click", (event) => {
          if (event.shiftKey) {
            state.activeCategoryKeys = new Set([category.key]);
          } else if (state.activeCategoryKeys.has(category.key)) {
            state.activeCategoryKeys.delete(category.key);
          } else {
            state.activeCategoryKeys.add(category.key);
          }
          refreshMap();
        });
      }

      if (!state.activeCategoryKeys.has(category.key)) {
        row.classList.add("is-disabled");
      }

      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.backgroundColor = category.color;
      swatch.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "legend-label";
      label.textContent = category.label;

      const countElement = document.createElement("span");
      countElement.className = "legend-count";
      countElement.textContent = legendConfig.showCounts === false ? "" : String(count);

      row.append(swatch, label, countElement);
      dom.legend.appendChild(row);
    }

    const allShown = state.taxonomy.categories.every((category) => state.activeCategoryKeys.has(category.key));
    dom.legendReset.hidden = allShown || !legendConfig.interactive;
  }

  function activateAllCategories() {
    state.activeCategoryKeys = new Set(state.taxonomy.categories.map((category) => category.key));
  }

  function updateLabels(items) {
    const config = state.profile.labels || {};
    const max = numberOr(config.maximumLabels, 1200);
    state.labelLayer.setEnabled(Boolean(config.toggleVisible && dom.labelToggle.checked));
    state.labelLayer.setItems(items.slice(0, max));
  }

  function updateFeatureStatus(visibleCount, baseVisibleCount) {
    const total = state.records.length;
    let text = `${visibleCount.toLocaleString()} of ${total.toLocaleString()} map features visible.`;

    if (baseVisibleCount !== visibleCount) {
      text += ` ${baseVisibleCount.toLocaleString()} match the property filters before map-key selections.`;
    }
    dom.featureStatus.textContent = text;

    const details = [];
    const publishedAt =
      state.metadata.publishedAt ||
      state.metadata.published_at ||
      state.metadata.generatedAt ||
      state.metadata.generated_at;
    if (publishedAt) {
      const formatted = formatDateTime(publishedAt);
      if (formatted) details.push(`Data published ${formatted}.`);
    }

    const missingGeometry = numberOrNull(
      state.metadata.missingGeometryCount ??
      state.metadata.missing_geometry_count ??
      state.metadata.crmRecordsWithoutGeometry ??
      state.metadata.crm_records_without_geometry ??
      state.metadata.skipped_count ??
      state.metadata.detectedMissingGeometry
    );
    if (missingGeometry && missingGeometry > 0) {
      details.push(`${missingGeometry.toLocaleString()} source records lack polygon geometry.`);
    }

    const retained = numberOrNull(
      state.metadata.retainedUnassignedCount ??
      state.metadata.retained_unassigned_count ??
      state.metadata.acceptedUnassignedCount ??
      state.metadata.accepted_unassigned_count
    );
    if (retained && retained > 0) {
      details.push(`${retained.toLocaleString()} unassigned parcel faces retained.`);
    }

    if (state.metadata.note) details.push(String(state.metadata.note));
    dom.dataStatus.textContent = details.join(" ");
  }

  function clearFilters() {
    for (const [fieldId, control] of state.filterControls.entries()) {
      control.value = "";
      state.filterState[fieldId] = "";
    }
    activateAllCategories();
    if (state.profile.labels?.toggleVisible) {
      dom.labelToggle.checked = state.profile.labels.enabledByDefault !== false;
    }
    refreshMap();
  }

  function openFeaturePopup(feature, position) {
    const record = state.recordByFeature.get(feature);
    if (!record) return;

    state.selectedFeature = feature;
    state.infoWindow.setContent(buildPopupContent(record));
    state.infoWindow.setPosition(position || record.center);
    state.infoWindow.open({ map: state.map, shouldFocus: false });
  }

  function buildPopupContent(record) {
    const root = document.createElement("div");
    root.className = "ham-info-window";

    const title = document.createElement("h2");
    const propertyName = getFieldValue(record.properties, "propertyName");
    const lotNumber = getFieldValue(record.properties, "lotNumber");
    title.textContent = !isBlank(propertyName)
      ? String(propertyName)
      : !isBlank(lotNumber)
        ? `Lot ${lotNumber}`
        : "Property Details";
    root.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "ham-popup-grid";
    let imageUrl = "";

    for (const fieldConfigRaw of state.profile.popupFields || []) {
      const fieldConfig = typeof fieldConfigRaw === "string"
        ? { field: fieldConfigRaw }
        : fieldConfigRaw;
      const fieldId = fieldConfig.field;
      const definition = state.fields[fieldId];
      if (!definition) continue;

      const value = getFieldValue(record.properties, fieldId);
      if (isBlank(value) && fieldConfig.hideEmpty !== false) continue;

      if ((fieldConfig.format || definition.format) === "image") {
        if (isSafeHttpUrl(value)) imageUrl = String(value);
        continue;
      }

      const row = document.createElement("div");
      row.className = "ham-popup-row";

      const label = document.createElement("div");
      label.className = "ham-popup-label";
      label.textContent = fieldConfig.label || definition.label || fieldId;

      const output = document.createElement("div");
      output.className = "ham-popup-value";
      appendFormattedValue(output, value, fieldConfig.format || definition.format);

      row.append(label, output);
      grid.appendChild(row);
    }

    root.appendChild(grid);

    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = "Open full-size property image";

      const image = document.createElement("img");
      image.className = "ham-popup-image";
      image.src = imageUrl;
      image.alt = lotNumber ? `Property image for lot ${lotNumber}` : "Property image";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => link.remove());

      link.appendChild(image);
      root.appendChild(link);
    }

    return root;
  }

  function appendFormattedValue(container, value, format) {
    if (format === "currency") {
      const numeric = toNumber(value);
      container.textContent = numeric === null
        ? String(value ?? "")
        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(numeric);
      return;
    }

    if (format === "link" && isSafeHttpUrl(value)) {
      const anchor = document.createElement("a");
      anchor.href = String(value);
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Open record";
      container.appendChild(anchor);
      return;
    }

    if (isSafeHttpUrl(value)) {
      const anchor = document.createElement("a");
      anchor.href = String(value);
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = String(value);
      container.appendChild(anchor);
      return;
    }

    container.textContent = isBlank(value) ? "—" : String(value);
  }

  function fitInitialViewport() {
    const mapConfig = state.profile.map || {};
    if (mapConfig.fitToData === false) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;
    for (const record of state.records) {
      record.feature.getGeometry()?.forEachLatLng((latLng) => {
        bounds.extend(latLng);
        hasPoint = true;
      });
    }

    if (!hasPoint) return;
    state.map.fitBounds(bounds, numberOr(mapConfig.fitPadding, 34));

    const maxInitialZoom = numberOrNull(mapConfig.maxInitialZoom);
    if (maxInitialZoom !== null) {
      google.maps.event.addListenerOnce(state.map, "idle", () => {
        if (state.map.getZoom() > maxInitialZoom) {
          state.map.setZoom(maxInitialZoom);
        }
      });
    }
  }

  function applyUrlState() {
    const params = new URLSearchParams(window.location.search);

    for (const [fieldId, control] of state.filterControls.entries()) {
      const value = params.get(fieldId) || params.get(`f.${fieldId}`) || "";
      if (!value) continue;

      if (control.tagName === "SELECT") {
        const match = [...control.options].find((option) => normalize(option.value) === normalize(value));
        if (match) {
          control.value = match.value;
          state.filterState[fieldId] = match.value;
        }
      } else {
        control.value = value;
        state.filterState[fieldId] = value;
      }
    }

    if (params.get("labels") === "0" && !dom.labelSection.hidden) {
      dom.labelToggle.checked = false;
    }
  }

  function updateUrlState() {
    const params = new URLSearchParams(window.location.search);
    params.set("view", state.profileId);

    if ((state.profile.taxonomyOptions || []).length > 1) {
      params.set("taxonomy", state.taxonomyId);
    } else {
      params.delete("taxonomy");
    }

    for (const fieldId of state.filterControls.keys()) {
      params.delete(fieldId);
      params.delete(`f.${fieldId}`);
      const value = state.filterState[fieldId];
      if (!isBlank(value)) params.set(fieldId, value);
    }

    if (!dom.labelSection.hidden && !dom.labelToggle.checked) {
      params.set("labels", "0");
    } else {
      params.delete("labels");
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }

  function getFieldValue(properties, fieldId) {
    const definition = state.fields[fieldId];
    if (!definition) return properties?.[fieldId];

    const keys = definition.keys || [fieldId];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(properties, key) && !isBlank(properties[key])) {
        return properties[key];
      }
    }

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) return properties[key];
    }
    return undefined;
  }

  function getPreferredLabelPoint(properties) {
    const latitude = toNumber(getFieldValue(properties, "labelLatitude"));
    const longitude = toNumber(getFieldValue(properties, "labelLongitude"));
    if (latitude === null || longitude === null) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return new google.maps.LatLng(latitude, longitude);
  }

  function getFeatureCenter(feature) {
    const geometry = feature.getGeometry();
    if (!geometry) return null;
    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;
    geometry.forEachLatLng((latLng) => {
      bounds.extend(latLng);
      hasPoint = true;
    });
    return hasPoint ? bounds.getCenter() : null;
  }

  function createLotLabelLayer(map) {
    class LotLabelLayer extends google.maps.OverlayView {
      constructor(targetMap) {
        super();
        this.container = null;
        this.items = [];
        this.elements = new Map();
        this.enabled = true;
        this.minimumZoom = 17;
        this.setMap(targetMap);
      }

      onAdd() {
        this.container = document.createElement("div");
        this.container.className = "ham-lot-label-layer";
        this.getPanes().overlayLayer.appendChild(this.container);
        this.syncElements();
        this.draw();
      }

      onRemove() {
        this.elements.clear();
        this.container?.remove();
        this.container = null;
      }

      setItems(items) {
        this.items = items || [];
        this.syncElements();
        this.draw();
      }

      setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        this.draw();
      }

      setMinimumZoom(zoom) {
        this.minimumZoom = zoom;
        this.draw();
      }

      syncElements() {
        if (!this.container) return;
        const currentIds = new Set(this.items.map((item) => item.id));

        for (const [id, element] of this.elements.entries()) {
          if (!currentIds.has(id)) {
            element.remove();
            this.elements.delete(id);
          }
        }

        for (const item of this.items) {
          let element = this.elements.get(item.id);
          if (!element) {
            element = document.createElement("div");
            element.className = "ham-lot-label";
            this.container.appendChild(element);
            this.elements.set(item.id, element);
          }
          element.textContent = item.text;
        }
      }

      draw() {
        if (!this.container) return;
        const currentMap = this.getMap();
        const shouldShow = this.enabled && currentMap && currentMap.getZoom() >= this.minimumZoom;
        this.container.style.display = shouldShow ? "block" : "none";
        if (!shouldShow) return;

        const projection = this.getProjection();
        if (!projection) return;

        for (const item of this.items) {
          const point = projection.fromLatLngToDivPixel(item.position);
          const element = this.elements.get(item.id);
          if (!point || !element) continue;
          element.style.left = `${Math.round(point.x)}px`;
          element.style.top = `${Math.round(point.y)}px`;
        }
      }
    }

    return new LotLabelLayer(map);
  }

  function exposePublicApi() {
    window.HabershamMap = Object.freeze({
      version: APP_VERSION,
      getProfile: () => state.profileId,
      getTaxonomy: () => state.taxonomyId,
      setTaxonomy: (taxonomyId) => {
        const allowed = state.profile.taxonomyOptions || [state.profile.taxonomy];
        if (!allowed.includes(taxonomyId)) {
          throw new Error(`Taxonomy '${taxonomyId}' is not allowed by profile '${state.profileId}'.`);
        }
        activateTaxonomy(taxonomyId);
        refreshMap();
      },
      clearFilters,
      fitToData: fitInitialViewport,
      refresh: () => refreshMap()
    });
  }

  function setLoading(message) {
    if (!message) {
      dom.loadingOverlay.hidden = true;
      return;
    }
    dom.loadingMessage.textContent = message;
    dom.loadingOverlay.hidden = false;
  }

  function showError(error) {
    console.error(error);
    setLoading(null);
    dom.app.setAttribute("aria-busy", "false");
    dom.errorMessage.textContent = error?.message || "An unexpected error occurred.";
    const details = error?.stack || "";
    if (details) {
      dom.errorDetails.textContent = details;
      dom.errorDetailsWrap.hidden = false;
    }
    dom.errorPanel.hidden = false;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function normalize(value) {
    return String(value ?? "").trim().toLocaleLowerCase("en-US");
  }

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === "";
  }

  function naturalCompare(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (isBlank(value)) return null;
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function isSafeHttpUrl(value) {
    if (isBlank(value)) return false;
    try {
      const url = new URL(String(value), window.location.href);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function debug(...args) {
    if (state.runtime.debug) console.debug("[HabershamMap]", ...args);
  }
})();
