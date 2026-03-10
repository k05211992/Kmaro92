/**
 * Нормализация прайс-листов питомника «Ботаник» (весна 2026)
 * в формат sample_catalog для nursery-app.
 *
 * Запуск: node scripts/normalize-botanik-price.js
 * Результат: public/прайс_ботаник_весна_2026.xlsx
 */

const XLSX = require('xlsx');
const path = require('path');

// ─── Botanical knowledge base ────────────────────────────────────────────────
// Keyed by Latin genus (first word of latin_name, lowercase)
const genusMeta = {
  // ХВОЙНЫЕ
  picea:        { light:'partial_shade', moisture:'moderate', height_group:'over_100', frost_zone:'2', flower_color:'', leaf_color:'тёмно-зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  pinus:        { light:'sun',           moisture:'dry',      height_group:'over_100', frost_zone:'2', flower_color:'', leaf_color:'зелёный',        natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  // ЛИСТВЕННЫЕ ДЕРЕВЬЯ
  salix:        { light:'sun',           moisture:'wet',      height_group:'over_100', frost_zone:'2', flower_color:'', leaf_color:'зелёный',        natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  acer:         { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'жёлтый', leaf_color:'зелёный',  natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  betula:       { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'2', flower_color:'', leaf_color:'зелёный',        natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  malus:        { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'4', flower_color:'розовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  // КУСТАРНИКИ ЛИСТВЕННЫЕ
  aralia:       { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',  natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  berberis:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'жёлтый',  leaf_color:'пурпурный', natural_garden:'false', medicinal:'true',  lifespan_group:'многолетнее' },
  euonymus:     { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  buddleja:     { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  parthenocissus:{ light:'partial_shade', moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'',       leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  cerasus:      { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hydrangea:    { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  deutzia:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  cornus:       { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'2', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  diervilla:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  genista:      { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  lonicera:     { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'жёлто-розовый', leaf_color:'зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  viburnum:     { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  forsythia:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  humulus:      { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'зеленоватый', leaf_color:'зелёный', natural_garden:'true', medicinal:'true',  lifespan_group:'многолетнее' },
  philadelphus: { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  rosa:         { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'разный',  leaf_color:'тёмно-зелёный', natural_garden:'false', medicinal:'true', lifespan_group:'многолетнее' },
  sorbaria:     { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'2', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  securinega:   { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  flueggea:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  syringa:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  ribes:        { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  spiraea:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  hippophae:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'2', flower_color:'',        leaf_color:'серебристо-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  paeonia:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  physocarpus:  { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'пурпурный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  potentilla:   { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'2', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  rubus:        { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  prunus:       { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'4', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  // МНОГОЛЕТНИКИ
  acorus:       { light:'sun',           moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  aquilegia:    { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'синий',   leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  aquillegia:   { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'синий',   leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  aconitum:     { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  amsonia:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'голубой', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  anaphalis:    { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'белый',   leaf_color:'серебристый', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  anemone:      { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  arisaema:     { light:'shade',         moisture:'wet',      height_group:'20_50',    frost_zone:'4', flower_color:'зеленоватый', leaf_color:'зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  astilbe:      { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  astilboides:  { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  aster:        { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  eurybia:      { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'сиреневый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  symphyotrichum:{ light:'sun',          moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  astrantia:    { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  bergenia:     { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  baptisia:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  vinca:        { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'синий',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  belamcanda:   { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'оранжевый', leaf_color:'зелёный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  petasites:    { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  boehmeria:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'',        leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  brunnera:     { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'голубой', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  ligularia:    { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  jasione:      { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  betonica:     { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  stachys:      { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'серебристый', natural_garden:'true', medicinal:'true',  lifespan_group:'многолетнее' },
  waldsteinia:  { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  centaurea:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  thalictrum:   { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'сиреневый', leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  asclepias:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'оранжевый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  anthericum:   { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  lysimachia:   { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  verbena:      { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'5', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  atractylodes: { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'false', medicinal:'true',  lifespan_group:'многолетнее' },
  vernonia:     { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'пурпурный', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  veronica:     { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  veronicastrum:{ light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  aruncus:      { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  buglossoides: { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  dianthus:     { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'серо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  heuchera:     { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'4', flower_color:'красный', leaf_color:'пурпурный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  helenium:     { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  heliopsis:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  geranium:     { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'сиреневый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  gillenia:     { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  gypsophila:   { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  cephalaria:   { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  polygonum:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  persicaria:   { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  bistorta:     { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  gentiana:     { light:'sun',           moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  epimedium:    { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  geum:         { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'оранжевый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  darmera:      { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  inula:        { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  lythrum:      { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'пурпурный', leaf_color:'зелёный', natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  plagiorhegma: { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'сиреневый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  jeffersonia:  { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  dicentra:     { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  calamintha:   { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  origanum:     { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  archangelica: { light:'partial_shade', moisture:'wet',      height_group:'over_100', frost_zone:'3', flower_color:'зеленоватый', leaf_color:'зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  ajuga:        { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'синий',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  hypericum:    { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  galeobdolon:  { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'пёстрый',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  dracocephalum:{ light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  phlomis:      { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'5', flower_color:'жёлтый',  leaf_color:'серый',     natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  iris:         { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hyssopus:     { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  kalimeris:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  saxifraga:    { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  crambe:       { light:'sun',           moisture:'dry',      height_group:'over_100', frost_zone:'4', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  kirengeshoma: { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  trifolium:    { light:'sun',           moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  clematis:     { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  atragene:     { light:'partial_shade', moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  campanula:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  phyteuma:     { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'4', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  asarum:       { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'коричневый', leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  verbascum:    { light:'sun',           moisture:'dry',      height_group:'over_100', frost_zone:'4', flower_color:'жёлтый',  leaf_color:'серый',     natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  knautia:      { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'пурпурный', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  nepeta:       { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'синий',   leaf_color:'серо-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  sanguisorba:  { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'тёмно-красный', leaf_color:'зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  trollius:     { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  polygonatum:  { light:'shade',         moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  filipendula:  { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  lavandula:    { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'5', flower_color:'фиолетовый', leaf_color:'серо-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  convallaria:  { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'2', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  leucanthemella:{ light:'sun',          moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  liatris:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'пурпурный', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hemerocallis: { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'оранжевый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  lilium:       { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  lychnis:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'красный', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  viscaria:     { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  allium:       { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  levisticum:   { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  ranunculus:   { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  maianthemum:  { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  mazus:        { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  macleay:      { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'4', flower_color:'белый',   leaf_color:'сизо-зелёный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  alcea:        { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  alchemilla:   { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  pulmonaria:   { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'синий',   leaf_color:'пятнистый', natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  melissa:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  erigeron:     { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  myrrhis:      { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  meehania:     { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'голубой', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  agastache:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'5', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  sempervivum:  { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  euphorbia:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'жёлтый',  leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  monarda:      { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'красный', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  echinops:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'серо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  helleborus:   { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  sagina:       { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  saponaria:    { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  mentha:       { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  digitalis:    { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  leucanthemum: { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  sedum:        { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'розовый', leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  patrinia:     { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  pachysandra:  { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  penstemon:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'5', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hepatica:     { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  tanacetum:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  galium:       { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  asperula:     { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  artemisia:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'серебристый', natural_garden:'true', medicinal:'true',  lifespan_group:'многолетнее' },
  eupatorium:   { light:'sun',           moisture:'wet',      height_group:'over_100', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  primula:      { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  pulsatilla:   { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  anthemis:     { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  chamaemelum:  { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'5', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  rheum:        { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  rodgersia:    { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  rudbeckia:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  ruta:         { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'5', flower_color:'жёлтый',  leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'true', lifespan_group:'многолетнее' },
  succisa:      { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  sidalcea:     { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  silphium:     { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  eryngium:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'синий',   leaf_color:'синевато-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  syneilesis:   { light:'shade',         moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  cacalia:      { light:'shade',         moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  polemonium:   { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  scabiosa:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'синий',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  smilacina:    { light:'shade',         moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  aegopodium:   { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'2', flower_color:'белый',   leaf_color:'пёстрый',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  solidaster:   { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  galatella:    { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  tellima:      { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  tiarella:     { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  thymus:       { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  achillea:     { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  uvularia:     { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  viola:        { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'фиолетовый', leaf_color:'зелёный', natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  phygelius:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'6', flower_color:'оранжевый', leaf_color:'зелёный', natural_garden:'false', medicinal:'false', lifespan_group:'многолетнее' },
  physostegia:  { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  phlox:        { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'разный',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  chelone:      { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  hylomecon:    { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hosta:        { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'лиловый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  corydalis:    { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'синий',   leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  cimicifuga:   { light:'shade',         moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  actea:        { light:'shade',         moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'белый',   leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  salvia:       { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'синий',   leaf_color:'серо-зелёный', natural_garden:'true', medicinal:'true',  lifespan_group:'многолетнее' },
  oenothera:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  echinacea:    { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'розовый', leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  lamium:       { light:'shade',         moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'розовый', leaf_color:'пёстрый',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  hieracium:    { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'жёлтый',  leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  // ЗЛАКИ
  milium:       { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'золотисто-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  calamagrostis:{ light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  phalaris:     { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'бело-зелёный полосатый', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  leymus:       { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'сизо-голубой', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  brachypodium: { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  glyceria:     { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'бело-зелёный полосатый', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  miscanthus:   { light:'sun',           moisture:'moderate', height_group:'over_100', frost_zone:'4', flower_color:'серебристый', leaf_color:'зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  molinia:      { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  festuca:      { light:'sun',           moisture:'dry',      height_group:'under_20', frost_zone:'3', flower_color:'',        leaf_color:'сизо-голубой', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  luzula:       { light:'partial_shade', moisture:'moderate', height_group:'under_20', frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  carex:        { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  eriophorum:   { light:'sun',           moisture:'wet',      height_group:'20_50',    frost_zone:'2', flower_color:'белый',   leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  spodiopogon:  { light:'sun',           moisture:'moderate', height_group:'50_100',   frost_zone:'4', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  sporobolus:   { light:'sun',           moisture:'dry',      height_group:'50_100',   frost_zone:'4', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  sesleria:     { light:'sun',           moisture:'dry',      height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'сизо-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  briza:        { light:'sun',           moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hakonechloa:  { light:'partial_shade', moisture:'moderate', height_group:'20_50',    frost_zone:'5', flower_color:'',        leaf_color:'золотисто-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  chasmanthium: { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'5', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  hystrix:      { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  deschampsia:  { light:'partial_shade', moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  // ПАПОРОТНИКИ
  adiantum:     { light:'shade',         moisture:'wet',      height_group:'20_50',    frost_zone:'4', flower_color:'',        leaf_color:'светло-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  athyrium:     { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  lunathyrium:  { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'4', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  polystichum:  { light:'shade',         moisture:'moderate', height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  onoclea:      { light:'partial_shade', moisture:'wet',      height_group:'20_50',    frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  matteuccia:   { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'ярко-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
  equisetum:    { light:'sun',           moisture:'wet',      height_group:'50_100',   frost_zone:'2', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'true',  lifespan_group:'многолетнее' },
  osmundastrum: { light:'partial_shade', moisture:'wet',      height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'зелёный',   natural_garden:'true',  medicinal:'false', lifespan_group:'многолетнее' },
  dryopteris:   { light:'shade',         moisture:'moderate', height_group:'50_100',   frost_zone:'3', flower_color:'',        leaf_color:'тёмно-зелёный', natural_garden:'true', medicinal:'false', lifespan_group:'многолетнее' },
};

const defaultMeta = {
  light: 'sun', moisture: 'moderate', height_group: '50_100', frost_zone: '3',
  flower_color: '', leaf_color: 'зелёный', natural_garden: 'false',
  medicinal: 'false', lifespan_group: 'многолетнее',
};

function getMeta(latinName) {
  if (!latinName) return defaultMeta;
  const genus = latinName.trim().split(/[\s(]/)[0].toLowerCase().replace(/[^a-z]/g, '');
  return genusMeta[genus] || defaultMeta;
}

// ─── Condition/container parser ───────────────────────────────────────────────
function parseCondition(raw) {
  if (!raw) return { container: '', size: '' };
  const s = String(raw).trim()
    .replace(/С/g, 'C')   // Cyrillic С → Latin C
    .replace(/\s+/g, ' ');

  // Patterns: container size [trunk]
  // e.g. "C70 120-140", "RB50 120-140", "C125 175-200 30/35", "C70 80-100*100-125"
  // "C40 H150-170", "C5", "RB50"
  const m = s.match(/^([A-Z]+[\w.,\-]*(?:\s*bag)?)\s*([\d\-\*×]+(?:\s*[\d\/]+)?)?\s*(?:[\d\/]+)?$/);
  let container = s;
  let size = '';

  // Extract container: first token that matches container pattern
  const containerMatch = s.match(/^([A-Z]+[\d.,\-]*(?:\s*bag)?(?:\s*C[\d.,\-]*)?)/i);
  if (containerMatch) {
    container = containerMatch[0].trim();
    const rest = s.slice(container.length).trim();
    // Size is H+number or numbers like "120-140" or "80-100*100-125"
    // Strip trailing trunk diameter like "30/35" or "18/20" at end
    const sizeMatch = rest.match(/^([Hh]?\s*\d[\d\-\*×\.]*)/);
    if (sizeMatch) {
      let sizeVal = sizeMatch[1].trim().replace(/^[Hh]\s*/, '').trim();
      // Check if it looks like HxW (shrub)
      if (sizeVal.includes('*')) {
        sizeVal = sizeVal.replace('*', '×');
        size = 'В/Ш ' + sizeVal + ' см';
      } else if (sizeVal) {
        size = 'Н ' + sizeVal + ' см';
      }
    }
  }

  return { container: container.replace(/\s+/g, ' ').trim(), size: size.trim() };
}

// ─── Name / variety extractor ─────────────────────────────────────────────────
function parseName(raw) {
  if (!raw) return { name: '', variety: '' };
  const s = String(raw).trim().replace(/\s+/g, ' ');
  // Extract variety from quotes
  const m = s.match(/^(.+?)\s*['\'«](.+?)['\'»]\s*$/);
  if (m) {
    return { name: m[1].trim(), variety: m[2].trim() };
  }
  return { name: s, variety: '' };
}

// ─── Price parser ─────────────────────────────────────────────────────────────
function parsePrice(val) {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(String(val).replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

// ─── Stock status ─────────────────────────────────────────────────────────────
function stockStatus(qty) {
  if (qty === '' || qty === null || qty === undefined || qty === 0) return 'order';
  const n = Number(qty);
  if (isNaN(n) || n === 0) return 'order';
  if (n <= 5) return 'low';
  return 'in_stock';
}

// ─── Section detection ────────────────────────────────────────────────────────
// Returns true if row is a section header (col[0] empty, col[1] not empty, col[2] and col[3] empty)
function isSectionOrGenus(row) {
  const c1 = String(row[1]).trim();
  const c2 = String(row[2]).trim();
  const c3 = String(row[3]).trim();
  return c1 !== '' && c2 === '' && c3 === '';
}

// ─── Parse TREES file ─────────────────────────────────────────────────────────
function parseTrees() {
  const wb = XLSX.readFile('C:/Users/Алексей/Downloads/ПРАЙС_БОТАНИК_Деревья и кустарники_весна_2026.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const rows = [];
  let category = '';
  let subcategory = '';
  const MAIN_SECTIONS = {
    'Хвойные деревья и кустарники': { category: 'Деревья', subcategory: 'Хвойные' },
    'Лиственные деревья': { category: 'Деревья', subcategory: 'Лиственные' },
    'Лиственные кустарники': { category: 'Кустарники', subcategory: 'Декоративные' },
    'Плодовые деревья и кустарники': { category: 'Плодовые', subcategory: 'Деревья и кустарники' },
  };

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    const c1 = String(row[1]).trim();
    if (!c1) continue;

    const c2 = String(row[2]).trim();
    const c3 = String(row[3]).trim();

    // Main section header
    if (MAIN_SECTIONS[c1]) {
      category = MAIN_SECTIONS[c1].category;
      subcategory = MAIN_SECTIONS[c1].subcategory;
      continue;
    }

    // Genus header (c2 empty, c3 empty)
    if (c2 === '' && c3 === '') continue;

    // Data row
    const latinName = c2;
    const { name, variety } = parseName(c1);
    const { container, size } = parseCondition(c3);
    const qty = row[4] === '' ? 0 : Number(row[4]) || 0;
    const priceRetail = parsePrice(row[5]);
    const priceWholesale = parsePrice(row[6]);

    if (!name) continue;
    if (priceRetail === 0 && priceWholesale === 0 && qty === 0) {
      // Price not set yet, still include as "order"
    }

    const meta = getMeta(latinName);

    // Determine better subcategory for кустарники
    let sub = subcategory;
    if (category === 'Кустарники') {
      const genus = latinName.toLowerCase().split(/[\s(]/)[0];
      if (['rosa'].includes(genus)) sub = 'Розы';
      else if (['hydrangea', 'syringa', 'philadelphus', 'forsythia', 'deutzia', 'diervilla', 'spiraea', 'buddleja', 'physocarpus'].includes(genus)) sub = 'Цветущие';
      else if (['berberis', 'physocarpus', 'cotinus', 'sambucus'].includes(genus)) sub = 'Декоративно-лиственные';
      else if (['lonicera', 'viburnum', 'ribes', 'rubus', 'cerasus', 'hippophae', 'paeonia', 'sorbaria'].includes(genus)) sub = 'Плодово-декоративные';
      else if (['parthenocissus', 'humulus', 'clematis', 'atragene'].includes(genus)) sub = 'Лианы';
      else sub = 'Декоративные';
    }

    rows.push({
      latinName, name, variety, container, size, qty, priceRetail, priceWholesale, meta,
      category, subcategory: sub,
      notes: String(row[7] || '').trim(),
    });
  }
  return rows;
}

// ─── Parse PERENNIALS file ────────────────────────────────────────────────────
function parsePerennials() {
  const wb = XLSX.readFile('C:/Users/Алексей/Downloads/ПРАЙС_БОТАНИК_Многолетники_ весна_2026.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const rows = [];
  let category = 'Многолетники';
  let subcategory = 'Многолетники';

  const MAIN_SECTIONS = {
    'Многолетники': 'Многолетники',
    'Злаки и осоки': 'Злаки',
    'Папоротники и другие споровые': 'Папоротники',
  };

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    const c0 = String(row[0]).trim();
    const c1 = String(row[1]).trim();
    const c2 = String(row[2]).trim();
    const c3 = String(row[3]).trim();

    if (!c1) continue;

    // Main section
    if (MAIN_SECTIONS[c1]) {
      subcategory = MAIN_SECTIONS[c1];
      continue;
    }

    // Genus header
    if (c2 === '' && c3 === '') continue;

    // Data row
    const { name, variety } = parseName(c1);
    const { container, size } = parseCondition(c3);
    const qty = row[4] === '' ? 0 : Number(row[4]) || 0;
    const priceRetail = parsePrice(row[5]);
    const priceWholesale = parsePrice(row[6]);
    const notesRaw = String(row[8] || '').trim();

    if (!name) continue;

    const meta = getMeta(c2);

    rows.push({
      latinName: c2, name, variety, container, size, qty, priceRetail, priceWholesale, meta,
      category, subcategory,
      notes: notesRaw,
    });
  }
  return rows;
}

// ─── Build output rows ────────────────────────────────────────────────────────
function buildRows(sourceRows) {
  const counters = {};
  return sourceRows.map(r => {
    // ID prefix
    let prefix = 'X';
    if (r.category === 'Деревья') prefix = 'T';
    else if (r.category === 'Кустарники') prefix = 'S';
    else if (r.category === 'Плодовые') prefix = 'F';
    else if (r.category === 'Многолетники') {
      if (r.subcategory === 'Злаки') prefix = 'G';
      else if (r.subcategory === 'Папоротники') prefix = 'FN';
      else prefix = 'P';
    }

    counters[prefix] = (counters[prefix] || 0) + 1;
    const id = prefix + String(counters[prefix]).padStart(3, '0');

    return {
      id,
      category: r.category,
      subcategory: r.subcategory,
      name: r.name,
      latin_name: r.latinName,
      variety: r.variety,
      size: r.size,
      container: r.container,
      price_retail: r.priceRetail,
      price_wholesale: r.priceWholesale,
      discount_default: 0,
      stock_qty: r.qty,
      stock_status: stockStatus(r.qty),
      light: r.meta.light,
      moisture: r.meta.moisture,
      height_group: r.meta.height_group,
      frost_zone: r.meta.frost_zone,
      lifespan_group: r.meta.lifespan_group,
      flower_color: r.meta.flower_color,
      leaf_color: r.meta.leaf_color,
      natural_garden: r.meta.natural_garden,
      medicinal: r.meta.medicinal,
      description: '',
      notes: r.notes,
      image_url: '',
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('📖 Читаю прайс-листы...');
const treeRows = parseTrees();
console.log(`   Деревья и кустарники: ${treeRows.length} позиций`);
const perennialRows = parsePerennials();
console.log(`   Многолетники: ${perennialRows.length} позиций`);

const allRows = buildRows([...treeRows, ...perennialRows]);
console.log(`📊 Всего позиций: ${allRows.length}`);

// Write xlsx
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(allRows);

ws['!cols'] = [
  { wch: 8 }, { wch: 16 }, { wch: 22 }, { wch: 36 }, { wch: 30 }, { wch: 24 },
  { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
  { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
  { wch: 14 }, { wch: 12 }, { wch: 40 }, { wch: 30 }, { wch: 40 },
];

XLSX.utils.book_append_sheet(wb, ws, 'Каталог');

const outPath = path.resolve(__dirname, '../public/price_botanik_spring_2026.xlsx');
XLSX.writeFile(wb, outPath);

const cats = [...new Set(allRows.map(r => r.category))];
console.log(`✅ Файл записан: ${outPath}`);
console.log(`   Категории: ${cats.join(', ')}`);
cats.forEach(cat => {
  const n = allRows.filter(r => r.category === cat).length;
  console.log(`   • ${cat}: ${n} поз.`);
});
