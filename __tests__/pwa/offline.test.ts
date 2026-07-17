import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const publicDir = resolve(process.cwd(), 'public')

describe('PWA offline support', () => {
  it('ships an installable offline fallback page', () => {
    const offline = readFileSync(resolve(publicDir, 'offline.html'), 'utf8')
    expect(offline).toContain('<html lang="en">')
    expect(offline).toContain('You are offline')
  })

  it('precache references only files that exist in public', () => {
    const serviceWorker = readFileSync(resolve(publicDir, 'sw.js'), 'utf8')
    const precache = serviceWorker.match(/const PRECACHE_ASSETS = \[(.*?)\]/s)?.[1] ?? ''
    const assets = [...precache.matchAll(/['"](\/[^'"]+)['"]/g)].map((match) => match[1])
      .filter((asset) => asset !== '/manifest.webmanifest' && asset !== '/offline.html')
    expect(assets.every((asset) => existsSync(resolve(publicDir, asset.slice(1))))).toBe(true)
  })
})
