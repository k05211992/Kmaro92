/**
 * Public API for catalog-v2 adapter layer.
 *
 * Usage example (behind feature flag):
 *
 *   import { isCatalogV2PreviewEnabled, runAdapterReport } from "@/lib/catalogV2";
 *
 *   if (isCatalogV2PreviewEnabled()) {
 *     const report = runAdapterReport(workInputs, variantLabels, materialLines);
 *     console.log(report);
 *   }
 */

export type {
  CatalogV2Work,
  CatalogV2WorkVariant,
  CatalogV2Material,
  CatalogV2MaterialVariant,
  AdaptedWork,
  AdaptedMaterial,
  AdapterReport,
  MatchConfidence,
} from "./types";

export { adaptWork, adaptMaterial, runAdapterReport } from "./adapter";

export {
  isCatalogV2PreviewEnabled,
  enableCatalogV2Preview,
  disableCatalogV2Preview,
  toggleCatalogV2Preview,
  CATALOG_V2_PREVIEW_STORAGE_KEY,
} from "./featureFlag";

export { normalizeTitle, wordSetSimilarity, SIMILARITY_THRESHOLD } from "./normalize";
