/**
 * Feature flag: catalog-v2 preview mode.
 *
 * When enabled, the adapter layer is activated and a preview panel
 * becomes visible in the UI (without changing the active/default catalog).
 *
 * Toggle via:
 *   - localStorage (browser DevTools or the UI toggle)
 *   - NEXT_PUBLIC_CATALOG_V2_PREVIEW=true env variable (build-time opt-in)
 *
 * The production catalog (v1) remains the default at all times.
 */

export const CATALOG_V2_PREVIEW_STORAGE_KEY = "landscape_catalog_v2_preview";

/** Returns true when the v2 preview is active */
export function isCatalogV2PreviewEnabled(): boolean {
  // Build-time env opt-in (set in .env.local)
  if (process.env.NEXT_PUBLIC_CATALOG_V2_PREVIEW === "true") return true;

  // Runtime localStorage toggle
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CATALOG_V2_PREVIEW_STORAGE_KEY) === "true";
}

export function enableCatalogV2Preview(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATALOG_V2_PREVIEW_STORAGE_KEY, "true");
}

export function disableCatalogV2Preview(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CATALOG_V2_PREVIEW_STORAGE_KEY);
}

export function toggleCatalogV2Preview(): boolean {
  const next = !isCatalogV2PreviewEnabled();
  if (next) enableCatalogV2Preview();
  else disableCatalogV2Preview();
  return next;
}
