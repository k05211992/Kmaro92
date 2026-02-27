# bank2_summary.xlsx — сводка по bank2_flat.csv

$data = Import-Csv -Path "bank2_flat.csv" -Delimiter ";"

function Get-Num($s) {
    $s = ($s.Trim() -replace '[\s\u00A0]', '') -replace ',', '.'
    $v = 0.0
    [double]::TryParse($s, [System.Globalization.NumberStyles]::Any,
        [System.Globalization.CultureInfo]::InvariantCulture, [ref]$v) | Out-Null
    return $v
}

foreach ($row in $data) {
    $row | Add-Member -NotePropertyName n -NotePropertyValue (Get-Num $row.summa) -Force
}

$income  = $data | Where-Object { $_.razdel -eq "Postuplenie" }
$expense = $data | Where-Object { $_.razdel -eq "Raskhod" }
$totIn   = ($income  | Measure-Object -Property n -Sum).Sum
$totEx   = ($expense | Measure-Object -Property n -Sum).Sum

$mNames = @{
    "01"="Январь";"02"="Февраль";"03"="Март";"04"="Апрель";
    "05"="Май";"06"="Июнь";"07"="Июль";"08"="Август";
    "09"="Сентябрь";"10"="Октябрь";"11"="Ноябрь";"12"="Декабрь"
}

# ── Excel ──────────────────────────────────────────────────────────────────
$xl = New-Object -ComObject Excel.Application
$xl.Visible        = $false
$xl.DisplayAlerts  = $false
$wb = $xl.Workbooks.Add()
while ($wb.Sheets.Count -gt 1) { $wb.Sheets.Item($wb.Sheets.Count).Delete() }

$fmt = "# ##0,00"

function New-Sheet($name) {
    $ws = $wb.Sheets.Add([Type]::Missing, $wb.Sheets.Item($wb.Sheets.Count))
    $ws.Name = $name
    return $ws
}

function Write-Header($ws, $row, [string[]]$cols) {
    for ($c = 0; $c -lt $cols.Count; $c++) {
        $cell = $ws.Cells.Item($row, $c + 1)
        $cell.Value2   = $cols[$c]
        $cell.Font.Bold = $true
        $cell.Interior.Color = 0xD9E1F2   # светло-голубой
    }
}

function Set-Num($ws, $row, $col, $val) {
    $cell = $ws.Cells.Item($row, $col)
    $cell.Value2       = $val
    $cell.NumberFormat = $fmt
}

# ── 1. Сводка ─────────────────────────────────────────────────────────────
$ws1 = $wb.Sheets.Item(1)
$ws1.Name = "Сводка"

$ws1.Cells.Item(1,1).Value2 = "ИТОГО 2025"
$ws1.Cells.Item(1,1).Font.Bold = $true
$ws1.Cells.Item(1,1).Font.Size = 14

Write-Header $ws1 2 @("Раздел","Сумма")
$ws1.Cells.Item(3,1).Value2 = "Поступления"
Set-Num      $ws1 3 2 $totIn
$ws1.Cells.Item(4,1).Value2 = "Расходы"
Set-Num      $ws1 4 2 $totEx
$ws1.Cells.Item(5,1).Value2 = "Баланс"
$ws1.Cells.Item(5,1).Font.Bold = $true
Set-Num      $ws1 5 2 ($totIn - $totEx)
$ws1.Cells.Item(5,2).Font.Bold = $true
$ws1.Columns.AutoFit() | Out-Null

# ── 2. По месяцам ─────────────────────────────────────────────────────────
$ws2 = New-Sheet "По месяцам"
Write-Header $ws2 1 @("Месяц","Поступления","Расходы","Баланс")

$allMonths = $data | ForEach-Object {
    if ($_.data -match '^\d{2}\.(\d{2})\.\d{2,4}') { $Matches[1] }
} | Sort-Object -Unique

$r = 2
foreach ($m in $allMonths) {
    $mIn = ($income  | Where-Object { $_.data -match "^\d{2}\.$m\." } | Measure-Object -Property n -Sum).Sum
    $mEx = ($expense | Where-Object { $_.data -match "^\d{2}\.$m\." } | Measure-Object -Property n -Sum).Sum
    if (-not $mIn) { $mIn = 0.0 }
    if (-not $mEx) { $mEx = 0.0 }
    $ws2.Cells.Item($r,1).Value2 = if ($mNames[$m]) { $mNames[$m] } else { $m }
    Set-Num $ws2 $r 2 $mIn
    Set-Num $ws2 $r 3 $mEx
    Set-Num $ws2 $r 4 ($mIn - $mEx)
    $r++
}
$ws2.Columns.AutoFit() | Out-Null

# ── 3. По объектам ────────────────────────────────────────────────────────
$ws3 = New-Sheet "По объектам"
Write-Header $ws3 1 @("Объект","Поступления","Расходы","Баланс")

