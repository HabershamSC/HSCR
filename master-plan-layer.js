(() => {
  "use strict";

  const LAYER_SCRIPT_VERSION = "1.1.0";
  const DEFAULT_CONFIG_URL = "./master-plan-overlay.json";
  const READY_TIMEOUT_MS = 30000;
  const READY_POLL_MS = 50;
  const METERS_PER_DEGREE_LATITUDE = 111320;

  document.addEventListener("DOMContentLoaded", () => {
    initializeMasterPlanLayer().catch((error) => {
      console.warn("Master-plan layer was not initialized:", error);
    });
  });

  async function initializeMasterPlanLayer() {
    const mapApi = await waitForHabershamMapApi();
    const map = mapApi.getMap();

    if (!map) {
      throw new Error("HabershamMap.getMap() did not return the Google Maps instance.");
    }

    const config = await loadOverlayConfig();

    if (!config || config.enabled === false) {
      return;
    }

    const normalized = normalizeOverlayConfig(config);
    const controls = createBaseLayerControl(normalized);
    let overlay = null;
    let activeLayer = "satellite";

    const ensureOverlay = () => {
      if (overlay) return overlay;

      overlay = createRotatableImageOverlay({
        imageUrl: normalized.imageUrl,
        bounds: normalized.bounds,
        opacity: normalized.opacity,
        calibration: normalized.calibration
      });

      return overlay;
    };

    const setBaseLayer = (layerId, options = {}) => {
      const useMasterPlan = isMasterPlanLayerId(layerId, normalized.id);

      map.setMapTypeId(normalized.underlayMapType);

      if (useMasterPlan) {
        ensureOverlay().setMap(map);
        controls.select.value = "master-plan";
        activeLayer = "master-plan";
      } else {
        if (overlay) overlay.setMap(null);
        controls.select.value = "satellite";
        activeLayer = "satellite";
      }

      controls.status.textContent = useMasterPlan
        ? `${normalized.label} is displayed beneath parcel boundaries.`
        : "Google satellite imagery is displayed.";

      if (options.updateUrl !== false) {
        updateUrlState(activeLayer);
      }

      return activeLayer;
    };

    controls.select.addEventListener("change", () => {
      setBaseLayer(controls.select.value);
    });

    const requestedLayer = new URLSearchParams(window.location.search).get("base");
    const initialLayer = requestedLayer ||
      (normalized.defaultVisible ? "master-plan" : "satellite");

    setBaseLayer(initialLayer, { updateUrl: false });

    window.addEventListener("popstate", () => {
      const layer = new URLSearchParams(window.location.search).get("base") ||
        (normalized.defaultVisible ? "master-plan" : "satellite");
      setBaseLayer(layer, { updateUrl: false });
    });

    window.HabershamMasterPlan = Object.freeze({
      version: LAYER_SCRIPT_VERSION,
      getConfig: () => ({ ...config }),
      getBaseLayer: () => activeLayer,
      getCalibration: () => ({ ...normalized.calibration }),
      setBaseLayer,
      setOpacity: (value) => {
        const opacity = clamp(Number(value), 0, 1);
        normalized.opacity = opacity;
        if (overlay) overlay.setOpacity(opacity);
        return opacity;
      },
      setCalibration: (changes) => {
        normalized.calibration = normalizeCalibration({
          ...normalized.calibration,
          ...(changes && typeof changes === "object" ? changes : {})
        });
        ensureOverlay().setCalibration(normalized.calibration);
        return { ...normalized.calibration };
      }
    });
  }

  function createRotatableImageOverlay(options) {
    class RotatableImageOverlay extends google.maps.OverlayView {
      constructor(imageUrl, bounds, overlayOptions) {
        super();
        this.imageUrl = imageUrl;
        this.bounds = { ...bounds };
        this.opacity = overlayOptions.opacity;
        this.calibration = { ...overlayOptions.calibration };
        this.container = null;
        this.image = null;
      }

      onAdd() {
        const container = document.createElement("div");
        container.className = "master-plan-image-overlay";
        container.style.position = "absolute";
        container.style.pointerEvents = "none";
        container.style.transformOrigin = "50% 50%";
        container.style.willChange = "transform, left, top, width, height";
        container.style.opacity = String(this.opacity);

        const image = document.createElement("img");
        image.src = this.imageUrl;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        image.draggable = false;
        image.style.display = "block";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.userSelect = "none";
        image.style.pointerEvents = "none";

        container.appendChild(image);
        this.container = container;
        this.image = image;

        const panes = this.getPanes();
        if (!panes || !panes.mapPane) {
          throw new Error("Google Maps mapPane is unavailable for the Master Plan overlay.");
        }
        panes.mapPane.appendChild(container);
      }

      draw() {
        if (!this.container) return;

        const projection = this.getProjection();
        if (!projection) return;

        const adjusted = calculateCalibratedBounds(this.bounds, this.calibration);
        const northWest = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(adjusted.north, adjusted.west)
        );
        const southEast = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(adjusted.south, adjusted.east)
        );

        if (!northWest || !southEast) return;

        const left = Math.min(northWest.x, southEast.x);
        const top = Math.min(northWest.y, southEast.y);
        const width = Math.abs(southEast.x - northWest.x);
        const height = Math.abs(southEast.y - northWest.y);

        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;
        this.container.style.transform = `rotate(${this.calibration.rotation_degrees}deg)`;
      }

      onRemove() {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.image = null;
      }

      setOpacity(value) {
        this.opacity = clamp(Number(value), 0, 1);
        if (this.container) {
          this.container.style.opacity = String(this.opacity);
        }
      }

      setCalibration(calibration) {
        this.calibration = normalizeCalibration(calibration);
        this.draw();
      }

      getCalibration() {
        return { ...this.calibration };
      }
    }

    return new RotatableImageOverlay(
      options.imageUrl,
      options.bounds,
      {
        opacity: options.opacity,
        calibration: options.calibration
      }
    );
  }

  function calculateCalibratedBounds(bounds, calibration) {
    const centerLatitude = (bounds.north + bounds.south) / 2;
    const centerLongitude = (bounds.east + bounds.west) / 2;
    const longitudeMetersPerDegree = Math.max(
      1,
      METERS_PER_DEGREE_LATITUDE * Math.cos(centerLatitude * Math.PI / 180)
    );

    const shiftedCenterLatitude = centerLatitude +
      calibration.offset_north_m / METERS_PER_DEGREE_LATITUDE;
    const shiftedCenterLongitude = centerLongitude +
      calibration.offset_east_m / longitudeMetersPerDegree;

    const halfLatitudeSpan = (bounds.north - bounds.south) * calibration.scale_y / 2;
    const halfLongitudeSpan = (bounds.east - bounds.west) * calibration.scale_x / 2;

    return {
      north: shiftedCenterLatitude + halfLatitudeSpan,
      south: shiftedCenterLatitude - halfLatitudeSpan,
      east: shiftedCenterLongitude + halfLongitudeSpan,
      west: shiftedCenterLongitude - halfLongitudeSpan
    };
  }

  async function waitForHabershamMapApi() {
    const started = Date.now();

    while (Date.now() - started < READY_TIMEOUT_MS) {
      const api = window.HabershamMap;

      if (api && typeof api.getMap === "function") {
        return api;
      }

      await delay(READY_POLL_MS);
    }

    throw new Error(
      "Timed out waiting for HabershamMap.getMap(). Add getMap: () => state.map " +
      "to exposePublicApi() in map-app.js."
    );
  }

  async function loadOverlayConfig() {
    const configuredUrl =
      (window.HAM_RUNTIME && window.HAM_RUNTIME.masterPlanOverlayConfigUrl) ||
      DEFAULT_CONFIG_URL;

    const url = new URL(configuredUrl, window.location.href);
    url.searchParams.set("v", String(Date.now()));

    const response = await fetch(url.toString(), { cache: "no-store" });

    if (response.status === 404) {
      console.info("Master-plan overlay configuration was not found; layer disabled.");
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Master-plan overlay configuration failed with HTTP ${response.status}.`
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Master-plan overlay configuration is invalid JSON: ${error.message}`);
    }
  }

  function normalizeOverlayConfig(config) {
    const bounds = config.bounds || {};
    const north = finiteNumber(bounds.north, "bounds.north");
    const south = finiteNumber(bounds.south, "bounds.south");
    const east = finiteNumber(bounds.east, "bounds.east");
    const west = finiteNumber(bounds.west, "bounds.west");

    if (north <= south || east <= west) {
      throw new Error(
        "Master-plan bounds are invalid: north must exceed south and east must exceed west."
      );
    }

    const imageUrl = String(config.image_url || "").trim();

    if (!imageUrl) {
      throw new Error("Master-plan image_url is blank.");
    }

    return {
      id: String(config.id || "master-plan-2025"),
      label: String(config.label || "Master Plan"),
      imageUrl: new URL(imageUrl, window.location.href).toString(),
      bounds: { north, south, east, west },
      calibration: normalizeCalibration(config.calibration),
      opacity: clamp(Number(config.opacity === undefined ? 1 : config.opacity), 0, 1),
      defaultVisible: Boolean(config.default_visible),
      underlayMapType: normalizeMapType(config.underlay_map_type)
    };
  }

  function normalizeCalibration(calibration) {
    const value = calibration && typeof calibration === "object" ? calibration : {};

    return {
      rotation_degrees: finiteNumberOrDefault(value.rotation_degrees, 0),
      offset_east_m: finiteNumberOrDefault(value.offset_east_m, 0),
      offset_north_m: finiteNumberOrDefault(value.offset_north_m, 0),
      scale_x: positiveNumberOrDefault(value.scale_x, 1),
      scale_y: positiveNumberOrDefault(value.scale_y, 1)
    };
  }

  function createBaseLayerControl(config) {
    const displaySection = document.querySelector(".display-section");
    const clearButton = document.getElementById("clear-filters");

    if (!displaySection || !clearButton) {
      throw new Error("The Display panel could not be found in index.html.");
    }

    const wrapper = document.createElement("div");
    wrapper.id = "base-layer-section";
    wrapper.className = "field-control master-plan-layer-control";

    const label = document.createElement("label");
    label.className = "control-label";
    label.htmlFor = "base-layer-select";
    label.textContent = "Base Map";

    const select = document.createElement("select");
    select.id = "base-layer-select";
    select.className = "control-input";

    const satelliteOption = document.createElement("option");
    satelliteOption.value = "satellite";
    satelliteOption.textContent = "Google Satellite";

    const planOption = document.createElement("option");
    planOption.value = "master-plan";
    planOption.textContent = config.label;

    select.append(satelliteOption, planOption);

    const status = document.createElement("p");
    status.className = "master-plan-layer-status";
    status.setAttribute("aria-live", "polite");

    wrapper.append(label, select, status);
    displaySection.insertBefore(wrapper, clearButton);

    injectControlStyles();

    return { wrapper, select, status };
  }

  function injectControlStyles() {
    if (document.getElementById("master-plan-layer-styles")) return;

    const style = document.createElement("style");
    style.id = "master-plan-layer-styles";
    style.textContent = `
      .master-plan-layer-control {
        margin: 0 0 9px;
        padding: 8px 9px;
        border: 1px solid #d8ddd9;
        border-radius: 6px;
        background: rgba(248, 250, 248, 0.85);
      }

      .master-plan-layer-status {
        margin: 5px 0 0;
        color: #5f6368;
        font-size: 10px;
        line-height: 1.35;
      }
    `;

    document.head.appendChild(style);
  }

  function updateUrlState(layerId) {
    const url = new URL(window.location.href);

    if (layerId === "master-plan") {
      url.searchParams.set("base", "plan");
    } else {
      url.searchParams.delete("base");
    }

    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  function isMasterPlanLayerId(value, configuredId) {
    const normalized = String(value || "").trim().toLowerCase();
    const configured = String(configuredId || "").trim().toLowerCase();

    return ["plan", "master-plan", "master_plan", configured].includes(normalized);
  }

  function normalizeMapType(value) {
    const normalized = String(value || "satellite").trim().toLowerCase();
    const allowed = new Set(["satellite", "roadmap", "hybrid", "terrain"]);
    return allowed.has(normalized) ? normalized : "satellite";
  }

  function finiteNumber(value, label) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      throw new Error(`Master-plan ${label} must be a finite number.`);
    }

    return number;
  }

  function finiteNumberOrDefault(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positiveNumberOrDefault(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }
})();
