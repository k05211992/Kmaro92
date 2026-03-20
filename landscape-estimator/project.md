# Генератор смет — Ландшафтные работы

## Что это

Внутренний рабочий инструмент для составления смет и коммерческих предложений по ландшафтным работам. Заменяет ручную работу в Excel: быстрый выбор работ из каталога, расчёт стоимости с коэффициентами и финансовыми условиями, готовый документ для печати.

Используется командой внутри бизнеса. Не SaaS, не публичный продукт. Архитектура намеренно простая, но расширяемая.

---

## Текущий стек

- **Next.js 14.2.5** (App Router, SSG)
- **TypeScript**
- **Tailwind CSS 3.4.1**
- **localStorage** — основное хранилище (черновик, история, каталог, шаблоны)
- **Нет бэкенда, нет авторизации, нет базы данных**

---

## Страницы

| Страница | Маршрут | Статус |
|---|---|---|
| Генератор смет | `/` | ✓ готово |
| Предпросмотр и печать | `/print` | ✓ готово |
| Каталог (настройка) | `/catalog` | ✓ готово |

История смет и шаблоны реализованы как боковые панели на главной странице (`/`), не как отдельные маршруты.

---

## Что реализовано

### Генератор смет (`/`)

- Добавление работ из каталога (категория + вариант + количество)
- Ручные строки работ (произвольное название, ед. изм., цена)
- Материалы с автодополнением из каталога
- Дополнительные расходы с подсказками (доставка, вывоз мусора и т.д.)
- Коэффициент сложности объекта (ползунок 1.0–1.5, применяется только к работам из каталога)
- Финансовые условия: наценка (% или фикс), скидка (% или фикс), минимальный заказ, предоплата
- Итоговый блок с разбивкой: работы → материалы → доп. расходы → наценка → скидка → итого → предоплата → остаток
- Автосохранение черновика в localStorage
- **История смет**: сохранение, открытие, дублирование, удаление (до 50 записей)
- **Шаблоны**: 4 встроенных + сохранение своих

### Печать (`/print`)

- Профессиональный печатный документ (A4)
- Номер сметы (формат СМ-YYYYMMDD-XXXX), дата
- Блоки: клиент / объект, работы, материалы, доп. расходы, финансовый итог, подписи
- Настройки: показывать/скрывать комментарии, показывать/скрывать детали финансов
- Данные передаются через `sessionStorage` (без перезагрузки)

### Каталог (`/catalog`)

- Управление категориями работ и вариантами цен (добавление, редактирование, вкл/выкл)
- Управление материалами (название, ед. изм., цена по умолчанию)
- Управление коэффициентами (диапазон min/max)
- Управление пресетами доп. расходов
- Импорт из XLSX (`npm run import:catalog`)
- Экспорт в JSON
- Сброс к дефолтным значениям
- Все изменения сохраняются в localStorage

---

## Основные сущности

```
WorkInput          — строка работы из каталога {category, variant, quantity}
ManualLine         — ручная строка работы {title, unit, quantity, price}
MaterialLine       — материал {title, unit, quantity, price}
ExtraCost          — доп. расход {title, amount}
FinancialTerms     — финансовые условия {markup, discount, minimum, prepayment}
Estimate           — собранная смета со всеми подитогами и финансовым итогом
SavedEstimate      — запись в истории
EstimateTemplate   — шаблон сметы
Catalog            — каталог {works, materials, coefficients, extraCostPresets}
```

---

## Хранилище (localStorage)

| Ключ | Содержимое |
|---|---|
| `landscape_estimator_draft` | Текущий черновик сметы |
| `landscape_estimator_history` | История сохранённых смет (до 50) |
| `landscape_templates_v1` | Шаблоны (встроенные + пользовательские) |
| `landscape_catalog_v1` | Каталог (v1, текущий рабочий) |
| `landscape_catalog_v2_preview` | Feature flag для catalog v2 (строка `"true"`) |

---

## Catalog v2 — текущее состояние

Catalog v2 — это нормализованный каталог работ и материалов, импортированный из `KP_Generator_Template_v6_real_import.xlsx`. Цель — стать новым основным источником данных каталога, заменив `src/config/pricing.json` и `src/config/materials.json`.

**Что сделано:**

- `data/catalog-v2/works.json` — 157 работ
- `data/catalog-v2/materials.json` — 121 материал
- `data/catalog-v2/work-variants.json`, `material-variants.json`
- `data/catalog-v2/raw-mapping.json` — маппинг исходных строк
- `data/catalog-v2/manual-remap.json` — ручные переопределения (1 материал)
- `data/catalog-v2/legacy-backfill-works.json` — 11 работ из v1 без аналога в v2
- `data/catalog-v2/legacy-backfill-materials.json` — 4 материала из v1 без аналога в v2
- `src/lib/catalogV2/` — adapter layer: types, normalize, canonicalMap, adapter, featureFlag

**Adapter pipeline (приоритет):**
1. exact id match
2. canonical map (статический `category:variant` → `RWORK-XXXX`)
3. manual-remap.json
4. legacy-key / legacy-title (backfill)
5. normalized title (fuzzy, только v2, без backfill)
6. requiresRemap

**Текущий результат:**
- Works: 22/22 resolved (11 canonical + 11 legacy-key, 0 fuzzy, 0 requiresRemap)
- Materials: 15/15 resolved (7 canonical + 1 manual-remap + 4 legacy + 3 fuzzy, 0 requiresRemap)

**Активация preview:** `localStorage.setItem("landscape_catalog_v2_preview", "true")`
**UI по умолчанию работает на v1.** Переключение на v2 по умолчанию — следующий шаг.

**Regression тест:** `npm run test:catalog-v2` — 12 автоматических проверок, 12/12 PASS.

---

## Что не входит в текущий MVP

- Авторизация и роли пользователей
- Отдельная страница для клиента (view-only)
- Аналитика и дашборды
- Управление несколькими проектами / объектами
- CRM-логика
- Синхронизация между устройствами
- Облачное хранилище

---

## Ближайшие шаги

1. Пройти ручной browser-чеклист из `data/catalog-v2/preview-regression-report.json` (10 сценариев)
2. Переключить основной UI на catalog v2 по умолчанию
3. Убрать или заархивировать `src/config/pricing.json` и `src/config/materials.json` как legacy
4. Обновить страницу `/catalog` для работы с v2-структурой (RWORK/RMAT IDs)

---

## Скрипты

```bash
npm run dev              # запуск dev-сервера
npm run build            # production build
npm run import:catalog   # импорт каталога из XLSX
npm run test:catalog-v2  # regression тест adapter layer
```
