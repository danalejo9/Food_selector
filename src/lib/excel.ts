/** Lectura y escritura de la plantilla en Excel. exceljs se carga solo cuando se usa. */
import type { Recetario } from '../schema'
import { CATEGORIES, CATEGORY_LABEL, MEALS, MEAL_LABEL } from '../schema'
import { INGREDIENT_COLUMNS, RECIPE_COLUMNS, TEMPLATE_EXAMPLES, ingredientToRow, normalizeHeader, recipeToRow, type Row } from './bulk'
import { ICON_KEYS } from '../components/FoodIcon'

type Workbook = import('exceljs').Workbook
type Worksheet = import('exceljs').Worksheet

const HEAD: Record<string, { label: string; width: number; note: string }> = {
  nombre: { label: 'nombre', width: 26, note: 'Nombre del plato. Obligatorio.' },
  descripcion: { label: 'descripcion', width: 36, note: 'Una línea que lo describa.' },
  momentos: { label: 'momentos', width: 20, note: 'Separados por coma: desayuno, almuerzo, once, cena, entre comidas.' },
  prep_min: { label: 'prep_min', width: 10, note: 'Minutos de preparación.' },
  coccion_min: { label: 'coccion_min', width: 12, note: 'Minutos en el fuego u horno (0 si no hay).' },
  porciones: { label: 'porciones', width: 10, note: 'Para cuántas personas.' },
  dificultad: { label: 'dificultad', width: 10, note: '1 fácil · 2 media · 3 exigente.' },
  ingredientes: {
    label: 'ingredientes',
    width: 60,
    note: 'Separados por punto y coma. Cada uno: nombre cantidad unidad. Ej.: harina 1 1/2 taza; huevos 2; miel (opcional); sal al gusto. Una nota va después de una coma: tomate 1, picado.',
  },
  pasos: { label: 'pasos', width: 70, note: 'Un paso por línea (Alt+Enter) o separados por |. Agrega (10 min) al final de un paso para el temporizador.' },
  etiquetas: { label: 'etiquetas', width: 18, note: 'Opcional, separadas por coma: rápida, vegetariana…' },
  foto: { label: 'foto', width: 28, note: 'Opcional: enlace a una imagen o ruta fotos/recetas/archivo.webp.' },
}

const INK = 'FF1F1B16'
const PAPER = 'FFF4EEE3'
const TOMATO = 'FFC8412B'

async function newWorkbook(): Promise<Workbook> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'La Nevera'
  wb.created = new Date()
  return wb
}

function styleHeader(ws: Worksheet) {
  const row = ws.getRow(1)
  row.height = 22
  row.eachCell((c) => {
    c.font = { bold: true, color: { argb: PAPER }, name: 'Calibri' }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOMATO } }
    c.alignment = { vertical: 'middle' }
  })
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

function recipeSheet(wb: Workbook, rows: Row[]) {
  const ws = wb.addWorksheet('Recetas')
  ws.columns = RECIPE_COLUMNS.map((k) => ({ header: HEAD[k].label, key: k, width: HEAD[k].width }))
  RECIPE_COLUMNS.forEach((k, i) => {
    ws.getCell(1, i + 1).note = HEAD[k].note
  })
  for (const r of rows) {
    const row = ws.addRow({
      ...r,
      prep_min: r.prep_min ? Number(r.prep_min) : '',
      coccion_min: r.coccion_min ? Number(r.coccion_min) : '',
      porciones: r.porciones ? Number(r.porciones) : '',
      dificultad: r.dificultad ? Number(r.dificultad) : '',
    })
    row.alignment = { vertical: 'top', wrapText: true }
  }
  styleHeader(ws)
  const diffCol = RECIPE_COLUMNS.indexOf('dificultad') + 1
  for (let r = 2; r <= Math.max(rows.length + 1, 300); r++) {
    ws.getCell(r, diffCol).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"1,2,3"'],
      showErrorMessage: true,
      error: 'Usa 1, 2 o 3',
    }
  }
}

