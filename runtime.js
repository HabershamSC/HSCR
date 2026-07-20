/*
 * Habersham Active Mapping — root-level deployment configuration.
 * All application files and the Publisher GeoJSON live in the repository root.
 */
window.HAM_RUNTIME = Object.freeze({
  // Browser key used by the existing working Habersham map.
  // Restrict it to the Maps JavaScript API and approved website referrers.
  googleMapsApiKey: "AIzaSyBxUzPZYFuNou4HVQlVcrvkIUgHWbGuJd0",

  // Current Publisher.gs output in the repository root.
  dataUrl: "./habersham-parcels.geojson",

  defaultProfile: "default",
  googleMapId: "",
  googleLanguage: "en",
  googleRegion: "US",

  // Prevent stale map data after Publisher or GitHub updates.
  cacheBustData: true,

  // Set true only while troubleshooting in the browser console.
  debug: false
});
