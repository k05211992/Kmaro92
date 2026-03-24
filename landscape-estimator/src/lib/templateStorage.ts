import type { EstimateTemplate } from "@/types";

const TEMPLATES_KEY = "landscape_templates_v1";

// ── Built-in demo templates ──────────────────────────────────────────────────

const DEMO_TEMPLATES: EstimateTemplate[] = [
  {
    id: "builtin-lawn",
    name: "Газон + подготовка",
    description: "Рулонный газон с подготовкой грунта и доставкой",
    isBuiltIn: true,
    complexityCoeff: 1.0,
    inputs: [
      { category: "lawn",    variant: "lawn_roll",    quantity: 100 },
      { category: "lawn",    variant: "lawn_prep",    quantity: 100 },
    ],
    materials: [
      { id: "m-t1-1", title: "Плодородный грунт",  unit: "м³",  quantity: 15, price: 1800, subtotal: 27000 },
      { id: "m-t1-2", title: "Геотекстиль",         unit: "м²",  quantity: 110, price: 25,  subtotal: 2750 },
    ],
    extraCosts: [
      { id: "e-t1-1", title: "Доставка материалов", amount: 4500 },
    ],
  },
  {
    id: "builtin-paving",
    name: "Мощение + бордюр",
    description: "Укладка тротуарной плитки с бетонным бордюром",
    isBuiltIn: true,
    complexityCoeff: 1.1,
    inputs: [
      { category: "paving",  variant: "paving_tile",   quantity: 50 },
      { category: "paving",  variant: "paving_curb",   quantity: 30 },
    ],
    materials: [
      { id: "m-t2-1", title: "Тротуарная плитка",  unit: "м²",  quantity: 55,  price: 650, subtotal: 35750 },
      { id: "m-t2-2", title: "Бордюрный камень",   unit: "шт",  quantity: 35,  price: 180, subtotal: 6300 },
      { id: "m-t2-3", title: "Цементно-песчаная смесь", unit: "кг", quantity: 500, price: 8, subtotal: 4000 },
    ],
    extraCosts: [
      { id: "e-t2-1", title: "Доставка материалов", amount: 5500 },
    ],
  },
  {
    id: "builtin-drainage",
    name: "Дренажный пакет",
    description: "Глубинный дренаж участка с геотекстилем",
    isBuiltIn: true,
    complexityCoeff: 1.2,
    inputs: [
      { category: "drainage", variant: "drainage_deep", quantity: 40 },
    ],
    materials: [
      { id: "m-t3-1", title: "Перфорированная труба Ø110", unit: "м.п.", quantity: 45,  price: 95,  subtotal: 4275 },
      { id: "m-t3-2", title: "Щебень фракция 20-40",       unit: "т",    quantity: 8,   price: 1400, subtotal: 11200 },
      { id: "m-t3-3", title: "Геотекстиль",                unit: "м²",   quantity: 120, price: 25,  subtotal: 3000 },
    ],
    extraCosts: [
      { id: "e-t3-1", title: "Вывоз грунта",        amount: 8000 },
      { id: "e-t3-2", title: "Доставка материалов", amount: 4000 },
    ],
  },
  {
    id: "builtin-complex",
    name: "Базовое благоустройство",
    description: "Газон + мощение + бордюр — комплексный пакет",
    isBuiltIn: true,
    complexityCoeff: 1.1,
    inputs: [
      { category: "lawn",    variant: "lawn_roll",    quantity: 200 },
      { category: "lawn",    variant: "lawn_prep",    quantity: 200 },
      { category: "paving",  variant: "paving_tile",  quantity: 30 },
      { category: "paving",  variant: "paving_curb",  quantity: 40 },
    ],
    materials: [
      { id: "m-t4-1", title: "Плодородный грунт",   unit: "м³",  quantity: 30,  price: 1800, subtotal: 54000 },
      { id: "m-t4-2", title: "Тротуарная плитка",   unit: "м²",  quantity: 33,  price: 650,  subtotal: 21450 },
      { id: "m-t4-3", title: "Бордюрный камень",    unit: "шт",  quantity: 48,  price: 180,  subtotal: 8640 },
      { id: "m-t4-4", title: "Геотекстиль",         unit: "м²",  quantity: 220, price: 25,   subtotal: 5500 },
    ],
    extraCosts: [
      { id: "e-t4-1", title: "Доставка материалов", amount: 7500 },
      { id: "e-t4-2", title: "Вывоз мусора",        amount: 3000 },
    ],
  },
];

// ── Storage helpers ──────────────────────────────────────────────────────────

function loadUserTemplates(): EstimateTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as EstimateTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveUserTemplates(templates: EstimateTemplate[]): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns built-in templates followed by user-created templates */
export function getAllTemplates(): EstimateTemplate[] {
  return [...DEMO_TEMPLATES, ...loadUserTemplates()];
}

export function saveTemplate(template: EstimateTemplate): void {
  const userTemplates = loadUserTemplates();
  const idx = userTemplates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    userTemplates[idx] = template;
  } else {
    userTemplates.push(template);
  }
  saveUserTemplates(userTemplates);
}

export function deleteTemplate(id: string): void {
  const userTemplates = loadUserTemplates().filter((t) => t.id !== id);
  saveUserTemplates(userTemplates);
}
