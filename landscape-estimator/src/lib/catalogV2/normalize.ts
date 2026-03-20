/**
 * String normalisation utilities for catalog-v2 adapter.
 * Used to match v1 legacy titles against v2 canonicalName / family fields.
 */

/** Remove punctuation, collapse whitespace, lowercase */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[«»""''.,;:()\[\]{}\-/\\*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split into significant words (length > 2) */
function wordSet(s: string): Set<string> {
  return new Set(normalizeTitle(s).split(" ").filter((w) => w.length > 2));
}

/**
 * Jaccard-style similarity on word sets.
 * Returns 0–1 where 1 = all words of the shorter string appear in the other.
 */
export function wordSetSimilarity(a: string, b: string): number {
  const sa = wordSet(a);
  const sb = wordSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let matches = 0;
  sa.forEach((w) => {
    if (sb.has(w)) matches++;
  });
  // Coverage relative to the smaller set
  return matches / Math.min(sa.size, sb.size);
}

/** Threshold above which we accept a normalised-title match as "partial" */
export const SIMILARITY_THRESHOLD = 0.5;
