/*
 * Callable public map taxonomies.
 *
 * Categorical taxonomies automatically include observed Pipeline values.
 * Range taxonomies use fixed, readable bands.
 */
window.HAM_TAXONOMIES = Object.freeze({
  lotStatus: {
    label: "Lot Status",
    field: "lotStatus",
    type: "categorical",
    includeObservedValues: true,
    classes: [
      { value: "Improved", label: "Improved", color: "#4f8c76" },
      { value: "Unimproved", label: "Unimproved", color: "#3d8bfd" },
      { value: "Available", label: "Available", color: "#2f8f57", aliases: ["Active"] },
      { value: "Reserved", label: "Reserved", color: "#c99a2e", aliases: ["Hold", "On Hold"] },
      { value: "Under Contract", label: "Under Contract", color: "#d77b2f", aliases: ["Contract", "Pending"] },
      { value: "Closed", label: "Closed / Sold", color: "#567b9d", aliases: ["Sold"] },
      { value: "Inactive", label: "Inactive", color: "#7a7f85", aliases: ["Withdrawn", "Cancelled", "Canceled"] }
    ],
    fallback: { label: "Lot Status Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#3d8bfd", "#8a63d2", "#dd6b55", "#4f9d69", "#d4a72c", "#4e8098", "#a26769", "#6c757d"]
  },

  propertyType: {
    label: "Property Type",
    field: "propertyType",
    type: "categorical",
    includeObservedValues: true,
    classes: [
      { value: "Lot", label: "Lot", color: "#43a85b", aliases: ["Homesite", "Home Site"] },
      { value: "Live / Work", label: "Live / Work", color: "#4aa9b2", aliases: ["Live-Work", "Live Work"] },
      { value: "Single Family", label: "Single Family", color: "#5797e5", aliases: ["Single-Family"] },
      { value: "Townhome", label: "Townhome", color: "#eb8738", aliases: ["Townhouse", "Town Home"] },
      { value: "Condominium", label: "Condominium", color: "#7545bd", aliases: ["Condo"] },
      { value: "Apartment(s)", label: "Apartment(s)", color: "#db4b93", aliases: ["Apartment", "Apartments"] },
      { value: "Commercial", label: "Commercial", color: "#d76172", aliases: ["Commercial (MAKE)"] }
    ],
    fallback: { label: "Property Type Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#2a9d8f", "#457b9d", "#8e6caa", "#d17b36", "#6a994e", "#bc6c25", "#577590", "#9c6644"]
  },

  stage: {
    label: "Stage",
    field: "stage",
    type: "categorical",
    includeObservedValues: true,
    classes: [
      { value: "Planning", label: "Planning", color: "#9aa0a6", aliases: ["Planned"] },
      { value: "Permitting", label: "Permitting", color: "#d4a72c", aliases: ["Permit"] },
      { value: "Listed For Sale", label: "Listed For Sale", color: "#3d8bfd", aliases: ["Listed", "For Sale"] },
      { value: "Under Construction", label: "Under Construction", color: "#277da1", aliases: ["Construction", "Building"] },
      { value: "Completed Construction", label: "Completed Construction", color: "#43aa8b", aliases: ["Completed", "Complete", "Built"] },
      { value: "Property Sold", label: "Property Sold", color: "#577590", aliases: ["Closed", "Sold"] },
      { value: "Inactive", label: "Inactive", color: "#7a7f85" }
    ],
    fallback: { label: "Stage Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#f9844a", "#90be6d", "#f9c74f", "#43aa8b", "#577590", "#8e6caa", "#bc6c25", "#6a994e"]
  },

  listingStatus: {
    label: "Listing Status",
    field: "listingStatus",
    type: "categorical",
    includeObservedValues: true,
    classes: [
      { value: "Active", label: "Active", color: "#2f8f57" },
      { value: "Coming Soon", label: "Coming Soon", color: "#3d8bfd" },
      { value: "Pending", label: "Pending", color: "#d77b2f", aliases: ["Under Contract"] },
      { value: "Sold", label: "Sold", color: "#567b9d", aliases: ["Closed"] },
      { value: "Off Market", label: "Off Market", color: "#7a7f85", aliases: ["Inactive", "Withdrawn"] }
    ],
    fallback: { label: "Listing Status Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#457b9d", "#2a9d8f", "#e76f51", "#8e6caa", "#6a994e", "#bc6c25"]
  },

  builder: {
    label: "Builder",
    field: "builder",
    type: "categorical",
    includeObservedValues: true,
    classes: [
      { value: "Allen Patterson Residential", label: "Allen Patterson Residential", color: "#277da1" },
      { value: "Artisan Custom Homes", label: "Artisan Custom Homes", color: "#43aa8b" },
      { value: "Bowden Development", label: "Bowden Development", color: "#f8961e" },
      { value: "Brant Construction", label: "Brant Construction", color: "#9b5de5" },
      { value: "Broad River Construction", label: "Broad River Construction", color: "#f15bb5" },
      { value: "Chandler Trask Construction", label: "Chandler Trask Construction", color: "#00b4d8" },
      { value: "Coastal Contractors, Inc.", label: "Coastal Contractors, Inc.", color: "#6a994e" },
      { value: "David Stevenson", label: "David Stevenson", color: "#bc6c25" },
      { value: "Family Home Builders", label: "Family Home Builders", color: "#577590" },
      { value: "Front Light Building Company", label: "Front Light Building Company", color: "#d1495b" },
      { value: "Genesis Construction Company", label: "Genesis Construction Company", color: "#4d908e" },
      { value: "Gooding Contractors", label: "Gooding Contractors", color: "#8d6e63" },
      { value: "Group 133", label: "Group 133", color: "#277da1" },
      { value: "Henry Vala", label: "Henry Vala", color: "#43aa8b" },
      { value: "Intrinsic Home Builders", label: "Intrinsic Home Builders", color: "#f8961e" },
      { value: "Joe Porter Construction", label: "Joe Porter Construction", color: "#9b5de5" },
      { value: "Ken Troupe", label: "Ken Troupe", color: "#f15bb5" },
      { value: "Lanthorne Homes", label: "Lanthorne Homes", color: "#00b4d8" },
      { value: "Meritus Signature Homes", label: "Meritus Signature Homes", color: "#6a994e" },
      { value: "OldPoint Custom Homes", label: "OldPoint Custom Homes", color: "#bc6c25" },
      { value: "Original Owner - Single Build", label: "Original Owner - Single Build", color: "#577590" },
      { value: "Outside Builder - Single Build", label: "Outside Builder - Single Build", color: "#d1495b" },
      { value: "Paradise Point Construction", label: "Paradise Point Construction", color: "#4d908e" },
      { value: "Quality Builders of Beaufort", label: "Quality Builders of Beaufort", color: "#8d6e63" },
      { value: "Saltt Development Company", label: "Saltt Development Company", color: "#277da1" },
      { value: "Sanders Construction Services", label: "Sanders Construction Services", color: "#43aa8b" },
      { value: "Seaway Development", label: "Seaway Development", color: "#f8961e" },
      { value: "Shumaker Homes", label: "Shumaker Homes", color: "#9b5de5" },
      { value: "Southern Traditions Custom Homes", label: "Southern Traditions Custom Homes", color: "#f15bb5" },
      { value: "Streamline Custom Homes", label: "Streamline Custom Homes", color: "#00b4d8" },
      { value: "The Noro Company", label: "The Noro Company", color: "#6a994e" },
      { value: "The Tilton Group", label: "The Tilton Group", color: "#bc6c25" },
      { value: "Trinity Contracting Group", label: "Trinity Contracting Group", color: "#577590" },
      { value: "Tucker Building Corporation", label: "Tucker Building Corporation", color: "#d1495b" },
      { value: "Unknown", label: "Unknown", color: "#4d908e" },
      { value: "Vala & Owens Custom Homes", label: "Vala & Owens Custom Homes", color: "#8d6e63" },
      { value: "Vala Building Contractors", label: "Vala Building Contractors", color: "#277da1" },
      { value: "WaterMark Coastal Homes", label: "WaterMark Coastal Homes", color: "#43aa8b" },
      { value: "Yestermorrow", label: "Yestermorrow", color: "#f8961e" }
    ],
    fallback: { label: "Builder Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#277da1", "#43aa8b", "#f8961e", "#9b5de5", "#f15bb5", "#00b4d8", "#6a994e", "#bc6c25", "#577590", "#d1495b", "#4d908e", "#8d6e63"]
  },

  neighborhoodDistrict: {
    label: "Neighborhood District",
    field: "neighborhoodDistrict",
    type: "categorical",
    includeObservedValues: true,
    classes: [],
    fallback: { label: "District Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#4d908e", "#577590", "#f9844a", "#90be6d", "#f9c74f", "#8e6caa", "#bc6c25"]
  },

  architect: {
    label: "Architect",
    field: "architect",
    type: "categorical",
    includeObservedValues: true,
    classes: [],
    fallback: { label: "Architect Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#277da1", "#43aa8b", "#f8961e", "#9b5de5", "#f15bb5", "#00b4d8", "#6a994e", "#bc6c25", "#577590", "#d1495b"]
  },

  neighborhoodZoning: {
    label: "Neighborhood Zoning",
    field: "neighborhoodZoning",
    type: "categorical",
    includeObservedValues: true,
    classes: [],
    fallback: { label: "Zoning Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#277da1", "#43aa8b", "#f8961e", "#9b5de5", "#f15bb5", "#00b4d8", "#6a994e", "#bc6c25"]
  },

  planName: {
    label: "Habersham Plan Name",
    field: "planName",
    type: "categorical",
    includeObservedValues: true,
    classes: [],
    fallback: { label: "Plan Not Assigned", color: "#b8b8b8" },
    autoPalette: ["#457b9d", "#2a9d8f", "#e76f51", "#8e6caa", "#6a994e", "#bc6c25", "#577590", "#d1495b"]
  },

  squareFootageBand: {
    label: "Square Footage (Heated)",
    field: "squareFootageHeated",
    type: "range",
    classes: [
      { min: 0, max: 999, label: "Under 1,000 sq. ft.", color: "#d9e8f5" },
      { min: 1000, max: 1499, label: "1,000â€“1,499 sq. ft.", color: "#b8d5ea" },
      { min: 1500, max: 1999, label: "1,500â€“1,999 sq. ft.", color: "#8eb9dc" },
      { min: 2000, max: 2499, label: "2,000â€“2,499 sq. ft.", color: "#659fce" },
      { min: 2500, max: 2999, label: "2,500â€“2,999 sq. ft.", color: "#4f8ec4" },
      { min: 3000, max: 3999, label: "3,000â€“3,999 sq. ft.", color: "#3374aa" },
      { min: 4000, max: null, label: "4,000+ sq. ft.", color: "#245c91" }
    ],
    fallback: { label: "Square Footage Not Assigned", color: "#b8b8b8" }
  },

  amountBand: {
    label: "Amount",
    field: "amount",
    type: "range",
    classes: [
      { min: 1, max: 299999, label: "Under $300,000", color: "#d9e8f5" },
      { min: 300000, max: 499999, label: "$300,000â€“$499,999", color: "#b8d5ea" },
      { min: 500000, max: 749999, label: "$500,000â€“$749,999", color: "#8eb9dc" },
      { min: 750000, max: 999999, label: "$750,000â€“$999,999", color: "#4f8ec4" },
      { min: 1000000, max: 1499999, label: "$1.0Mâ€“$1.49M", color: "#3374aa" },
      { min: 1500000, max: null, label: "$1.5M and Above", color: "#245c91" }
    ],
    fallback: { label: "Amount Not Assigned", color: "#b8b8b8" }
  },

  updatedRecency: {
    label: "Updated",
    field: "updated",
    type: "date-range",
    classes: [
      { minAgeDays: 0, maxAgeDays: 7, label: "Updated in Last 7 Days", color: "#2f8f57" },
      { minAgeDays: 8, maxAgeDays: 30, label: "Updated 8â€“30 Days Ago", color: "#6a994e" },
      { minAgeDays: 31, maxAgeDays: 90, label: "Updated 31â€“90 Days Ago", color: "#d4a72c" },
      { minAgeDays: 91, maxAgeDays: 365, label: "Updated 91â€“365 Days Ago", color: "#d77b2f" },
      { minAgeDays: 366, maxAgeDays: null, label: "Updated More Than 1 Year Ago", color: "#7a7f85" }
    ],
    fallback: { label: "Updated Date Not Assigned", color: "#b8b8b8" }
  }
});
