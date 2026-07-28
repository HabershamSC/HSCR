(() => {
  "use strict";

  const APP_VERSION = "2.0.1-master-plan";
  const FALLBACK_COLOR = "#b8b8b8";
  const AUTO_PALETTE = [
    "#457b9d",
    "#2a9d8f",
    "#e76f51",
    "#8e6caa",
    "#6a994e",
    "#d4a72c",
    "#4e8098",
    "#a26769"
  ];

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

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
      exposePublicApi();

      setLoading(null);
      dom.app.setAttribute("aria-busy", "false");
      debug("Application ready", {
        version: APP_VERSION,
        profile: state.profileId,
        features: state.records.length
      });
    } catch (error) {
      showError(error);
    }
  }

  function cacheDom() {
    dom.app = requiredElement("app");
    dom.map = requiredElement("map");
    dom.panel = requiredElement("control-panel");
    dom.panelToggle = requiredElement("panel-toggle");
    dom.panelBody = requiredElement("panel-body");
    dom.title = requiredElement("map-title");
    dom.subtitle = requiredElement("map-subtitle");
    dom.taxonomySection = requiredElement("taxonomy-switcher-section");
    dom.taxonomySwitcher = requiredElement("taxonomy-switcher");
    dom.filterControlsPrimary = requiredElement("filter-controls-primary");
    dom.filterControlsSecondary = requiredElement("filter-controls-secondary");
    dom.moreFilters = requiredElement("more-filters");
    dom.labelSection = requiredElement("label-section");
    dom.labelToggle = requiredElement("label-toggle");
    dom.labelToggleText = requiredElement("label-toggle-text");
    dom.clearFilters = requiredElement("clear-filters");
    dom.legendSection = requiredElement("legend-section");
    dom.legendTitle = requiredElement("legend-title");
    dom.legend = requiredElement("map-legend");
    dom.legendReset = requiredElement("legend-reset");
    dom.legendHelp = requiredElement("legend-help");
    dom.featureStatus = requiredElement("feature-status");
    dom.dataStatus = requiredElement("data-status");
    dom.loadingOverlay = requiredElement("loading-overlay");
    dom.loadingMessage = requiredElement("loading-message");
    dom.errorPanel = requiredElement("error-panel");
    dom.errorMessage = requiredElement("error-message");
    dom.errorDetailsWrap = requiredElement("error-details-wrap");
    dom.errorDetails = requiredElement("error-details");
  }

  function requiredElement(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`index.html is missing required element #${id}.`);
    return element;
  }

  function bindStaticUi() {
    dom.panelToggle.addEventListener("click", () => {
      const collapsed = dom.panel.classList.toggle("is-collapsed");
      dom.panelToggle.setAttribute("aria-expanded", String(!collapsed));
      dom.panelToggle.title = collapsed
        ? "Expand map controls"
        : "Collapse map controls";

      const symbol = dom.panelToggle.querySelector("[aria-hidden='true']");
      const accessibleText = dom.panelToggle.querySelector(".sr-only");
      if (symbol) symbol.textContent = collapsed ? "+" : "−";
      if (accessibleText) {
        accessibleText.textContent = collapsed
          ? "Expand map controls"
          : "Collapse map controls";
      }
    });

    dom.clearFilters.addEventListener("click", clearFilters);

    dom.labelToggle.addEventListener("change", () => {
      if (state.labelLayer) state.labelLayer.setEnabled(dom.labelToggle.checked);
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
      throw new Error("fields.js did not define HAM_FIELDS.");
    }
    if (!Object.keys(state.taxonomies).length) {
      throw new Error("taxonomies.js did not define HAM_TAXONOMIES.");
    }
    if (!Object.keys(state.profiles).length) {
      throw new Error("profiles.js did not define HAM_PROFILES.");
    }
  }

  function resolveProfile() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("view") || state.runtime.defaultProfile || "default";
    const configuredDefault = state.runtime.defaultProfile;
    const fallbackId = configuredDefault && state.profiles[configuredDefault]
      ? configuredDefault
      : Object.keys(state.profiles)[0];

    state.profileId = state.profiles[requested] ? requested : fallbackId;
    state.profile = state.profiles[state.profileId];

    if (!state.profile) throw new Error("No valid map profile is configured.");
  }

  function applyProfileText() {
    dom.title.textContent = state.profile.title || "Habersham Active Mapping";
    document.title = state.profile.title || "Habersham Active Mapping";

    if (state.profile.subtitle) {
      dom.subtitle.textContent = state.profile.subtitle;
      dom.subtitle.hidden = false;
    } else {
      dom.subtitle.textContent = "";
      dom.subtitle.hidden = true;
    }
  }

  async function loadGeoJson() {
    const configuredUrl = state.profile.dataUrl || state.runtime.dataUrl;
    if (!configuredUrl) {
      throw new Error("No GeoJSON URL is configured in runtime.js or the active profile.");
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
      throw new Error(`The GeoJSON data is not valid JSON: ${error.message}`);
    }
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("The GeoJSON response is empty or invalid.");
    }

    if (payload.type === "FeatureCollection" && Array.isArray(payload.features)) {
      return payload;
    }

    if (payload.geojson?.type === "FeatureCollection") {
      return {
        ...payload.geojson,
        metadata: payload.metadata || payload.geojson.metadata || {}
      };
    }

    throw new Error("The data file must be a GeoJSON FeatureCollection.");
  }

  function loadGoogleMaps() {
    if (window.google?.maps) return Promise.resolve();

    const apiKey = String(state.runtime.googleMapsApiKey || "").trim();
    if (!apiKey || apiKey.includes("REPLACE_WITH")) {
      throw new Error(
        "A Google Maps browser API key has not been configured in runtime.js."
      );
    }

    return new Promise((resolve, reject) => {
      const callbackName = `__hamGoogleMapsReady_${Date.now()}`;
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Google Maps did not finish loading within 30 seconds."));
      }, 30000);

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

      const params = new URLSearchParams({
        key: apiKey,
        callback: callbackName,
        loading: "async",
        v: "weekly",
        language: state.runtime.googleLanguage || "en",
        region: state.runtime.googleRegion || "US"
      });

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(
          new Error(
            "Google Maps JavaScript API failed to load. Verify the browser key, website restrictions, API restriction, API enablement, and billing."
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  function initializeMap() {
    const mapConfig = state.profile.map || {};
    const options = {
      center: mapConfig.fallbackCenter || { lat: 32.4, lng: -80.75 },
      zoom: numberOr(mapConfig.fallbackZoom, 15),
      mapTypeId: mapConfig.mapTypeId || "satellite",
      mapTypeControl: Boolean(mapConfig.mapTypeControl),
      streetViewControl: mapConfig.streetViewControl !== false,
      fullscreenControl: mapConfig.fullscreenControl !== false,
      zoomControl: mapConfig.zoomControl !== false,
      clickableIcons: false,
      tilt: 0,
      gestureHandling: "greedy"
    };

    if (state.runtime.googleMapId) options.mapId = state.runtime.googleMapId;

    state.map = new google.maps.Map(dom.map, options);
    state.infoWindow = new google.maps.InfoWindow({ maxWidth: 390 });
    state.labelLayer = createLotLabelLayer(state.map);

    state.map.data.addListener("mouseover", (event) => {
      const visual = state.visualByFeature.get(event.feature);
      if (!visual?.visible) return;

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
      if (!visual?.visible || visual.clickable === false) return;
      openFeaturePopup(event.feature, event.latLng);
    });

    state.map.addListener("zoom_changed", () => {
      state.labelLayer?.draw();
    });
  }

  function loadFeaturesIntoMap() {
    const validFeatures = [];
    let missingGeometry = 0;

    for (const feature of state.payload.features) {
      if (feature?.geometry) validFeatures.push(feature);
      else missingGeometry += 1;
    }

    state.metadata.detectedMissingGeometry = missingGeometry;
    state.features = state.map.data.addGeoJson({
      type: "FeatureCollection",
      features: validFeatures
    });

    if (!state.features.length) {
      throw new Error(
        "The GeoJSON loaded, but it contains no polygon features. Replace habersham-parcels.geojson with current Publisher.gs output."
      );
    }
  }

  function buildRecordIndex() {
    state.records = state.features.map((feature, index) => {
      const properties = {};
      feature.forEachProperty((value, key) => {
        properties[key] = value;
      });

      const baseId = String(feature.getId() ?? `feature-${index + 1}`);
      const record = {
        feature,
        properties,
        index,
        id: `${baseId}:${index}`,
        center: getPreferredLabelPoint(properties) || getFeatureCenter(feature),
        hasPublicContent: hasPublicPopupContent(properties)
      };

      state.recordByFeature.set(feature, record);
      return record;
    });
  }

  function renderTaxonomySwitcher() {
    const configured = state.profile.taxonomyOptions || [state.profile.taxonomy];
    const options = configured.filter((id) => state.taxonomies[id]);

    dom.taxonomySwitcher.replaceChildren();

    for (const taxonomyId of options) {
      const option = document.createElement("option");
      option.value = taxonomyId;
      option.textContent = state.taxonomies[taxonomyId].label || taxonomyId;
      dom.taxonomySwitcher.appendChild(option);
    }

    dom.taxonomySection.hidden = options.length === 0;
  }

  function renderFilters() {
    state.filterState = {};
    state.filterControls.clear();
    dom.filterControlsPrimary.replaceChildren();
    dom.filterControlsSecondary.replaceChildren();

    const filters = Array.isArray(state.profile.filters) ? state.profile.filters : [];
    let secondaryCount = 0;

    for (const rawConfig of filters) {
      const config = typeof rawConfig === "string"
        ? { field: rawConfig }
        : rawConfig;
      const fieldId = config.field;
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
      label.textContent = config.label || field.label || fieldId;

      const controlType = config.control || field.control || "select";
      let control;

      if (controlType === "search") {
        control = document.createElement("input");
        control.type = "search";
        control.placeholder = config.placeholder || field.placeholder || `Search ${field.label || fieldId}…`;
        control.autocomplete = "off";
        control.addEventListener("input", () => {
          scheduleFilterRefresh(fieldId, control.value);
        });
      } else {
        control = document.createElement("select");

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = config.allLabel || field.allLabel || "All";
        control.appendChild(allOption);

        for (const value of getUniqueFieldValues(fieldId)) {
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

      if (config.section === "secondary") {
        dom.filterControlsSecondary.appendChild(wrapper);
        secondaryCount += 1;
      } else {
        dom.filterControlsPrimary.appendChild(wrapper);
      }
    }

    dom.moreFilters.hidden = secondaryCount === 0;
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
    const config = state.profile.labels || {};

    if (!config.toggleVisible) {
      dom.labelSection.hidden = true;
      dom.labelToggle.checked = false;
      state.labelLayer.setEnabled(false);
      return;
    }

    dom.labelSection.hidden = false;
    dom.labelToggle.checked = config.enabledByDefault !== false;
    dom.labelToggleText.textContent = `Show ${config.label || "Lot Number"} labels`;
    state.labelLayer.setMinimumZoom(numberOr(config.minimumZoom, 17));
    state.labelLayer.setEnabled(dom.labelToggle.checked);
  }

  function getRequestedTaxonomyId() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("taxonomy");
    const allowed = state.profile.taxonomyOptions || [state.profile.taxonomy];
    return requested && allowed.includes(requested)
      ? requested
      : state.profile.taxonomy;
  }

  function activateTaxonomy(taxonomyId) {
    const definition = state.taxonomies[taxonomyId];
    if (!definition) throw new Error(`Unknown taxonomy: ${taxonomyId}`);

    state.taxonomyId = taxonomyId;
    state.taxonomy = resolveTaxonomy(definition);
    state.activeCategoryKeys = new Set(
      state.taxonomy.categories.map((category) => category.key)
    );
    dom.taxonomySwitcher.value = taxonomyId;
    dom.legendTitle.textContent = `Map Key — ${state.taxonomy.label}`;
  }

  function resolveTaxonomy(definition) {
    const type = definition.type || "categorical";
    if (type === "range") return resolveRangeTaxonomy(definition);
    if (type === "date-range") return resolveDateRangeTaxonomy(definition);
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

      const palette = definition.autoPalette || AUTO_PALETTE;
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

  function resolveDateRangeTaxonomy(definition) {
    const categories = (definition.classes || []).map((item, index) => ({
      key: `date-range:${index}`,
      label: item.label || `Date Range ${index + 1}`,
      color: item.color || FALLBACK_COLOR,
      minAgeDays: item.minAgeDays,
      maxAgeDays: item.maxAgeDays,
      showWhenZero: Boolean(definition.showZeroCountConfiguredClasses),
      configured: true
    }));

    const fallback = {
      key: "__fallback__",
      label: definition.fallback?.label || "Date Not Assigned",
      color: definition.fallback?.color || FALLBACK_COLOR,
      fallback: true,
      showWhenZero: false
    };
    categories.push(fallback);

    return {
      type: "date-range",
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
        const passesMin = category.min == null || numeric >= category.min;
        const passesMax = category.max == null || numeric <= category.max;
        return passesMin && passesMax;
      }) || state.taxonomy.fallback;
    }

    if (state.taxonomy.type === "date-range") {
      const date = parseDateValue(raw);
      if (!date) return state.taxonomy.fallback;
      const ageDays = Math.max(
        0,
        Math.floor((Date.now() - date.getTime()) / 86400000)
      );

      return state.taxonomy.categories.find((category) => {
        if (category.fallback) return false;
        const passesMin = category.minAgeDays == null || ageDays >= category.minAgeDays;
        const passesMax = category.maxAgeDays == null || ageDays <= category.maxAgeDays;
        return passesMin && passesMax;
      }) || state.taxonomy.fallback;
    }

    if (isBlank(raw)) return state.taxonomy.fallback;
    return state.taxonomy.categoryByNormalized.get(normalize(raw)) || state.taxonomy.fallback;
  }

  function refreshMap(options = {}) {
    if (!state.map || !state.taxonomy) return;

    const counts = new Map(
      state.taxonomy.categories.map((category) => [category.key, 0])
    );
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

      const visible = passesFilters && state.activeCategoryKeys.has(category.key);
      if (visible) {
        finalVisibleCount += 1;

        const labelField = state.profile.labels?.field || "lotNumber";
        const labelText = getFieldValue(record.properties, labelField);
        const showLabelValue = getFieldValue(record.properties, "showLabel");
        const labelAllowed = isBlank(showLabelValue) ||
          !["false", "0", "no"].includes(normalize(showLabelValue));

        if (labelAllowed && !isBlank(labelText) && record.center) {
          visibleLabelItems.push({
            id: record.id,
            position: record.center,
            text: String(labelText)
          });
        }
      }

      state.visualByFeature.set(record.feature, {
        visible,
        category,
        clickable: record.hasPublicContent
      });
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

      const definition = state.fields[fieldId] || {};
      const control = state.filterControls.get(fieldId);
      const isSearch = control?.tagName === "INPUT";

      if (Array.isArray(definition.searchFields) && definition.searchFields.length) {
        const matchesAny = definition.searchFields.some((searchFieldId) =>
          normalize(getFieldValue(record.properties, searchFieldId)).includes(
            normalize(selectedValue)
          )
        );
        if (!matchesAny) return false;
        continue;
      }

      const fieldValue = getFieldValue(record.properties, fieldId);
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

    if (!visual?.visible) return { visible: false };

    return {
      visible: true,
      clickable: visual.clickable !== false,
      fillColor: visual.category.color || FALLBACK_COLOR,
      fillOpacity: numberOr(style.fillOpacity, 0.5),
      strokeColor: style.strokeColor || "#ffffff",
      strokeOpacity: numberOr(style.strokeOpacity, 1),
      strokeWeight: numberOr(style.strokeWeight, 1.4),
      zIndex: 1
    };
  }

  function renderLegend(counts) {
    const config = state.profile.legend || {};

    if (config.visible === false) {
      dom.legendSection.hidden = true;
      return;
    }

    dom.legendSection.hidden = false;
    dom.legendHelp.hidden = !(config.interactive && config.showHelp);
    dom.legend.replaceChildren();

    const categoriesToShow = state.taxonomy.categories.filter((category) => {
      const count = counts.get(category.key) || 0;
      return count > 0 || category.showWhenZero;
    });

    for (const category of categoriesToShow) {
      const count = counts.get(category.key) || 0;
      const row = document.createElement(config.interactive ? "button" : "div");
      row.className = "legend-row";

      if (config.interactive) {
        row.type = "button";
        row.classList.add("is-interactive");
        row.setAttribute(
          "aria-pressed",
          String(state.activeCategoryKeys.has(category.key))
        );
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
      countElement.textContent = config.showCounts === false ? "" : String(count);

      row.append(swatch, label, countElement);
      dom.legend.appendChild(row);
    }

    const allShown = state.taxonomy.categories.every((category) =>
      state.activeCategoryKeys.has(category.key)
    );
    dom.legendReset.hidden = allShown || !config.interactive;
  }

  function activateAllCategories() {
    state.activeCategoryKeys = new Set(
      state.taxonomy.categories.map((category) => category.key)
    );
  }

  function updateLabels(items) {
    const config = state.profile.labels || {};
    const maximum = numberOr(config.maximumLabels, 1200);
    state.labelLayer.setEnabled(Boolean(config.toggleVisible && dom.labelToggle.checked));
    state.labelLayer.setItems(items.slice(0, maximum));
  }

  function updateFeatureStatus(visibleCount, baseVisibleCount) {
    const total = state.records.length;
    let text = `${visibleCount.toLocaleString()} of ${total.toLocaleString()} map features visible.`;

    if (baseVisibleCount !== visibleCount) {
      text += ` ${baseVisibleCount.toLocaleString()} match the current filters.`;
    }

    dom.featureStatus.textContent = text;

    const details = [];
    const missingGeometry = firstFiniteNumber(
      state.metadata.detectedMissingGeometry,
      state.metadata.missingGeometryCount,
      state.metadata.missing_geometry_count
    );
    const retainedUnassigned = firstFiniteNumber(
      state.metadata.retainedUnassignedCount,
      state.metadata.retained_unassigned_count,
      state.metadata.acceptedUnassignedCount,
      state.metadata.accepted_unassigned_count,
      state.metadata.unassignedMasterFaceCount,
      state.metadata.unassigned_master_face_count
    );

    if (missingGeometry > 0) {
      details.push(`${missingGeometry.toLocaleString()} records lack geometry.`);
    }
    if (retainedUnassigned > 0) {
      details.push(`${retainedUnassigned.toLocaleString()} unassigned parcel faces retained.`);
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
    if (!record?.hasPublicContent) return;

    state.selectedFeature = feature;
    state.infoWindow.setContent(buildPopupContent(record));
    state.infoWindow.setPosition(position || record.center);
    state.infoWindow.open({ map: state.map, shouldFocus: false });
  }

  function buildPopupContent(record) {
    const root = document.createElement("article");
    root.className = "ham-info-window";

    const propertyName = getFieldValue(record.properties, "propertyName");
    const lotNumber = getFieldValue(record.properties, "lotNumber");
    const dmpNumber = getFieldValue(record.properties, "dmpNumber");

    const header = document.createElement("header");
    header.className = "ham-popup-header";

    const title = document.createElement("h2");
    title.textContent = !isBlank(propertyName)
      ? String(propertyName)
      : !isBlank(lotNumber)
        ? `Lot ${lotNumber}`
        : "Property Details";
    header.appendChild(title);

    const metaParts = [];
    if (!isBlank(lotNumber)) metaParts.push(`Lot ${lotNumber}`);
    if (!isBlank(dmpNumber)) metaParts.push(`DMP# ${dmpNumber}`);

    if (metaParts.length) {
      const meta = document.createElement("p");
      meta.className = "ham-popup-meta";
      meta.textContent = metaParts.join(" · ");
      header.appendChild(meta);
    }

    const badgeValues = [
      getFieldValue(record.properties, "lotStatus"),
      getFieldValue(record.properties, "stage"),
      getFieldValue(record.properties, "listingStatus")
    ].filter((value, index, values) =>
      !isBlank(value) &&
      values.findIndex((candidate) => normalize(candidate) === normalize(value)) === index
    );

    if (badgeValues.length) {
      const badges = document.createElement("div");
      badges.className = "ham-popup-badges";
      for (const value of badgeValues) {
        const badge = document.createElement("span");
        badge.className = "ham-popup-badge";
        badge.textContent = String(value);
        badges.appendChild(badge);
      }
      header.appendChild(badges);
    }

    root.appendChild(header);

    const detailFieldIds = new Set([
      "platDimensions",
      "propertyType",
      "squareFootageHeated",
      "amount",
      "updated",
      "neighborhoodZoning",
      "neighborhoodDistrict",
      "architect",
      "builder",
      "planName"
    ]);

    const grid = document.createElement("dl");
    grid.className = "ham-popup-grid";
    const actions = [];
    let imageUrl = "";

    for (const rawConfig of state.profile.popupFields || []) {
      const config = typeof rawConfig === "string"
        ? { field: rawConfig }
        : rawConfig;
      const fieldId = config.field;
      const definition = state.fields[fieldId];
      if (!definition) continue;

      const value = getFieldValue(record.properties, fieldId);
      if (isBlank(value)) continue;

      const format = config.format || definition.format;

      if (format === "image") {
        if (isSafeHttpUrl(value)) imageUrl = String(value);
        continue;
      }

      if (format === "link") {
        if (isSafeHttpUrl(value)) {
          actions.push({
            href: String(value),
            label: config.buttonLabel || definition.buttonLabel || `Open ${definition.label}`
          });
        }
        continue;
      }

      if (!detailFieldIds.has(fieldId)) continue;

      const row = document.createElement("div");
      row.className = "ham-popup-row";

      const label = document.createElement("dt");
      label.className = "ham-popup-label";
      label.textContent = config.label || definition.label || fieldId;

      const output = document.createElement("dd");
      output.className = "ham-popup-value";
      appendFormattedValue(output, value, format);

      row.append(label, output);
      grid.appendChild(row);
    }

    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "ham-popup-image";
      image.src = imageUrl;
      image.alt = propertyName ? String(propertyName) : "Property image";
      image.loading = "lazy";
      root.appendChild(image);
    }

    if (grid.childElementCount) root.appendChild(grid);

    if (actions.length) {
      const actionWrap = document.createElement("div");
      actionWrap.className = "ham-popup-actions";

      for (const action of actions) {
        const link = document.createElement("a");
        link.className = "ham-popup-action";
        link.href = action.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = action.label;
        actionWrap.appendChild(link);
      }

      root.appendChild(actionWrap);
    }

    return root;
  }

  function appendFormattedValue(element, value, format) {
    if (format === "currency") {
      const number = toNumber(value);
      element.textContent = number === null
        ? String(value)
        : new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
          }).format(number);
      return;
    }

    if (format === "squareFeet") {
      const number = toNumber(value);
      element.textContent = number === null
        ? String(value)
        : `${new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0
          }).format(number)} sq ft`;
      return;
    }

    if (format === "date") {
      element.textContent = formatDateTime(value) || String(value);
      return;
    }

    element.textContent = String(value);
  }

  function hasPublicPopupContent(properties) {
    return (state.profile.popupFields || []).some((rawConfig) => {
      const config = typeof rawConfig === "string"
        ? { field: rawConfig }
        : rawConfig;
      return !isBlank(getFieldValue(properties, config.field));
    });
  }

  function getFieldValue(properties, fieldId) {
    const definition = state.fields[fieldId];
    if (!definition) return properties[fieldId];

    const keys = [fieldId, ...(definition.keys || [])];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(properties, key) && !isBlank(properties[key])) {
        return properties[key];
      }
    }

    return "";
  }

  function getPreferredLabelPoint(properties) {
    const latitude = toNumber(getFieldValue(properties, "labelLatitude"));
    const longitude = toNumber(getFieldValue(properties, "labelLongitude"));

    if (latitude === null || longitude === null) return null;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

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

  function fitInitialViewport() {
    const config = state.profile.map || {};
    if (config.fitToData === false) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    for (const record of state.records) {
      record.feature.getGeometry()?.forEachLatLng((latLng) => {
        bounds.extend(latLng);
        hasPoint = true;
      });
    }

    if (!hasPoint) return;

    state.map.fitBounds(bounds, numberOr(config.fitPadding, 34));
    const maxInitialZoom = numberOrNull(config.maxInitialZoom);

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
        const match = [...control.options].find(
          (option) => normalize(option.value) === normalize(value)
        );
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

  function createLotLabelLayer(map) {
    class LotLabelLayer extends google.maps.OverlayView {
      constructor(currentMap) {
        super();
        this.enabled = true;
        this.minimumZoom = 17;
        this.items = [];
        this.elements = new Map();
        this.container = null;
        this.setMap(currentMap);
      }

      onAdd() {
        this.container = document.createElement("div");
        this.container.className = "ham-lot-label-layer";
        this.getPanes().overlayMouseTarget.appendChild(this.container);
        this.syncElements();
      }

      onRemove() {
        this.container?.remove();
        this.container = null;
        this.elements.clear();
      }

      setEnabled(value) {
        this.enabled = Boolean(value);
        this.draw();
      }

      setMinimumZoom(value) {
        this.minimumZoom = numberOr(value, 17);
        this.draw();
      }

      setItems(items) {
        this.items = Array.isArray(items) ? items : [];
        this.syncElements();
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
        const shouldShow = Boolean(
          this.enabled &&
          currentMap &&
          currentMap.getZoom() >= this.minimumZoom
        );

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
      getMap: () => state.map,
      getProfile: () => state.profileId,
      getTaxonomy: () => state.taxonomyId,
      setTaxonomy: (taxonomyId) => {
        const allowed = state.profile.taxonomyOptions || [state.profile.taxonomy];
        if (!allowed.includes(taxonomyId)) {
          throw new Error(
            `Taxonomy '${taxonomyId}' is not allowed by profile '${state.profileId}'.`
          );
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
    dom.app?.setAttribute("aria-busy", "false");
    dom.errorMessage.textContent = error?.message || "An unexpected error occurred.";

    const details = error?.stack || "";
    if (details) {
      dom.errorDetails.textContent = details;
      dom.errorDetailsWrap.hidden = false;
    }

    dom.errorPanel.hidden = false;
  }

  function parseDateValue(value) {
    if (isBlank(value)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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
    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (isBlank(value)) return null;
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function firstFiniteNumber(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return 0;
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
