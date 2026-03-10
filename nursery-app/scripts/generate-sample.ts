/**
 * Script to generate a sample Excel catalog file for the nursery app.
 * Run: npm run generate-sample
 * Output: public/sample_catalog.xlsx
 */
import * as XLSX from "xlsx";
import * as path from "path";

interface SampleRow {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  latin_name: string;
  variety: string;
  size: string;
  container: string;
  price_retail: number;
  price_wholesale: number;
  discount_default: number;
  stock_qty: number;
  stock_status: string;
  light: string;
  moisture: string;
  height_group: string;
  frost_zone: string;
  lifespan_group: string;
  flower_color: string;
  leaf_color: string;
  natural_garden: string;
  medicinal: string;
  description: string;
  notes: string;
  image_url: string;
}

const sampleData: SampleRow[] = [
  // Деревья
  {
    id: "T001",
    category: "Деревья",
    subcategory: "Лиственные",
    name: "Берёза пушистая",
    latin_name: "Betula pubescens",
    variety: "Стандарт",
    size: "Н 2–2,5 м",
    container: "С30",
    price_retail: 4500,
    price_wholesale: 3200,
    discount_default: 0,
    stock_qty: 12,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "over_100",
    frost_zone: "2",
    lifespan_group: "многолетнее",
    flower_color: "",
    leaf_color: "зелёный",
    natural_garden: "true",
    medicinal: "true",
    description: "Декоративное дерево с характерной белой корой. Быстрорастущее, неприхотливое.",
    notes: "При посадке весной — поливать 2 раза в неделю первый месяц.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/2009-05-25_Betula_pendula.jpg/320px-2009-05-25_Betula_pendula.jpg",
  },
  {
    id: "T002",
    category: "Деревья",
    subcategory: "Хвойные",
    name: "Ель обыкновенная",
    latin_name: "Picea abies",
    variety: "Нидиформис",
    size: "Н 0,5 м",
    container: "С5",
    price_retail: 1200,
    price_wholesale: 800,
    discount_default: 5,
    stock_qty: 35,
    stock_status: "in_stock",
    light: "partial_shade",
    moisture: "moderate",
    height_group: "under_20",
    frost_zone: "3",
    lifespan_group: "многолетнее",
    flower_color: "",
    leaf_color: "тёмно-зелёный",
    natural_garden: "false",
    medicinal: "false",
    description: "Карликовая форма ели. Шаровидная крона. Медленный рост, компактный размер.",
    notes: "",
    image_url: "",
  },
  {
    id: "T003",
    category: "Деревья",
    subcategory: "Хвойные",
    name: "Сосна горная",
    latin_name: "Pinus mugo",
    variety: "Мопс",
    size: "Н 0,3 м",
    container: "С3",
    price_retail: 900,
    price_wholesale: 600,
    discount_default: 0,
    stock_qty: 8,
    stock_status: "low",
    light: "sun",
    moisture: "dry",
    height_group: "under_20",
    frost_zone: "2",
    lifespan_group: "многолетнее",
    flower_color: "",
    leaf_color: "зелёный",
    natural_garden: "true",
    medicinal: "false",
    description: "Компактный кустарник с шарообразной формой. Не требует стрижки.",
    notes: "Хорошо переносит городские условия.",
    image_url: "",
  },
  {
    id: "T004",
    category: "Деревья",
    subcategory: "Лиственные",
    name: "Клён остролистный",
    latin_name: "Acer platanoides",
    variety: "Кримсон Кинг",
    size: "Н 1,5–2 м",
    container: "С20",
    price_retail: 6800,
    price_wholesale: 5000,
    discount_default: 10,
    stock_qty: 5,
    stock_status: "low",
    light: "sun",
    moisture: "moderate",
    height_group: "over_100",
    frost_zone: "4",
    lifespan_group: "многолетнее",
    flower_color: "жёлтый",
    leaf_color: "тёмно-красный",
    natural_garden: "false",
    medicinal: "false",
    description: "Декоративный клён с тёмно-пурпурной листвой. Эффектное акцентное дерево.",
    notes: "",
    image_url: "",
  },
  // Кустарники
  {
    id: "S001",
    category: "Кустарники",
    subcategory: "Цветущие",
    name: "Сирень обыкновенная",
    latin_name: "Syringa vulgaris",
    variety: "Красавица Москвы",
    size: "Н 1 м",
    container: "С10",
    price_retail: 2200,
    price_wholesale: 1500,
    discount_default: 0,
    stock_qty: 20,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "50_100",
    frost_zone: "3",
    lifespan_group: "многолетнее",
    flower_color: "розовый",
    leaf_color: "зелёный",
    natural_garden: "true",
    medicinal: "false",
    description: "Один из лучших сортов сирени. Крупные махровые цветки нежно-розового цвета.",
    notes: "Цветёт в мае. Не переносит застоя воды.",
    image_url: "",
  },
  {
    id: "S002",
    category: "Кустарники",
    subcategory: "Цветущие",
    name: "Спирея японская",
    latin_name: "Spiraea japonica",
    variety: "Голдфлейм",
    size: "Н 0,5 м",
    container: "С3",
    price_retail: 650,
    price_wholesale: 420,
    discount_default: 0,
    stock_qty: 45,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "20_50",
    frost_zone: "4",
    lifespan_group: "многолетнее",
    flower_color: "розовый",
    leaf_color: "оранжево-жёлтый",
    natural_garden: "false",
    medicinal: "false",
    description: "Листопадный кустарник с эффектной листвой: весной оранжевая, летом жёлто-зелёная.",
    notes: "",
    image_url: "",
  },
  {
    id: "S003",
    category: "Кустарники",
    subcategory: "Декоративно-лиственные",
    name: "Дёрен белый",
    latin_name: "Cornus alba",
    variety: "Элегантиссима",
    size: "Н 0,8–1 м",
    container: "С5",
    price_retail: 850,
    price_wholesale: 580,
    discount_default: 5,
    stock_qty: 30,
    stock_status: "in_stock",
    light: "partial_shade",
    moisture: "wet",
    height_group: "50_100",
    frost_zone: "2",
    lifespan_group: "многолетнее",
    flower_color: "белый",
    leaf_color: "бело-зелёный (пёстрый)",
    natural_garden: "true",
    medicinal: "false",
    description: "Кустарник с пёстрой листвой и ярко-красными побегами зимой. Отличный выбор для берегов водоёмов.",
    notes: "",
    image_url: "",
  },
  {
    id: "S004",
    category: "Кустарники",
    subcategory: "Цветущие",
    name: "Гортензия метельчатая",
    latin_name: "Hydrangea paniculata",
    variety: "Лаймлайт",
    size: "Н 1 м",
    container: "С10",
    price_retail: 1800,
    price_wholesale: 1250,
    discount_default: 0,
    stock_qty: 0,
    stock_status: "order",
    light: "partial_shade",
    moisture: "moderate",
    height_group: "50_100",
    frost_zone: "4",
    lifespan_group: "многолетнее",
    flower_color: "кремово-белый",
    leaf_color: "зелёный",
    natural_garden: "false",
    medicinal: "false",
    description: "Крупные соцветия кремово-белого цвета. Один из самых популярных сортов.",
    notes: "Под заказ — срок ожидания 3–4 недели.",
    image_url: "",
  },
  // Многолетники
  {
    id: "P001",
    category: "Многолетники",
    subcategory: "Почвопокровные",
    name: "Хоста",
    latin_name: "Hosta",
    variety: "Sum and Substance",
    size: "Д 60 см",
    container: "С2",
    price_retail: 480,
    price_wholesale: 300,
    discount_default: 0,
    stock_qty: 60,
    stock_status: "in_stock",
    light: "shade",
    moisture: "moderate",
    height_group: "20_50",
    frost_zone: "3",
    lifespan_group: "многолетнее",
    flower_color: "лиловый",
    leaf_color: "жёлто-зелёный",
    natural_garden: "true",
    medicinal: "false",
    description: "Крупнолистовая хоста для тенистых мест. Лист диаметром до 60 см.",
    notes: "",
    image_url: "",
  },
  {
    id: "P002",
    category: "Многолетники",
    subcategory: "Цветущие",
    name: "Лаванда узколистная",
    latin_name: "Lavandula angustifolia",
    variety: "Манстед",
    size: "Н 30–40 см",
    container: "С1",
    price_retail: 320,
    price_wholesale: 200,
    discount_default: 0,
    stock_qty: 80,
    stock_status: "in_stock",
    light: "sun",
    moisture: "dry",
    height_group: "20_50",
    frost_zone: "5",
    lifespan_group: "многолетнее",
    flower_color: "фиолетовый",
    leaf_color: "серо-зелёный",
    natural_garden: "true",
    medicinal: "true",
    description: "Ароматный многолетник. Цветёт в июне–июле. Привлекает пчёл.",
    notes: "Требует укрытия на зиму в зонах 4–5.",
    image_url: "",
  },
  {
    id: "P003",
    category: "Многолетники",
    subcategory: "Цветущие",
    name: "Эхинацея пурпурная",
    latin_name: "Echinacea purpurea",
    variety: "Magnus",
    size: "Н 60–80 см",
    container: "С2",
    price_retail: 380,
    price_wholesale: 240,
    discount_default: 0,
    stock_qty: 50,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "50_100",
    frost_zone: "3",
    lifespan_group: "многолетнее",
    flower_color: "пурпурно-розовый",
    leaf_color: "зелёный",
    natural_garden: "true",
    medicinal: "true",
    description: "Крупные цветки с выступающим конусом. Отличный медонос. Засухоустойчив.",
    notes: "",
    image_url: "",
  },
  {
    id: "P004",
    category: "Многолетники",
    subcategory: "Злаки",
    name: "Мискантус китайский",
    latin_name: "Miscanthus sinensis",
    variety: "Зебринус",
    size: "Н 1,5–2 м",
    container: "С5",
    price_retail: 750,
    price_wholesale: 500,
    discount_default: 0,
    stock_qty: 25,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "over_100",
    frost_zone: "4",
    lifespan_group: "многолетнее",
    flower_color: "серебристый",
    leaf_color: "зелёный с жёлтыми полосами",
    natural_garden: "true",
    medicinal: "false",
    description: "Декоративный злак с горизонтальными жёлтыми полосами на листьях. Эффектен весь сезон.",
    notes: "",
    image_url: "",
  },
  // Розы
  {
    id: "R001",
    category: "Розы",
    subcategory: "Парковые",
    name: "Роза парковая",
    latin_name: "Rosa",
    variety: "Дам де Кёр",
    size: "Н 0,8–1,2 м",
    container: "С5",
    price_retail: 1100,
    price_wholesale: 750,
    discount_default: 0,
    stock_qty: 18,
    stock_status: "in_stock",
    light: "sun",
    moisture: "moderate",
    height_group: "50_100",
    frost_zone: "5",
    lifespan_group: "многолетнее",
    flower_color: "красный",
    leaf_color: "тёмно-зелёный",
    natural_garden: "false",
    medicinal: "false",
    description: "Морозостойкая парковая роза. Крупные махровые цветки насыщенно-красного цвета.",
    notes: "Требует укрытия в USDA 5.",
    image_url: "",
  },
  {
    id: "R002",
    category: "Розы",
    subcategory: "Почвопокровные",
    name: "Роза почвопокровная",
    latin_name: "Rosa",
    variety: "Свани",
    size: "Н 0,5 м",
    container: "С3",
    price_retail: 820,
    price_wholesale: 560,
    discount_default: 5,
    stock_qty: 0,
    stock_status: "out",
    light: "sun",
    moisture: "moderate",
    height_group: "20_50",
    frost_zone: "4",
    lifespan_group: "многолетнее",
    flower_color: "белый",
    leaf_color: "тёмно-зелёный",
    natural_garden: "false",
    medicinal: "false",
    description: "Компактная розетка с белыми пышными цветками. Отличное решение для склонов.",
    notes: "Сезон закрыт. Ожидайте в следующем сезоне.",
    image_url: "",
  },
];

