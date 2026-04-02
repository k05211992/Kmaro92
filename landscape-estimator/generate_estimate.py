#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_estimate.py
Читает 23-24 благоуст-во.xlsx → создаёт КП_NEW.xlsx с двумя листами:
  "Расчет"         — плоская таблица (13 полей, формулы)
  "Печатная форма" — документ по форме PDF-эталона

Запуск: uv run --with openpyxl python generate_estimate.py
При добавлении строк в "Расчет": перезапустить скрипт для обновления печатной формы.
"""

import os, sys
from dataclasses import dataclass
from typing import List, Tuple

import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# ── paths ──────────────────────────────────────────────────────────────────
HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(HERE, "23-24 благоуст-во.xlsx")
DST  = os.path.join(HERE, "КП_NEW.xlsx")

# ── data model ─────────────────────────────────────────────────────────────
@dataclass
class Row:
    print_flag:  str    # "да" / "нет"
    sec_no:      str    # "1" .. "15"
    sec_name:    str
    sub_name:    str    # текущий подраздел
    row_type:    str    # work | material | subsection | section14_item |
                        # section15_percent | section15_manual
    sort_order:  int
    item_name:   str
    unit:        str
    qty:         float
    unit_price:  float
    note:        str

# ── helpers ────────────────────────────────────────────────────────────────
def _s(x):
    if x is None: return None
    s = str(x).strip()
    return s if s else None

def _f(x, default=0.0):
    try: return float(x)
    except: return default

SKIP_B = {
    "ВСЕГО ПО РАЗДЕЛУ:", "ИТОГО:", "ИТОГО",
    "ВСЕГО работы по благоустройству", "ВСЕГО по смете:",
    "Наименование работ",
}
SKIP_F = {"ИТОГО:", "ВСЕГО ПО РАЗДЕЛУ:"}

# ── parser ─────────────────────────────────────────────────────────────────
def parse(path: str) -> List[Row]:
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows: List[Row] = []
    sec_no = None; sec_name = ""; sub_name = ""
    in_14 = False; in_15 = False; sort_order = 0

    for r in ws.iter_rows(values_only=True):
        pad = list(r) + [None] * 10
        a, b, c, d, e, f, g, h = (_s(pad[k]) for k in range(8))

        if not any(pad[k] is not None for k in range(8)):
            continue

        b_s = b or ""
        f_s = f or ""

        if b_s in SKIP_B or f_s in SKIP_F:
            continue

        # section header: detected by C == "Ед. изм."
        if c == "Ед. изм.":
            raw = str(a) if a else b_s
            sec_no   = raw.rstrip('.').strip()
            sec_name = b_s
            sub_name = ""
            in_14 = (sec_no == "14")
            in_15 = (sec_no == "15")
            continue

        if sec_no is None:
            continue

        # ── section 15 ────────────────────────────────────────────────────
        if in_15:
            if c == "%":
                sort_order += 1
                rows.append(Row(
                    print_flag="да", sec_no="15", sec_name=sec_name,
                    sub_name="", row_type="section15_percent",
                    sort_order=sort_order, item_name=b_s,
                    unit="%", qty=_f(d), unit_price=0.0, note=h or "",
                ))
            elif b_s and a:
                # fixed item (Авторское сопровождение)
                sort_order += 1
                rows.append(Row(
                    print_flag="да", sec_no="15", sec_name=sec_name,
                    sub_name="", row_type="section15_manual",
                    sort_order=sort_order, item_name=b_s,
                    unit="компл.", qty=1.0, unit_price=_f(g), note=h or "",
                ))
            continue

        # ── section 14 ────────────────────────────────────────────────────
        if in_14:
            if a and str(a).isdigit():
                sort_order += 1
                rows.append(Row(
                    print_flag="да", sec_no="14", sec_name=sec_name,
                    sub_name="", row_type="section14_item",
                    sort_order=sort_order, item_name=b_s,
                    unit=c or "", qty=_f(d), unit_price=_f(e), note=h or "",
                ))
            continue

        # ── sections 1–13 ─────────────────────────────────────────────────
        a_num = (a is not None and
                 str(a).lstrip('-').replace('.', '', 1).isdigit() and
                 '.' not in str(a))

        if a_num:
            f_val = _f(f); g_val = _f(g)
            sort_order += 1
            rows.append(Row(
                print_flag="да", sec_no=sec_no, sec_name=sec_name,
                sub_name=sub_name, row_type="work",
                sort_order=sort_order, item_name=b_s,
                unit=c or "", qty=_f(d), unit_price=_f(e), note=h or "",
            ))
            if g_val > 0:
                # work item also has material cost → separate material row
                qty_v = _f(d) or 1.0
                sort_order += 1
                rows.append(Row(
                    print_flag="да", sec_no=sec_no, sec_name=sec_name,
                    sub_name=sub_name, row_type="material",
                    sort_order=sort_order, item_name=b_s,
                    unit=c or "", qty=qty_v,
                    unit_price=round(g_val / qty_v, 6) if qty_v else g_val,
                    note=h or "",
                ))
        elif b_s and c is None:
            # subsection label: no unit column → it's a heading, not data
            sub_name = b_s
            sort_order += 1
            rows.append(Row(
                print_flag="да", sec_no=sec_no, sec_name=sec_name,
                sub_name="", row_type="subsection",
                sort_order=sort_order, item_name=b_s,
                unit="", qty=0.0, unit_price=0.0, note="",
            ))
        elif b_s:
            # material row (no A, has unit)
            g_val = _f(g); f_val = _f(f)
            mat = g_val if g_val else f_val
            qty_v = _f(d) or 1.0
            price = _f(e) if _f(e) else (round(mat / qty_v, 6) if qty_v else mat)
            sort_order += 1
            rows.append(Row(
                print_flag="да", sec_no=sec_no, sec_name=sec_name,
                sub_name=sub_name, row_type="material",
                sort_order=sort_order, item_name=b_s,
                unit=c or "", qty=qty_v, unit_price=price, note=h or "",
            ))

    return rows


# ── styles ─────────────────────────────────────────────────────────────────
HAIR  = Side(style="hair",   color="AAAAAA")
THIN  = Side(style="thin",   color="000000")
MED   = Side(style="medium", color="000000")

def _border(top=HAIR, right=HAIR, bottom=HAIR, left=HAIR):
    return Border(top=top, right=right, bottom=bottom, left=left)

HDR_FILL  = PatternFill("solid", fgColor="1F497D")
SEC_FILL  = PatternFill("solid", fgColor="D6E4F0")
SUB_FILL  = PatternFill("solid", fgColor="EEF4FB")
MAT_FILL  = PatternFill("solid", fgColor="F7F7F7")
S15_FILL  = PatternFill("solid", fgColor="FFF2CC")
TOT_FILL  = PatternFill("solid", fgColor="E2EFDA")

def _cell(ws, row, col, value=None, bold=False, italic=False, size=10,
          color="000000", fill=None, halign=None, valign=None,
          wrap=False, num_fmt=None, border=None):
    c = ws.cell(row, col)
    if value is not None:
        c.value = value
    c.font = Font(bold=bold, italic=italic, size=size,
                  color=color, name="Calibri")
    if fill:
        c.fill = fill
    if halign or valign or wrap:
        c.alignment = Alignment(
            horizontal=halign or "left",
            vertical=valign or "center",
            wrap_text=wrap,
        )
    if num_fmt:
        c.number_format = num_fmt
    if border is not None:
        c.border = border
    return c


# ══════════════════════════════════════════════════════════════════════════
#  SHEET 1 — РАСЧЕТ
# ══════════════════════════════════════════════════════════════════════════

# Base formula for section-15 percent items (sections 1–13, no section 14).
# Uses only E="work"*K and E="material"*L so there's no circular reference.
_BASE = (
    'SUMPRODUCT((E$2:E$5000="work")*(B$2:B$5000<>"14")*K$2:K$5000)'
    '+SUMPRODUCT((E$2:E$5000="material")*(B$2:B$5000<>"14")*L$2:L$5000)'
)

def _works_formula(r):
    return f'=IF(OR(E{r}="work",E{r}="section14_item"),I{r}*J{r},0)'

def _mats_formula(r):
    return (
        f'=IF(E{r}="material",I{r}*J{r},'
        f'IF(E{r}="section15_percent",I{r}/100*({_BASE}),'
        f'IF(E{r}="section15_manual",J{r},0)))'
    )

РАСЧЕТ_COLS = [
    ("print_flag",       10),
    ("section_no",        8),
    ("section_name",     30),
    ("subsection_name",  25),
    ("row_type",         20),
    ("sort_order",        9),
    ("item_name",        55),
    ("unit",             12),
    ("qty",              10),
    ("unit_price",       13),
    ("works_amount",     14),
    ("materials_amount", 14),
    ("note",             40),
]

def write_расчет(wb: Workbook, rows: List[Row]):
    ws = wb.create_sheet("Расчет")
    ws.freeze_panes = "A2"

    for col_i, (name, width) in enumerate(РАСЧЕТ_COLS, 1):
        ws.column_dimensions[get_column_letter(col_i)].width = width

    # header row
    for col_i, (name, _) in enumerate(РАСЧЕТ_COLS, 1):
        _cell(ws, 1, col_i, name,
              bold=True, color="FFFFFF", size=9, fill=HDR_FILL,
              halign="center", wrap=True,
              border=_border(top=THIN, right=THIN, bottom=THIN, left=THIN))

    ws.auto_filter.ref = "A1:M1"
    ws.row_dimensions[1].height = 28

    for idx, row in enumerate(rows, 2):
        r = idx
        # A..M
        ws.cell(r, 1, row.print_flag)
        ws.cell(r, 2, row.sec_no)
        ws.cell(r, 3, row.sec_name)
        ws.cell(r, 4, row.sub_name)
        ws.cell(r, 5, row.row_type)
        ws.cell(r, 6, row.sort_order)
        ws.cell(r, 7, row.item_name)
        ws.cell(r, 8, row.unit)
        if row.qty:    ws.cell(r, 9,  row.qty)
        if row.unit_price: ws.cell(r, 10, row.unit_price)
        ws.cell(r, 11).value = _works_formula(r)
        ws.cell(r, 12).value = _mats_formula(r)
        if row.note:   ws.cell(r, 13, row.note)

        # fill by type
        fill = None
        if row.row_type == "subsection":
            fill = SUB_FILL
        elif row.row_type == "material":
            fill = MAT_FILL
        elif row.row_type in ("section15_percent", "section15_manual"):
            fill = S15_FILL

        br = _border()
        for col_i in range(1, 14):
            c = ws.cell(r, col_i)
            c.font = Font(name="Calibri", size=9)
            c.border = br
            c.alignment = Alignment(vertical="center", wrap_text=(col_i in (3, 7, 13)))
            if fill: c.fill = fill

        # number formats
        for col_i in (9, 10):
            ws.cell(r, col_i).number_format = '#,##0.00'
        for col_i in (11, 12):
            ws.cell(r, col_i).number_format = '#,##0.00'
            ws.cell(r, col_i).font = Font(name="Calibri", size=9,
                                          color="1F497D", bold=True)


# ══════════════════════════════════════════════════════════════════════════
#  SHEET 2 — ПЕЧАТНАЯ ФОРМА
# ══════════════════════════════════════════════════════════════════════════

def _sumifs_works(sec_no):
    return (f'SUMIFS(Расчет!K:K,Расчет!B:B,"{sec_no}",Расчет!E:E,"work")'
            f'+SUMIFS(Расчет!K:K,Расчет!B:B,"{sec_no}",Расчет!E:E,"section14_item")')

def _sumifs_mats(sec_no):
    return f'SUMIFS(Расчет!L:L,Расчет!B:B,"{sec_no}")'

def _sumifs_total(sec_no):
    return f'={_sumifs_works(sec_no)}+{_sumifs_mats(sec_no)}'

PRINT_COLS = {
    'A': 4.5,   # №
    'B': 52.0,  # Наименование
    'C': 11.0,  # Ед. изм.
    'D': 8.0,   # Кол-во
    'E': 10.0,  # Цена
    'F': 12.0,  # Работы
    'G': 12.0,  # Материалы / Стоимость
    'H': 18.0,  # Примечание
}

MONEY_FMT = '#,##0.00'

def write_печатная_форма(wb: Workbook, rows: List[Row],
                          rows_with_idx: List[Tuple[int, Row]]):
    ws = wb.create_sheet("Печатная форма")
    ws.print_area = "A1:H1000"
    ws.page_setup.paperSize  = ws.PAPERSIZE_A4
    ws.page_setup.orientation = ws.ORIENTATION_PORTRAIT
    ws.page_margins.left   = 0.6
    ws.page_margins.right  = 0.6
    ws.page_margins.top    = 0.75
    ws.page_margins.bottom = 0.75

    for col, width in PRINT_COLS.items():
        ws.column_dimensions[col].width = width

    rn = 1  # current row in print form

    # ── шапка ──────────────────────────────────────────────────────────────
    ws.merge_cells(f"C{rn}:H{rn+5}")
    c = ws.cell(rn, 3)
    c.value = ("Ландшафтная студия БОТАНИК\n"
               "Бухарестская ул., д. 110, к. 1\n"
               "Санкт-Петербург, 192288")
    c.font = Font(bold=True, size=12, name="Calibri")
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[rn].height = 14
    rn += 7

    _cell(ws, rn, 2, "Коммерческое предложение №__________.   ", bold=True, size=11)
    rn += 1
    _cell(ws, rn, 2,
          "Расчет цен произведен __.___.202__г. "
          "(цены действительны в течение 7 календарных дней с даты расчета).",
          size=10)
    rn += 2  # blank row

    _cell(ws, rn, 2, "Заказчик: ____________________________________________________________", size=10)
    rn += 1
    _cell(ws, rn, 2, "Исполнитель: Ландшафтная студия БОТАНИК", size=10)
    rn += 1
    _cell(ws, rn, 2, "Адрес проведения работ: ", size=10)
    rn += 2  # blank row

    _cell(ws, rn, 2, "Сроки проведения работ:", size=10)
    rn += 1
    _cell(ws, rn, 2, "начало", size=10)
    rn += 1
    _cell(ws, rn, 2, "окончание", size=10)
    rn += 2  # blank row

    # ── заголовок ──────────────────────────────────────────────────────────
    _cell(ws, rn, 2, "Работы по благоустройству.", bold=True, size=11)
    rn += 1

    # ── сводная таблица ────────────────────────────────────────────────────
    def _hdr_cell(row, col, val):
        _cell(ws, row, col, val, bold=True, size=10,
              fill=SEC_FILL,
              border=_border(top=THIN, right=THIN, bottom=THIN, left=THIN))

    _hdr_cell(rn, 2, "Наименование работ")
    _hdr_cell(rn, 7, "Стоимость")
    rn += 1

    # collect ordered sections
    seen_secs = {}
    for row in rows:
        if row.sec_no not in seen_secs:
            seen_secs[row.sec_no] = row.sec_name

    def _sec_sort_key(k):
        try: return (0, int(k))
        except: return (1, k)

    sections_ordered = sorted(seen_secs.items(), key=lambda x: _sec_sort_key(x[0]))

    sum_start = rn
    for sec_no, sec_name in sections_ordered:
        ws.cell(rn, 1, sec_no).font = Font(name="Calibri", size=10)
        c = ws.cell(rn, 2, sec_name)
        c.font = Font(name="Calibri", size=10)
        c.border = _border(top=HAIR, right=HAIR, bottom=HAIR, left=THIN)
        c = ws.cell(rn, 7)
        c.value = _sumifs_total(sec_no)
        c.number_format = MONEY_FMT
        c.font = Font(name="Calibri", size=10)
        c.border = _border(top=HAIR, right=THIN, bottom=HAIR, left=HAIR)
        rn += 1

    sum_end = rn - 1
    # ВСЕГО по смете
    ws.cell(rn, 2, "ВСЕГО по смете:").font = Font(bold=True, name="Calibri", size=10)
    c = ws.cell(rn, 7)
    c.value = f"=SUM(G{sum_start}:G{sum_end})"
    c.number_format = MONEY_FMT
    c.font = Font(bold=True, name="Calibri", size=10)
    c.fill = TOT_FILL
    rn += 3

    # ── детальные разделы ──────────────────────────────────────────────────
    for sec_no, sec_name in sections_ordered:
        sec_rows = [(расч, row) for расч, row in rows_with_idx
                    if row.sec_no == sec_no]

        # section header row
        is_15 = (sec_no == "15")
        ws.cell(rn, 1, f"{sec_no}.").font = Font(bold=True, name="Calibri", size=10)
        for col_i, val in [(2, sec_name), (3, "Ед. изм."), (4, "Кол-во"), (5, "Цена")]:
            c = ws.cell(rn, col_i, val)
            c.font = Font(bold=True, name="Calibri", size=10)
            c.fill = SEC_FILL
        if is_15:
            ws.cell(rn, 7, "Стоимость").font = Font(bold=True, name="Calibri", size=10)
            ws.cell(rn, 7).fill = SEC_FILL
        else:
            ws.cell(rn, 6, "Работы").font = Font(bold=True, name="Calibri", size=10)
            ws.cell(rn, 6).fill = SEC_FILL
            ws.cell(rn, 7, "Материалы").font = Font(bold=True, name="Calibri", size=10)
            ws.cell(rn, 7).fill = SEC_FILL
        ws.cell(rn, 8, "Примечание").font = Font(bold=True, name="Calibri", size=10)
        ws.cell(rn, 8).fill = SEC_FILL
        rn += 1

        item_counter = 0

        for расч, row in sec_rows:
            rt = row.row_type

            if rt == "subsection":
                c = ws.cell(rn, 2, row.item_name)
                c.font = Font(italic=True, bold=True, name="Calibri", size=9)
                c.fill = SUB_FILL
                ws.merge_cells(f"B{rn}:H{rn}")
                rn += 1

            elif rt == "work":
                item_counter += 1
                ws.cell(rn, 1, item_counter).font = Font(name="Calibri", size=9)
                ws.cell(rn, 2).value = f"=Расчет!G{расч}"
                ws.cell(rn, 3).value = f"=Расчет!H{расч}"
                ws.cell(rn, 4).value = f"=Расчет!I{расч}"
                ws.cell(rn, 5).value = f"=Расчет!J{расч}"
                ws.cell(rn, 6).value = f"=Расчет!K{расч}"
                ws.cell(rn, 8).value = f"=Расчет!M{расч}"
                for col_i in (4, 5, 6):
                    ws.cell(rn, col_i).number_format = MONEY_FMT
                for col_i in range(1, 9):
                    ws.cell(rn, col_i).font = Font(name="Calibri", size=9)
                rn += 1

            elif rt == "material":
                ws.cell(rn, 2).value = f"=Расчет!G{расч}"
                ws.cell(rn, 3).value = f"=Расчет!H{расч}"
                ws.cell(rn, 4).value = f"=Расчет!I{расч}"
                ws.cell(rn, 5).value = f"=Расчет!J{расч}"
                ws.cell(rn, 7).value = f"=Расчет!L{расч}"
                ws.cell(rn, 8).value = f"=Расчет!M{расч}"
                for col_i in (4, 5, 7):
                    ws.cell(rn, col_i).number_format = MONEY_FMT
                for col_i in range(1, 9):
                    c = ws.cell(rn, col_i)
                    c.font = Font(name="Calibri", size=9)
                    c.fill = MAT_FILL
                rn += 1

            elif rt == "section14_item":
                item_counter += 1
                ws.cell(rn, 1, item_counter).font = Font(name="Calibri", size=9)
                ws.cell(rn, 2).value = f"=Расчет!G{расч}"
                ws.cell(rn, 3).value = f"=Расчет!H{расч}"
                ws.cell(rn, 4).value = f"=Расчет!I{расч}"
                ws.cell(rn, 5).value = f"=Расчет!J{расч}"
                ws.cell(rn, 6).value = f"=Расчет!K{расч}"
                for col_i in (4, 5, 6):
                    ws.cell(rn, col_i).number_format = MONEY_FMT
                for col_i in range(1, 9):
                    ws.cell(rn, col_i).font = Font(name="Calibri", size=9)
                rn += 1

            elif rt in ("section15_percent", "section15_manual"):
                item_counter += 1
                ws.cell(rn, 1, item_counter).font = Font(name="Calibri", size=9)
                ws.cell(rn, 2).value = f"=Расчет!G{расч}"
                ws.cell(rn, 3).value = f"=Расчет!H{расч}"
                ws.cell(rn, 4).value = f"=Расчет!I{расч}"   # qty = %
                ws.cell(rn, 7).value = f"=Расчет!L{расч}"
                ws.cell(rn, 7).number_format = MONEY_FMT
                for col_i in range(1, 9):
                    c = ws.cell(rn, col_i)
                    c.font = Font(name="Calibri", size=9)
                    c.fill = S15_FILL
                rn += 1

        # ВСЕГО ПО РАЗДЕЛУ (not for section 15)
        if not is_15:
            ws.cell(rn, 2, "ВСЕГО ПО РАЗДЕЛУ:").font = Font(bold=True, name="Calibri", size=9)
            ws.cell(rn, 2).fill = TOT_FILL
            w_f = _sumifs_works(sec_no)
            m_f = _sumifs_mats(sec_no) + f',Расчет!E:E,"material"'
            # fix: mats only for material rows
            c = ws.cell(rn, 6)
            c.value = f"={w_f}"
            c.number_format = MONEY_FMT
            c.font = Font(bold=True, name="Calibri", size=9)
            c.fill = TOT_FILL
            c = ws.cell(rn, 7)
            c.value = (f'=SUMIFS(Расчет!L:L,Расчет!B:B,"{sec_no}",'
                       f'Расчет!E:E,"material")')
            c.number_format = MONEY_FMT
            c.font = Font(bold=True, name="Calibri", size=9)
            c.fill = TOT_FILL
            rn += 1

        # ИТОГО
        ws.cell(rn, 2, "ИТОГО:").font = Font(bold=True, name="Calibri", size=10)
        ws.cell(rn, 2).fill = TOT_FILL
        c = ws.cell(rn, 7)
        c.value = _sumifs_total(sec_no)
        c.number_format = MONEY_FMT
        c.font = Font(bold=True, name="Calibri", size=10)
        c.fill = TOT_FILL
        rn += 2  # blank separator

    # ── финальный итог ─────────────────────────────────────────────────────
    ws.cell(rn, 2, "ВСЕГО по смете:").font = Font(bold=True, size=12, name="Calibri")
    c = ws.cell(rn, 7)
    c.value = (
        "=SUMIFS(Расчет!K:K,Расчет!A:A,\"да\")"
        "+SUMIFS(Расчет!L:L,Расчет!A:A,\"да\")"
    )
    c.number_format = MONEY_FMT
    c.font = Font(bold=True, size=12, name="Calibri")
    c.fill = TOT_FILL


# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════

def main():
    print(f"Читаю:  {SRC}")
    if not os.path.exists(SRC):
        sys.exit(f"ERROR: файл не найден: {SRC}")

    rows = parse(SRC)
    print(f"Строк разобрано: {len(rows)}")

    # build (расчет_row_index, row) list — header is row 1, data from row 2
    rows_with_idx = [(i + 2, r) for i, r in enumerate(rows)]

    wb = Workbook()
    wb.remove(wb.active)  # remove default sheet

    write_расчет(wb, rows)
    write_печатная_форма(wb, rows, rows_with_idx)

    wb.save(DST)
    print(f"Сохранено: {DST}")
    print(f"  Лист 'Расчет':         {len(rows)} строк данных")
    print(f"  Лист 'Печатная форма': создан по структуре PDF")

if __name__ == "__main__":
    main()
