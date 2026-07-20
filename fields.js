/*
 * Canonical field definitions.
 * `keys` permits a transition from legacy GeoJSON property names to the canonical names.
 */
window.HAM_FIELDS = Object.freeze({
  propertyName: {
    label: "Name",
    keys: ["propertyName", "Property Name", "name", "Name", "dealName", "Deal Name"],
    control: "search",
    placeholder: "Search name…"
  },

  lotNumber: {
    label: "Lot Number",
    keys: ["lotNumber", "Lot Number", "lot_number", "LOT_NUMBER", "lot", "Lot"],
    control: "select",
    placeholder: "Search lot…",
    allLabel: "All"
  },

  dmpNumber: {
    label: "DMP Number",
    keys: ["dmpNumber", "Dmp Number", "DMP Number", "dmp_number"]
  },

  propertyType: {
    label: "Property Type",
    keys: ["propertyType", "Property Type", "property_type", "type", "Type"],
    control: "select",
    allLabel: "All"
  },

  status: {
    label: "Status",
    keys: ["status", "Status", "lotStatus", "Lot Status", "lot_status", "LOT_STATUS", "dealStatus", "Deal Status", "deal_status"],
    control: "select",
    allLabel: "All"
  },

  stage: {
    label: "Stage",
    keys: ["stage", "Stage", "dealStage", "Deal Stage", "pipelineStage", "Pipeline Stage"],
    control: "select",
    allLabel: "All"
  },

  builder: {
    label: "Builder",
    keys: ["builder", "Builder", "builderName", "Builder Name"],
    control: "select",
    allLabel: "All"
  },

  architect: {
    label: "Architect",
    keys: ["architect", "Architect", "architectName", "Architect Name"],
    control: "select",
    allLabel: "All"
  },

  hscrFaceId: {
    label: "HSCR Face ID",
    keys: ["hscrFaceId", "HSCR Face ID", "hscr_face_id", "faceId", "Face ID", "feature_id", "geometry_face_id", "lot_id"]
  },

  dealId: {
    label: "Pipeline Deal ID",
    keys: ["dealId", "Deal ID", "deal_id", "pipelineDealId", "Pipeline Deal ID", "pipeline_id"]
  },

  price: {
    label: "Price",
    keys: ["price", "Price", "listPrice", "List Price", "amount", "Amount"],
    format: "currency"
  },

  primaryImage: {
    label: "Primary Image",
    keys: ["primaryImage", "Primary Image", "primary_image", "image", "Image", "image_url"],
    format: "image"
  },

  dealUrl: {
    label: "Pipeline Record",
    keys: ["dealUrl", "Deal URL", "deal_url", "pipelineUrl", "Pipeline URL", "pipeline_url", "recordUrl"],
    format: "link"
  },

  labelLatitude: {
    label: "Label Latitude",
    keys: ["labelLatitude", "label_latitude"]
  },

  labelLongitude: {
    label: "Label Longitude",
    keys: ["labelLongitude", "label_longitude"]
  },

  showLabel: {
    label: "Show Label",
    keys: ["showLabel", "show_label"]
  }
});
