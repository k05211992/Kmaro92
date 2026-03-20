/**
 * Static mapping: v1 "categoryId:variantId"  →  v2 RWORK-XXXX
 *
 * Confidence levels:
 *   "exact"     – direct semantic equivalent in v2
 *   "canonical" – best available match; same category but not 1:1 equivalent
 *
 * HOW TO UPDATE:
 *   When a v1 pair has a clear v2 counterpart, add it here.
 *   If the mapping is ambiguous, leave it out – the adapter will
 *   fall through to normalised-title matching or requiresRemap.
 */

export interface CanonicalEntry {
  v2WorkId: string;
  confidence: "exact" | "canonical";
  note?: string;
}

/**
 * Key format: `${v1CategoryId}:${v1VariantId}`
 *
 * v1 categories: lawn | paving | curb | drainage | planting | irrigation | lighting
 */
export const V1_WORK_CANONICAL_MAP: Record<string, CanonicalEntry> = {
  // ── Газон ──────────────────────────────────────────────────────────────────
  "lawn:roll": {
    v2WorkId: "RWORK-0152",
    confidence: "exact",
    note: "Устройство рулонного газона на подготовленном основании",
  },
  "lawn:seed": {
    v2WorkId: "RWORK-0120",
    confidence: "canonical",
    note: "Устройство газонного ложа — ближайший аналог посевного газона",
  },
  "lawn:sport": {
    v2WorkId: "RWORK-0153",
    confidence: "exact",
    note: "Устройство спортивного ударопоглощающего покрытия из резиновой крошки",
  },

  // ── Мощение ────────────────────────────────────────────────────────────────
  "paving:tile": {
    v2WorkId: "RWORK-0074",
    confidence: "canonical",
    note: "Мощение ТБП — ближайший аналог тротуарной плитки",
  },
  "paving:natural": {
    v2WorkId: "RWORK-0069",
    confidence: "canonical",
    note: "Мощение гранитной брусчаткой (без рисунка)",
  },
  "paving:gravel": {
    v2WorkId: "RWORK-0123",
    confidence: "exact",
    note: "Устройство гравийного покрытия",
  },

  // ── Бордюры ────────────────────────────────────────────────────────────────
  "curb:concrete": {
    v2WorkId: "RWORK-0114",
    confidence: "canonical",
    note: "Устройство бордюра из габбро-диабаза в один ряд на бетон 80*80*80мм",
  },
  "curb:metal": {
    v2WorkId: "RWORK-0143",
    confidence: "exact",
    note: "Устройство ограничительного бордюра из металлического уголка 50*50мм",
  },
  // curb:plastic — нет аналога в v2, falls through to requiresRemap

  // ── Дренаж ─────────────────────────────────────────────────────────────────
  "drainage:surface": {
    v2WorkId: "RWORK-0151",
    confidence: "canonical",
    note: "Устройство поверхностного дренажного слоя из песка с прикаткой",
  },
  "drainage:deep": {
    v2WorkId: "RWORK-0128",
    confidence: "exact",
    note: "Устройство дренажа на глубине 80-130см",
  },

  // ── Освещение ──────────────────────────────────────────────────────────────
  "lighting:spot": {
    v2WorkId: "RWORK-0049",
    confidence: "canonical",
    note: "Монтаж встроенных в настил светильников с устройством отверстий в облицовке",
  },

  // planting:* — нет прямых аналогов работ в v2 (только выкопка/уход)
  // irrigation:* — нет аналогов в v2
  // lighting:path, lighting:facade — нет прямых аналогов
};

/**
 * Static mapping: v1 material title (lowercase) → v2 RMAT-XXXX
 *
 * Built from comparing src/config/materials.json titles with
 * data/catalog-v2/materials.json canonicalName / family fields.
 */
export interface MaterialCanonicalEntry {
  v2MaterialId: string;
  confidence: "exact" | "canonical";
  note?: string;
}

export const V1_MATERIAL_CANONICAL_MAP: Record<string, MaterialCanonicalEntry> =
  {
    "плодородный грунт": {
      v2MaterialId: "RMAT-0033",
      confidence: "canonical",
      note: "Грунт плодородный",
    },
    "геотекстиль": {
      v2MaterialId: "RMAT-0025",
      confidence: "exact",
      note: "Геотекстиль, 200г/м2",
    },
    "рулонный газон": {
      v2MaterialId: "RMAT-0022",
      confidence: "exact",
      note: "Газон рулонный «Универсальный», 0.8м.кв.",
    },
    "торф": {
      v2MaterialId: "RMAT-0100",
      confidence: "canonical",
      note: "Торф нейтрализованный, 300л",
    },
    "удобрение комплексное": {
      v2MaterialId: "RMAT-0107",
      confidence: "canonical",
      note: "Удобрение минеральное длительного действия",
    },
    "дренажная труба ø110": {
      v2MaterialId: "RMAT-0103",
      confidence: "canonical",
      note: "Труба дренажная d110 SN6",
    },
    "кабель ввг 2×1,5": {
      v2MaterialId: "RMAT-0048",
      confidence: "canonical",
      note: "Кабель силовой ВБШв нг(А)LS 3*1,5 0,66кВ броня",
    },
    // Нет аналогов: Песок строительный, Щебень фракция 20-40, Бордюрный камень,
    //               Тротуарная плитка, Семена газонные, Трубы ПНД Ø32,
    //               Спринклеры роторные, Светильник грунтовый
  };
