import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(process.cwd(), 'knowledge', 'modules')
const spanish = /(?:[¿¡]|\b(?:ambos|aprender|aprende|aprendizaje|actividad|actividades|administré|ahora|algunas|antes|aquí|capítulo|completa|contenido|continúa|correctamente|cuál|cuándo|debe|después|elige|entonces|escucha|estudia|explica|feedback|gestionar|identificar|inglés|lección|más|mismo|número|objetivo|oración|palabra|practica|pregunta|respuesta|selecciona|siempre|sonido|siguiente|traduce|usar)\b)/iu
const violations = []

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) visit(file)
    else if (entry.name === 'chapter.md' || entry.name === 'activities.json') {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      lines.forEach((line, index) => { if (spanish.test(line)) violations.push(`${relative(process.cwd(), file)}:${index + 1}`) })
    }
  }
}

visit(root)
if (violations.length) {
  console.error(`Student-visible Spanish content found:\n- ${violations.join('\n- ')}`)
  process.exit(1)
}
console.log('Knowledge language validation passed.')
