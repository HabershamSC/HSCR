/*
 * Habersham Active Mapping public field contract.
 *
 * Only approved public CRM fields and the four label-rendering fields are defined.
 * Private identifiers, internal IDs and unknown CRM columns are intentionally absent.
 */
window.HAM_FIELDS = Object.freeze({
  searchAll: {
    label: "Search",
    control: "search",
    placeholder: "Name, Lot Number, or DMP#…",
    searchFields: ["propertyName", "lotNumber", "dmpNumber"]
  },

  propertyName: {
    label: "Name",
    keys: ["name", "propertyName", "Property Name", "Name"],
    control: "search"
  },

  lotNumber: {
    label: "Lot Number",
    keys: ["lot_number", "lotNumber", "Lot Number", "LOT_NUMBER", "lot", "Lot"],
    control: "select",
    allLabel: "All"
  },

  dmpNumber: {
    label: "DMP#",
    keys: ["dmp_number", "dmpNumber", "DMP Number", "DMP#"]
  },

  lotStatus: {
    label: "Lot Status",
    keys: ["lot_status", "lotStatus", "Lot Status", "status", "Status"],
    control: "select",
    allLabel: "All"
  },

  platDimensions: {
    label: "Plat Dimensions",
    keys: ["plat_dimensions", "platDimensions", "Plat Dimensions"],
    control: "select",
    allLabel: "All"
  },

  propertyType: {
    label: "Property Type",
    keys: ["property_type", "propertyType", "Property Type", "type", "Type"],
    control: "select",
    allLabel: "All"
  },

  squareFootageHeated: {
    label: "Square Footage (Heated)",
    keys: [
      "square_footage_heated",
      "squareFootageHeated",
      "Square Footage (Heated)",
      "heated_square_footage",
      "heated_sq_ft"
    ],
    format: "squareFeet"
  },

  stage: {
    label: "Stage",
    keys: ["stage", "Stage", "dealStage", "Deal Stage"],
    control: "select",
    allLabel: "All"
  },

  listingStatus: {
    label: "Listing Status",
    keys: ["listing_status", "listingStatus", "Listing Status"],
    control: "select",
    allLabel: "All"
  },

  amount: {
    label: "Amount",
    keys: ["amount", "Amount", "price", "Price", "listing_price"],
    format: "currency"
  },

  updated: {
    label: "Updated",
    keys: ["updated", "Updated", "updated_at", "last_updated"],
    format: "date"
  },

  neighborhoodZoning: {
    label: "Neighborhood Zoning",
    keys: ["neighborhood_zoning", "neighborhoodZoning", "Neighborhood Zoning", "zoning"],
    control: "select",
    allLabel: "All"
  },

  neighborhoodDistrict: {
    label: "Neighborhood District",
    keys: ["neighborhood_district", "neighborhoodDistrict", "Neighborhood District", "district"],
    control: "select",
    allLabel: "All"
  },

  architect: {
    label: "Architect",
    keys: ["architect", "Architect"],
    control: "select",
    allLabel: "All"
  },

  builder: {
    label: "Builder",
    keys: ["builder", "Builder"],
    control: "select",
    allLabel: "All"
  },

  planName: {
    label: "Habersham Plan Name",
    keys: ["habersham_plan_name", "planName", "Habersham Plan Name", "plan_name"],
    control: "select",
    allLabel: "All"
  },

  arbFolderLink: {
    label: "ARB Folder",
    keys: ["arb_folder_link", "arbFolderLink", "ARB Folder Link (Drive)"],
    format: "link",
    buttonLabel: "View ARB Folder"
  },

  photoArchiveLink: {
    label: "Photo Archive",
    keys: ["photo_archive_link", "photoArchiveLink", "Photo Archive (Drive)"],
    format: "link",
    buttonLabel: "View Photo Archive"
  },

  imageUrl: {
    label: "Image",
    keys: ["image_url", "imageUrl", "Image URL", "primary_image", "primaryImage"],
    format: "image"
  },

  labelText: {
    label: "Label Text",
    keys: ["label_text", "labelText", "land_id_label"]
  },

  labelLatitude: {
    label: "Label Latitude",
    keys: ["label_latitude", "labelLatitude"]
  },

  labelLongitude: {
    label: "Label Longitude",
    keys: ["label_longitude", "labelLongitude"]
  },

  showLabel: {
    label: "Show Label",
    keys: ["show_label", "showLabel"]
  }
});
