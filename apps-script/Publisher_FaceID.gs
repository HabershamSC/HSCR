/**
 * HSCR Face-ID Publisher
 * PipelineCRM/CRM_DEALS_RAW is authoritative for property attributes.
 * data/master-parcel-faces.geojson is authoritative for parcel geometry.
 * Join key: HSCR Face ID <-> feature.properties.face_id
 *
 * IMPORTANT: This publisher FAILS CLOSED for missing geometry.
 * It never substitutes Lat/Long centroids for parcel polygons.
 */

const HSCR = Object.freeze({
  spreadsheetId: '1ved7oTZAR1PNFKrAgOmTwAx0DdjcoPEPnvHZCP02msU',
  sourceSheet: 'CRM_DEALS_RAW',
  faceIdHeader: 'HSCR Face ID',
  geometryUrl: 'https://raw.githubusercontent.com/habershamsc/HSCR/main/data/master-parcel-faces.geojson',
  outputPath: 'habersham-parcels.geojson'
});

function buildHabershamParcelsFromFaceRegistry_() {
  const ss = SpreadsheetApp.openById(HSCR.spreadsheetId);
  const sh = ss.getSheetByName(HSCR.sourceSheet);
  if (!sh) throw new Error('Missing sheet: ' + HSCR.sourceSheet);

  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) throw new Error('No CRM rows found.');

  const headers = values[0].map(String);
  const rows = values.slice(1);
  const col = indexHeaders_(headers);

  if (col[HSCR.faceIdHeader] == null) {
    throw new Error('Missing required column: ' + HSCR.faceIdHeader);
  }

  const registry = loadFaceRegistry_();
  const seenDeals = new Set();
  const missing = [];
  const features = [];

  rows.forEach((row, i) => {
    const dealId = clean_(row[col['Deal ID']] || row[col['ID']]);
    if (!dealId || seenDeals.has(dealId)) return;
    seenDeals.add(dealId);

    const faceId = clean_(row[col[HSCR.faceIdHeader]]).toUpperCase();
    if (!faceId) {
      // Amenities/unplanned records may intentionally have no parcel face.
      return;
    }

    const geometry = registry.get(faceId);
    if (!geometry) {
      missing.push({
        sheetRow: i + 2,
        dealId,
        lotNumber: clean_(row[col['Lot Number']]),
        name: clean_(row[col['Name']]),
        faceId
      });
      return;
    }

    features.push({
      type: 'Feature',
      id: dealId,
      properties: {
        deal_id: dealId,
        name: clean_(row[col['Name']]),
        lot_number: clean_(row[col['Lot Number']]),
        dmp_number: clean_(row[col['DMP#']]),
        hscr_face_id: faceId,
        lot_status: clean_(row[col['Lot Status']]),
        property_type: clean_(row[col['Property Type']]),
        stage: clean_(row[col['Stage']]),
        listing_status: clean_(row[col['Listing Status']]),
        amount: clean_(row[col['Amount']]),
        neighborhood_zoning: clean_(row[col['Neighborhood Zoning']]),
        neighborhood_district: clean_(row[col['Neighborhood District']]),
        architect: clean_(row[col['Architect']]),
        builder: clean_(row[col['Builder']]),
        plan_name: clean_(row[col['Habersham Plan Name']]),
        arb_folder_link: clean_(row[col['ARB Folder Link (Drive)']]),
        photo_archive: clean_(row[col['Photo Archive (Drive)']]),
        image_url: clean_(row[col['Image URL']]),
        primary_contact_id: clean_(row[col['Primary Contact ID']]),
        company_id: clean_(row[col['Company ID']])
      },
      geometry: geometry
    });
  });

  if (missing.length) {
    throw new Error(
      'PUBLISH ABORTED: ' + missing.length +
      ' CRM records reference Face IDs missing from the master registry.\n' +
      JSON.stringify(missing, null, 2)
    );
  }

  return {
    type: 'FeatureCollection',
    metadata: {
      generated_at: new Date().toISOString(),
      property_source: 'PipelineCRM via CRM_DEALS_RAW',
      geometry_source: 'data/master-parcel-faces.geojson',
      join_key: 'HSCR Face ID',
      feature_count: features.length
    },
    features
  };
}

function loadFaceRegistry_() {
  const res = UrlFetchApp.fetch(HSCR.geometryUrl, {muteHttpExceptions: true});
  if (res.getResponseCode() !== 200) {
    throw new Error('Unable to load geometry registry: HTTP ' + res.getResponseCode());
  }
  const fc = JSON.parse(res.getContentText());
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('Master face registry is not a GeoJSON FeatureCollection.');
  }

  const map = new Map();
  fc.features.forEach((f, i) => {
    const p = f.properties || {};
    const faceId = clean_(p.face_id || p.hscr_face_id || f.id).toUpperCase();
    if (!faceId) throw new Error('Registry feature ' + i + ' has no face_id.');
    if (!f.geometry || !/Polygon$/.test(f.geometry.type || '')) {
      throw new Error('Registry ' + faceId + ' has invalid polygon geometry.');
    }
    if (map.has(faceId)) throw new Error('Duplicate Face ID in registry: ' + faceId);
    map.set(faceId, f.geometry);
  });
  return map;
}

function indexHeaders_(headers) {
  const out = {};
  headers.forEach((h, i) => { if (h) out[String(h).trim()] = i; });
  return out;
}

function clean_(v) {
  return v == null ? '' : String(v).trim();
}

function auditFaceRegistry_() {
  const fc = buildHabershamParcelsFromFaceRegistry_();
  Logger.log(JSON.stringify(fc.metadata, null, 2));
  return fc.metadata;
}
