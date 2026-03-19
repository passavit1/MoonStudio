import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class strings safely, handling Tailwind CSS conflicts
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Card class builder
 * @param variant - 'default' | 'elevated' | 'flat'
 * @param className - additional classes to merge
 */
export function cardClasses(
  variant: "default" | "elevated" | "flat" = "default",
  className?: string
): string {
  const baseClasses = {
    default: "card",
    elevated: "card-elevated",
    flat: "card-flat",
  };
  return cn(baseClasses[variant], className);
}

/**
 * Button class builder
 * @param variant - button style variant
 * @param size - button size
 * @param className - additional classes to merge
 */
export function buttonClasses(
  variant:
    | "primary"
    | "secondary"
    | "purple"
    | "orange"
    | "red"
    | "ghost" = "primary",
  size: "sm" | "base" | "lg" = "base",
  className?: string
): string {
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    purple: "btn-purple",
    orange: "btn-orange",
    red: "btn-red",
    ghost: "btn-ghost",
  };

  const sizeClasses = {
    sm: "btn-sm",
    base: "",
    lg: "btn-lg",
  };

  return cn(variantClasses[variant], sizeClasses[size], className);
}

/**
 * Badge class builder
 * @param variant - badge style variant
 * @param className - additional classes to merge
 */
export function badgeClasses(
  variant: "default" | "success" | "warning" | "danger" | "info" = "default",
  className?: string
): string {
  const variantClasses = {
    default: "badge",
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    info: "badge-info",
  };
  return cn(variantClasses[variant], className);
}

/**
 * Table class builder for wrappers
 * @param className - additional classes to merge
 */
export function tableWrapperClasses(className?: string): string {
  return cn("table-wrapper", className);
}

/**
 * Table header classes
 * @param className - additional classes to merge
 */
export function tableHeaderClasses(className?: string): string {
  return cn("table-header", className);
}

/**
 * Table row classes
 * @param className - additional classes to merge
 */
export function tableRowClasses(className?: string): string {
  return cn("table-row", className);
}

/**
 * Table cell classes
 * @param className - additional classes to merge
 */
export function tableCellClasses(className?: string): string {
  return cn("table-cell", className);
}

/**
 * Modal backdrop classes
 * @param className - additional classes to merge
 */
export function modalBackdropClasses(className?: string): string {
  return cn("modal-backdrop", className);
}

/**
 * Modal content classes
 * @param maxWidth - max width (default: max-w-4xl)
 * @param className - additional classes to merge
 */
export function modalContentClasses(
  maxWidth: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" = "4xl",
  className?: string
): string {
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };
  return cn("modal-content", widthClasses[maxWidth], className);
}

/**
 * Modal header classes
 * @param className - additional classes to merge
 */
export function modalHeaderClasses(className?: string): string {
  return cn("modal-header", className);
}

/**
 * Modal body classes
 * @param className - additional classes to merge
 */
export function modalBodyClasses(className?: string): string {
  return cn("modal-body", className);
}

/**
 * Stat value classes
 * @param className - additional classes to merge
 */
export function statValueClasses(className?: string): string {
  return cn("stat-value", className);
}

/**
 * Stat label classes
 * @param className - additional classes to merge
 */
export function statLabelClasses(className?: string): string {
  return cn("stat-label", className);
}

/**
 * Page title classes
 * @param className - additional classes to merge
 */
export function pageTitleClasses(className?: string): string {
  return cn("page-title", className);
}

/**
 * Page subtitle classes
 * @param className - additional classes to merge
 */
export function pageSubtitleClasses(className?: string): string {
  return cn("page-subtitle", className);
}

/**
 * Input classes
 * @param variant - 'base' | 'search'
 * @param className - additional classes to merge
 */
export function inputClasses(
  variant: "base" | "search" = "base",
  className?: string
): string {
  const variantClasses = {
    base: "input-base",
    search: "input-search",
  };
  return cn(variantClasses[variant], className);
}

/**
 * Container safe classes (full page with padding)
 * @param className - additional classes to merge
 */
export function containerSafeClasses(className?: string): string {
  return cn("container-safe", className);
}

/**
 * Flex helpers
 */
export function flexBetweenClasses(className?: string): string {
  return cn("flex-between", className);
}

export function flexCenterClasses(className?: string): string {
  return cn("flex-center", className);
}

/**
 * List item classes
 * @param withHover - include hover state
 * @param className - additional classes to merge
 */
export function listItemClasses(
  withHover: boolean = false,
  className?: string
): string {
  return cn(withHover ? "list-item-hover" : "list-item", className);
}
