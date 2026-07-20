# Canonical GeoJSON contract

The map expects a GeoJSON `FeatureCollection`. Each map face must be a `Feature` with polygon or multipolygon geometry.

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "schemaVersion": "1.0",
    "publishedAt": "2026-07-20T17:00:00Z",
    "missingGeometryCount": 5,
    "retainedUnassignedCount": 5
  },
  "features": [
    {
      "type": "Feature",
      "id": "HSCR-001038",
      "properties": {
        "hscrFaceId": "HSCR-001038",
        "dealId": "123456789",
        "propertyName": "Lot 1038",
        "lotNumber": "1038",
        "dmpNumber": "131",
        "propertyType": "Single Family",
        "status": "Available",
        "stage": "Listed For Sale",
        "builder": "Example Builder",
        "architect": "Example Architect",
        "price": 429900,
        "primaryImage": "https://example.com/image.jpg",
        "dealUrl": "https://example.com/deal/123456789"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-80.75, 32.40], [-80.749, 32.40], [-80.749, 32.401], [-80.75, 32.40]]]
      }
    }
  ]
}
```

## Canonical properties

- `hscrFaceId`: stable face identifier used to join geometry to the Pipeline deal.
- `dealId`: PipelineCRM deal identifier.
- `propertyName`: deal or property display name.
- `lotNumber`: lot/parcel display number.
- `dmpNumber`: optional DMP number.
- `propertyType`: property-use taxonomy value.
- `status`: deal/lot status value.
- `stage`: Pipeline stage or construction stage value.
- `builder`: builder display name.
- `architect`: architect display name.
- `price`: numeric asking/list price.
- `primaryImage`: public HTTPS image URL.
- `dealUrl`: optional authorized record URL.

The front end also recognizes several legacy property-name aliases in `config/fields.js`, but Publisher.gs should emit the canonical names above.

## Geometry rules

- Coordinates must be WGS84 longitude/latitude (`EPSG:4326`).
- Close polygon rings by repeating the first coordinate as the last coordinate.
- Do not publish a `Feature` with malformed geometry.
- Report omitted CRM records in `metadata.missingGeometryCount`.
- Preserve accepted parcel faces with no current CRM assignment as features with blank CRM properties; the map-key fallback class will display them.
