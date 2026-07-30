/*
 * Habersham Active Mapping — runtime configuration
 */
window.HAM_RUNTIME = Object.freeze({
  googleMapsApiKey: "AIzaSyBxUzPZYFuNou4HVQlVcrvkIUgHWbGuJd0",

  // Live endpoint will be inserted later.
  liveDataUrl: "",

  // Emergency snapshot stored in GitHub.
  fallbackDataUrl: "./habersham-parcels.geojson",

  // Check for fresh data every 30 seconds.
  refreshIntervalMs: 30000,

  defaultProfile: "default",
  googleMapId: "",
  googleLanguage: "en",
  googleRegion: "US",

  cacheBustData: true,
  debug: false
});
