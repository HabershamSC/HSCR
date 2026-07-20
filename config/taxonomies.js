/*
 * Taxonomies control polygon colors and map-key content.
 * Unknown non-empty values can be appended automatically, so new CRM values remain visible.
 */
window.HAM_TAXONOMIES = Object.freeze({
  propertyType: {
    label: "Property Type",
    field: "propertyType",
    type: "categorical",
    includeObservedValues: true,
    showZeroCountConfiguredClasses: false,
    classes: [
      { value: "Lot", label: "Lot", color: "#43a85b", aliases: ["Homesite", "Home Site"] },
      { value: "Live / Work", label: "Live / Work", color: "#4aa9b2", aliases: ["Live-Work", "Live Work"] },
      { value: "Single Family", label: "Single Family", color: "#5797e5", aliases: ["Single-Family", "Single family"] },
      { value: "Townhome", label: "Townhome", color: "#eb8738", aliases: ["Townhouse", "Town Home"] },
      { value: "Condominium", label: "Condominium", color: "#7545bd", aliases: ["Condo"] },
      { value: "Apartment(s)", label: "Apartment(s)", color: "#db4b93", aliases: ["Apartment", "Apartments"] },
      { value: "Commercial", label: "Commercial", color: "#d76172", aliases: ["Commercial (MAKE)"] }
    ],
    fallback: { label: "None / Unclassified", color: "#b8b8b8" },
    autoPalette: ["#2a9d8f", "#457b9d", "#8e6caa", "#d17b36", "#6a994e", "#bc6c25", "#577590", "#9c6644"]
  },

  dealStatus: {
    label: "Deal Status",
    field: "status",
    type: "categorical",
    includeObservedValues: true,
    showZeroCountConfiguredClasses: false,
    classes: [
      { value: "Available", label: "Available", color: "#2f8f57", aliases: ["Active", "For Sale"] },
      { value: "Reserved", label: "Reserved", color: "#c99a2e", aliases: ["Hold", "On Hold"] },
      { value: "Under Contract", label: "Under Contract", color: "#d77b2f", aliases: ["Contract", "Pending"] },
      { value: "Closed", label: "Closed / Sold", color: "#567b9d", aliases: ["Sold", "Completed"] },
      { value: "Improved", label: "Improved", color: "#4f8c76" },
      { value: "Inactive", label: "Inactive", color: "#7a7f85", aliases: ["Withdrawn", "Cancelled", "Canceled"] }
    ],
    fallback: { label: "Status Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#3d8bfd", "#8a63d2", "#dd6b55", "#4f9d69", "#d4a72c", "#4e8098", "#a26769", "#6c757d"]
  },

  constructionStage: {
    label: "Stage",
    field: "stage",
    type: "categorical",
    includeObservedValues: true,
    showZeroCountConfiguredClasses: false,
    classes: [
      { value: "Planning", label: "Planning", color: "#9aa0a6", aliases: ["Planned"] },
      { value: "Permitting", label: "Permitting", color: "#d4a72c", aliases: ["Permit"] },
      { value: "Listed For Sale", label: "Listed For Sale", color: "#3d8bfd", aliases: ["Listed", "For Sale"] },
      { value: "Under Construction", label: "Under Construction", color: "#277da1", aliases: ["Construction", "Building"] },
      { value: "Improved", label: "Improved", color: "#43aa8b" },
      { value: "Completed", label: "Completed", color: "#4d908e", aliases: ["Complete", "Built"] },
      { value: "Closed", label: "Closed", color: "#577590" }
    ],
    fallback: { label: "Stage Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#f9844a", "#90be6d", "#f9c74f", "#43aa8b", "#577590", "#8e6caa", "#bc6c25", "#6a994e"]
  },

  builder: {
    label: "Builder",
    field: "builder",
    type: "categorical",
    includeObservedValues: true,
    classes: [],
    fallback: { label: "Builder Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#277da1", "#43aa8b", "#f8961e", "#9b5de5", "#f15bb5", "#00b4d8", "#6a994e", "#bc6c25", "#577590", "#d1495b", "#4d908e", "#8d6e63"]
  },

  priceBand: {
    label: "List Price",
    field: "price",
    type: "range",
    classes: [
      { min: 0, max: 299999.99, label: "Under $300,000", color: "#d9e8f5" },
      { min: 300000, max: 499999.99, label: "$300,000–$499,999", color: "#8eb9dc" },
      { min: 500000, max: 749999.99, label: "$500,000–$749,999", color: "#4f8ec4" },
      { min: 750000, max: null, label: "$750,000 and Above", color: "#245c91" }
    ],
    fallback: { label: "Price Not Assigned", color: "#b8b8b8" }
  }
});