function ingredientSheet(wb: Workbook, recetario: Recetario) {
  const byId = new Map(recetario.ingredients.map((i) => [i.id, i]))
  const ws = wb.addWorksheet('Ingredientes')
  ws.columns = [
    { header: 'nombre', key: 'nombre', width: 28 },
    { header: 'categoria', key: 'categoria', width: 22 },
    { header: 'familia', key: 'familia', width: 20 },
    { header: 'basico', key: 'basico', width: 10 },
    { header: 'icono', key: 'icono', width: 14 },
  ]
  ws.getCell('A1').note = 'Los que ya existen se dejan como están. Agrega filas nuevas al final para crear ingredientes.'
  ws.getCell('B1').note = `Una de: ${CATEGORIES.map((c) => CATEGORY_LABEL[c]).join(', ')}`
  ws.getCell('C1').note = 'Opcional. El ingrediente genérico al que pertenece (queso campesino → Queso).'
  ws.getCell('D1').note = 'sí = siempre lo tienes (sal, aceite…)'
  ws.getCell('E1').note = `Opcional. Una clave (${ICON_KEYS.slice(0, 8).join(', ')}…) o un emoji.`
  const sorted = [...recetario.ingredients].sort(
    (a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name, 'es'),
  )
  for (const i of sorted) ws.addRow(ingredientToRow(i, byId))
  styleHeader(ws)
  const catList = `"${CATEGORIES.map((c) => CATEGORY_LABEL[c]).join(',')}"`
  for (let r = 2; r <= sorted.length + 200; r++) {
    ws.getCell(r, 2).dataValidation = { type: 'list', allowBlank: true, formulae: [catList] }
    ws.getCell(r, 4).dataValidation = { type: 'list', allowBlank: true, formulae: ['"sí,no"'] }
  }
}

function instructionsSheet(wb: Workbook) {
  const ws = wb.addWorksheet('Instrucciones')
  ws.columns = [
    { header: 'columna', key: 'k', width: 16 },
    { header: 'cómo llenarla', key: 'v', width: 100 },
  ]
  for (const k of RECIPE_COLUMNS) ws.addRow({ k, v: HEAD[k].note }).alignment = { wrapText: true, vertical: 'top' }
  ws.addRow({})
  ws.addRow({ k: 'momentos', v: `Valores válidos: ${MEALS.map((m) => MEAL_LABEL[m].toLowerCase()).join(', ')}` })
  ws.addRow({ k: 'ingredientes', v: 'Si un ingrediente no existe, se crea al cargar (podrás elegir su categoría antes de importar).' })
  ws.addRow({ k: 'repetidas', v: 'Si una receta ya existe con el mismo nombre, al cargar eliges si reemplazarla u omitirla.' })
  ws.addRow({ k: 'ejemplos', v: 'Las dos primeras filas de "Recetas" son ejemplos: bórralas o cámbialas.' })
  styleHeader(ws)
  ws.getColumn(1).font = { bold: true, color: { argb: INK } }
}

async function download(wb: Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveBlob(blob, filename)
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function downloadTemplate(recetario: Recetario) {
  const wb = await newWorkbook()
  recipeSheet(wb, TEMPLATE_EXAMPLES)
  ingredientSheet(wb, recetario)
  instructionsSheet(wb)
  await download(wb, 'plantilla-recetas.xlsx')
}

export async function exportRecetarioExcel(recetario: Recetario) {
  const byId = new Map(recetario.ingredients.map((i) => [i.id, i]))
  const wb = await newWorkbook()
  recipeSheet(wb, recetario.recipes.map((r) => recipeToRow(r, byId)))
  ingredientSheet(wb, recetario)
  instructionsSheet(wb)
  await download(wb, `recetario-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    const o = v as { text?: string; richText?: { text: string }[]; result?: unknown; hyperlink?: string }
    if (o.richText) return o.richText.map((t) => t.text).join('')
    if (o.text !== undefined) return String(o.text)
    if (o.result !== undefined) return String(o.result)
    if (o.hyperlink) return o.hyperlink
  }
  return String(v)
}

function sheetRows(ws: Worksheet | undefined): Row[] {
  if (!ws) return []
  const headers: string[] = []
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
    headers[col] = normalizeHeader(cellText(c.value))
  })
  const rows: Row[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const out: Row = {}
    headers.forEach((h, col) => {
      if (h) out[h] = cellText(row.getCell(col).value).trim()
    })
    rows.push(out)
  }
  return rows
}

/** CSV simple con comillas (lo que exporta Excel o Google Sheets). */
export function parseCsv(text: string): Row[] {
  const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') q = false
      else field += ch
    } else if (ch === '"') q = true
    else if (ch === sep) {
      cur.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      cur.push(field)
      rows.push(cur)
      cur = []
      field = ''
    } else field += ch
  }
  if (field || cur.length) {
    cur.push(field)
    rows.push(cur)
  }
  const [head, ...body] = rows
  if (!head) return []
  const keys = head.map((h) => normalizeHeader(h.replace(/^﻿/, '')))
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

export async function readBulkFile(file: File): Promise<{ recipes: Row[]; ingredients: Row[] }> {
  if (/\.csv$/i.test(file.name)) return { recipes: parseCsv(await file.text()), ingredients: [] }
  const wb = await newWorkbook()
  await wb.xlsx.load(await file.arrayBuffer())
  const find = (name: string) => wb.worksheets.find((w) => w.name.toLowerCase().startsWith(name))
  return {
    recipes: sheetRows(find('receta') ?? wb.worksheets[0]),
    ingredients: sheetRows(find('ingrediente')),
  }
}

export { INGREDIENT_COLUMNS }
