/**
 * Feature flag: catalog-v2 is now the DEFAULT.
 *
 * catalog-v2 prices are used for all mapped v1 works/materials.
 * Unmapped items fall back to v1 prices. History IDs are preserved.
 *
 * ROLLBACK (temporary, per-browser):
 *   localStorage.setItem("landscape_catalog_v2_rollback", "true")
 *   → page reload → v1 prices restored
 *
 *   localStorage.removeItem("landscape_catalog_v2_rollback")
 *   → page reload → v2 restored (default)
 *
 * Build-time force-rollback:
 *   NEXT_PUBLIC_CATALOG_V2_ROLLBACK=true in .env.local
 */

export const CATALOG_V2_ROLLBACK_KEY = "landscape_catalog_v2_rollback";

/** Returns true when catalog-v2 is active (default). */
export function isCatalogV2Active(): boolean {
  // Build-time force-rollback
  if (process.env.NEXT_PUBLIC_CATALOG_V2_ROLLBACK === "true") return false;
  // Runtime opt-out
  if (typeof window === "undefined") return true;
  return localStorage.getItem(CATALOG_V2_ROLLBACK_KEY) !== "true";
}

/** Temporarily roll back to v1 prices (survives page reload). */
export function enableCatalogV2Rollback(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATALOG_V2_ROLLBACK_KEY, "true");
}

/** Restore v2 as default (remove rollback). */
export function disableCatalogV2Rollback(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CATALOG_V2_ROLLBACK_KEY);
}

// ─── Legacy aliases (kept for any existing callers) ───────────────────────────

/** @deprecated Use isCatalogV2Active() */
export const CATALOG_V2_PREVIEW_STORAGE_KEY = CATALOG_V2_ROLLBACK_KEY;

/** @deprecated Use isCatalogV2Active() */
export function isCatalogV2PreviewEnabled(): boolean {
  return isCatalogV2Active();
}

/** @deprecated Use disableCatalogV2Rollback() */
export function enableCatalogV2Preview(): void {
  disableCatalogV2Rollback();
}

/** @deprecated Use enableCatalogV2Rollback() */
export function disableCatalogV2Preview(): void {
  enableCatalogV2Rollback();
}

/** @deprecated */
export function toggleCatalogV2Preview(): boolean {
  const next = !isCatalogV2Active();
  if (next) disableCatalogV2Rollback();
  else enableCatalogV2Rollback();
  return next;
}
