/**
 * Design System Constants
 * Centralized design tokens for colors, spacing, z-index, and breakpoints
 */

export const COLORS = {
  primary: "#2563eb",
  secondary: "#a855f7",
  accent: "#f97316",
  success: "#16a34a",
  warning: "#eab308",
  danger: "#dc2626",
} as const;

export const COLOR_NAMES = {
  primary: "blue",
  secondary: "purple",
  accent: "orange",
  success: "green",
  warning: "yellow",
  danger: "red",
} as const;

export const SPACING = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
} as const;

export const Z_INDEX = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  modalContent: 50,
  tooltip: 100,
} as const;

export const BREAKPOINTS = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const BORDER_RADIUS = {
  none: "0px",
  sm: "4px",
  base: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "16px",
  full: "9999px",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
} as const;

export const FONT_SIZES = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  "2xl": "24px",
  "3xl": "30px",
} as const;

/**
 * Common component class strings for reuse
 */
export const COMPONENT_CLASSES = {
  card: "card",
  cardElevated: "card-elevated",
  cardFlat: "card-flat",
  btnPrimary: "btn-primary",
  btnSecondary: "btn-secondary",
  btnPurple: "btn-purple",
  btnOrange: "btn-orange",
  btnRed: "btn-red",
  btnGhost: "btn-ghost",
  badge: "badge",
  badgeSuccess: "badge-success",
  badgeWarning: "badge-warning",
  badgeDanger: "badge-danger",
  badgeInfo: "badge-info",
  tableWrapper: "table-wrapper",
  tableHeader: "table-header",
  tableRow: "table-row",
  tableCell: "table-cell",
  modalBackdrop: "modal-backdrop",
  modalContent: "modal-content",
  modalHeader: "modal-header",
  modalBody: "modal-body",
  statValue: "stat-value",
  statLabel: "stat-label",
  pageTitle: "page-title",
  pageSubtitle: "page-subtitle",
  inputBase: "input-base",
  inputSearch: "input-search",
  containerSafe: "container-safe",
  flexBetween: "flex-between",
  flexCenter: "flex-center",
  listItem: "list-item",
  listItemHover: "list-item-hover",
} as const;