// Build workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
ws["!cols"] = [
  { wch: 8 },   // id
  { wch: 16 },  // category
  { wch: 18 },  // subcategory
  { wch: 28 },  // name
  { wch: 24 },  // latin_name
  { wch: 20 },  // variety
  { wch: 12 },  // size
  { wch: 10 },  // container
  { wch: 14 },  // price_retail
  { wch: 16 },  // price_wholesale
  { wch: 18 },  // discount_default
  { wch: 12 },  // stock_qty
  { wch: 12 },  // stock_status
  { wch: 16 },  // light
  { wch: 12 },  // moisture
  { wch: 16 },  // height_group
  { wch: 12 },  // frost_zone
  { wch: 16 },  // lifespan_group
  { wch: 16 },  // flower_color
  { wch: 16 },  // leaf_color
  { wch: 16 },  // natural_garden
  { wch: 12 },  // medicinal
  { wch: 40 },  // description
  { wch: 40 },  // notes
  { wch: 40 },  // image_url
];

XLSX.utils.book_append_sheet(wb, ws, "Каталог");

const outPath = path.resolve(__dirname, "../public/sample_catalog.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`✅ Sample catalog written to: ${outPath}`);
console.log(`   ${sampleData.length} plants in ${[...new Set(sampleData.map(r => r.category))].length} categories`);
