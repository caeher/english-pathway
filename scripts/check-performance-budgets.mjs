import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const kb = (bytes) => bytes / 1024
const budgets = JSON.parse(readFileSync('performance-budgets.json', 'utf8'))
function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(file) : [file]
  })
}
const failures = []
const layout = readFileSync('app/layout.tsx', 'utf8')
if (!/next\/font\/google/.test(layout) || !/display:\s*'swap'/.test(layout)) failures.push('app/layout.tsx must use next/font with display: swap.')
const cssKb = filesIn('app').filter((file) => file.endsWith('.css')).reduce((total, file) => total + kb(statSync(file).size), 0)
if (cssKb > budgets.criticalRoutes.public.cssKb) failures.push(`Critical CSS is ${cssKb.toFixed(1)} kB; budget is ${budgets.criticalRoutes.public.cssKb} kB.`)
const imageFiles = filesIn('public').filter((file) => /\.(png|jpe?g|webp|avif|gif)$/i.test(file))
const imageKb = imageFiles.reduce((total, file) => total + kb(statSync(file).size), 0)
for (const file of imageFiles) if (kb(statSync(file).size) > budgets.staticAssets.maxIndividualImageKb) failures.push(`${file} exceeds the ${budgets.staticAssets.maxIndividualImageKb} kB image budget.`)
if (imageKb > budgets.staticAssets.maxTotalImageKb) failures.push(`Public raster images total ${imageKb.toFixed(1)} kB; budget is ${budgets.staticAssets.maxTotalImageKb} kB.`)
if (failures.length) { console.error('Performance budget check failed:\n- ' + failures.join('\n- ')); process.exit(1) }
console.log(`Performance budgets pass: CSS ${cssKb.toFixed(1)} kB; public raster images ${imageKb.toFixed(1)} kB.`)
