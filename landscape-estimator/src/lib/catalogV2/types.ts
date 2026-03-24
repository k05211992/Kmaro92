// ─── V2 Catalog shapes (from data/catalog-v2/*.json) ─────────────────────────

export interface CatalogV2Work {
  id: string;                  // RWORK-XXXX
  canonicalName: string;
  commercialName: string;
  section: string;
  unit: string;
  basePrice: number;
  keywords: string;
  isActive: boolean;
  mappingConfidence: string;
}

export interface CatalogV2WorkVariant {
  id: string;                  // WV-XXXX
  workId: string;
  effectiveUnitPrice: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface CatalogV2Material {
  id: string;                  // RMAT-XXXX
  family: string;              // lowercase normalised name (pre-computed)
  canonicalName: string;
  commercialBaseName: string;
  section: string;
  baseUnit: string;
  isActive: boolean;
}

export interface CatalogV2MaterialVariant {
  id: string;                  // MV-XXXX
  materialId: string;
  pricePerUnit: number | null;
  isDefault: boolean;
  isActive: boolean;
  sourceRowId?: string;
}

// ─── Adapter result types ─────────────────────────────────────────────────────

/** How confident was the match */
export type MatchConfidence = "exact" | "canonical" | "normalized" | "none";

export interface AdaptedWork {
  /** Original v1 WorkInput fields */
  originalCategory: string;
  originalVariant: string | undefined;
  originalVariantLabel?: string;

  /** Resolved v2 entities (null if requiresRemap) */
  v2WorkId: string | null;
  v2WorkVariantId: string | null;
  v2CanonicalName: string | null;
  v2Price: number | null;
  v2Unit: string | null;

  confidence: MatchConfidence;
  requiresRemap: boolean;
  remapReason?: string;
}

export interface AdaptedMaterial {
  /** Original v1 MaterialLine fields */
  originalId: string;
  originalTitle: string;
  originalUnit: string;
  originalPrice: number;

  /** Resolved v2 entities (null if requiresRemap) */
  v2MaterialId: string | null;
  v2MaterialVariantId: string | null;
  v2CanonicalName: string | null;
  v2Price: number | null;
  v2Unit: string | null;

  confidence: MatchConfidence;
  requiresRemap: boolean;
  remapReason?: string;
}

export interface AdapterReport {
  timestamp: string;

  worksTotal: number;
  /** Matched via exact id or canonical map */
  worksMatched: number;
  /** Matched via normalised title (lower confidence) */
  worksPartial: number;
  worksRequiresRemap: number;

  materialsTotal: number;
  materialsMatched: number;
  materialsPartial: number;
  materialsRequiresRemap: number;

  workResults: AdaptedWork[];
  materialResults: AdaptedMaterial[];
}