$objList = $data | Where-Object { $_.obekt -ne "" } |
    Select-Object -ExpandProperty obekt | Sort-Object -Unique

$r = 2
foreach ($obj in $objList) {
    $oIn = ($income  | Where-Object { $_.obekt -eq $obj } | Measure-Object -Property n -Sum).Sum
    $oEx = ($expense | Where-Object { $_.obekt -eq $obj } | Measure-Object -Property n -Sum).Sum
    if (-not $oIn) { $oIn = 0.0 }
    if (-not $oEx) { $oEx = 0.0 }
    if ($oIn + $oEx -eq 0) { continue }
    $ws3.Cells.Item($r,1).Value2 = $obj
    Set-Num $ws3 $r 2 $oIn
    Set-Num $ws3 $r 3 $oEx
    Set-Num $ws3 $r 4 ($oIn - $oEx)
    $r++
}
$ws3.Columns.AutoFit() | Out-Null

# ── 4. По категориям ──────────────────────────────────────────────────────
$ws4 = New-Sheet "По категориям"
Write-Header $ws4 1 @("Категория","Поступления","Расходы")

$catList = $data | Where-Object { $_.kategoriya -ne "" } |
    Select-Object -ExpandProperty kategoriya | Sort-Object -Unique

$r = 2
foreach ($cat in $catList) {
    $cIn = ($income  | Where-Object { $_.kategoriya -eq $cat } | Measure-Object -Property n -Sum).Sum
    $cEx = ($expense | Where-Object { $_.kategoriya -eq $cat } | Measure-Object -Property n -Sum).Sum
    if (-not $cIn) { $cIn = 0.0 }
    if (-not $cEx) { $cEx = 0.0 }
    $ws4.Cells.Item($r,1).Value2 = $cat
    Set-Num $ws4 $r 2 $cIn
    Set-Num $ws4 $r 3 $cEx
    $r++
}
$ws4.Columns.AutoFit() | Out-Null

# ── 5. По контрагентам ────────────────────────────────────────────────────
$ws5 = New-Sheet "По контрагентам"
Write-Header $ws5 1 @("Контрагент","Поступления","Расходы")

$kontList = $data | Select-Object -ExpandProperty kontragent | Sort-Object -Unique
$r = 2
foreach ($k in $kontList) {
    $kIn = ($income  | Where-Object { $_.kontragent -eq $k } | Measure-Object -Property n -Sum).Sum
    $kEx = ($expense | Where-Object { $_.kontragent -eq $k } | Measure-Object -Property n -Sum).Sum
    if (-not $kIn) { $kIn = 0.0 }
    if (-not $kEx) { $kEx = 0.0 }
    $ws5.Cells.Item($r,1).Value2 = $k
    Set-Num $ws5 $r 2 $kIn
    Set-Num $ws5 $r 3 $kEx
    $r++
}
$ws5.Columns.AutoFit() | Out-Null

# ── 6. Данные (плоская таблица) ───────────────────────────────────────────
$ws6 = New-Sheet "Данные"
Write-Header $ws6 1 @("Раздел","Тип","Дата","№ п/п","Контрагент","Сумма",
    "Назначение","Объект","Счёт","С/Ф","Накл","Акт","Категория")

$r = 2
foreach ($row in $data) {
    $ws6.Cells.Item($r,1).Value2  = if ($row.razdel -eq "Postuplenie") { "Поступление" } else { "Расход" }
    $ws6.Cells.Item($r,2).Value2  = $row.tip
    $ws6.Cells.Item($r,3).Value2  = $row.data
    $ws6.Cells.Item($r,3).NumberFormat = "@"   # текст, чтобы не менял дату
    $ws6.Cells.Item($r,4).Value2  = $row.nom
    $ws6.Cells.Item($r,5).Value2  = $row.kontragent
    Set-Num $ws6 $r 6 $row.n
    $ws6.Cells.Item($r,7).Value2  = $row.naznachenie
    $ws6.Cells.Item($r,8).Value2  = $row.obekt
    $ws6.Cells.Item($r,9).Value2  = $row.schet
    $ws6.Cells.Item($r,10).Value2 = $row.sf
    $ws6.Cells.Item($r,11).Value2 = $row.nakl
    $ws6.Cells.Item($r,12).Value2 = $row.akt
    $ws6.Cells.Item($r,13).Value2 = $row.kategoriya
    $r++
}
$ws6.Columns.AutoFit() | Out-Null

# Переключиться на первый лист
$wb.Sheets.Item(1).Activate()

# ── Сохранение ────────────────────────────────────────────────────────────
$outPath = [System.IO.Path]::Combine((Get-Location).Path, "bank2_summary.xlsx")
if (Test-Path $outPath) { Remove-Item $outPath }
$wb.SaveAs($outPath, 51)   # 51 = xlOpenXMLWorkbook
$wb.Close($false)
$xl.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null

Write-Host "Сохранено: $outPath"
