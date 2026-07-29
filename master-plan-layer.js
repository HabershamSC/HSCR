(() => {
  "use strict";

  const LAYER_SCRIPT_VERSION = "9.0.0-zero-adjustment";
  const DEFAULT_CONFIG_URL = "./master-plan-overlay.json";
  const READY_TIMEOUT_MS = 30000;
  const READY_POLL_MS = 50;

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

      overlay = new google.maps.GroundOverlay(
        normalized.imageUrl,
        normalized.bounds,
        {
          clickable: false,
          opacity: normalized.opacity
        }
      );

      return overlay;
    };

    const setBaseLayer = (layerId, options = {}) => {
      const useMasterPlan = isMasterPlanLayerId(layerId, normalized.id);

      if (useMasterPlan) {
        map.setMapTypeId(normalized.underlayMapType);
        ensureOverlay().setMap(map);
        controls.select.value = "master-plan";
        activeLayer = "master-plan";
      } else {
        if (overlay) overlay.setMap(null);
        map.setMapTypeId(normalized.underlayMapType);
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
      setBaseLayer,
      setOpacity: (value) => {
        const opacity = clamp(Number(value), 0, 1);
        normalized.opacity = opacity;
        if (overlay) overlay.setOpacity(opacity);
        return opacity;
      }
    });
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
      window.HAM_RUNTIME?.masterPlanOverlayConfigUrl ||
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

    return response.json();
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
      opacity: clamp(Number(config.opacity ?? 1), 0, 1),
      defaultVisible: Boolean(config.default_visible),
      underlayMapType: normalizeMapType(config.underlay_map_type)
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

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }
})();
