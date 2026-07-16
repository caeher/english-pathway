export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export interface HSLA {
  h: number
  s: number
  l: number
  a: number
}

export interface HSVA {
  h: number
  s: number
  v: number
  a: number
}

export interface ColorState {
  r: number
  g: number
  b: number
  h: number
  s: number
  v: number
  a: number
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s = s / 100
  v = v / 100
  let r = 0, g = 0, b = 0

  const i = Math.floor((h / 60) % 6)
  const f = (h / 60) - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r = r / 255
  g = g / 255
  b = b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h = h / 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

export function rgbToHex(r: number, g: number, b: number, a?: number): string {
  const toHex = (x: number) => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`
  if (a !== undefined && a < 1) {
    return hexColor + toHex(a * 255)
  }
  return hexColor
}

export function hexToRgb(hex: string): RGBA {
  let cleaned = hex.trim().replace(/^#/, '')

  if (cleaned.length === 3 || cleaned.length === 4) {
    cleaned = cleaned.split('').map((char) => char + char).join('')
  }

  const num = parseInt(cleaned, 16)

  if (cleaned.length === 8) {
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: Math.round(((num & 255) / 255) * 100) / 100,
    }
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1,
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

export function formatColor(color: ColorState, format: string): string {
  const { r, g, b, a } = color
  const hsl = rgbToHsl(r, g, b)

  switch (format) {
    case 'hex':
      return rgbToHex(r, g, b)
    case 'hex-alpha':
      return rgbToHex(r, g, b, a)
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`
    case 'rgb-alpha':
      return `rgba(${r}, ${g}, ${b}, ${a})`
    case 'hsl':
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    case 'hsl-alpha':
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`
    default:
      return rgbToHex(r, g, b)
  }
}

export function parseColor(colorStr: string): ColorState {
  const defaultState: ColorState = { r: 232, g: 93, b: 58, h: 12, s: 78, v: 91, a: 1 }

  if (!colorStr) return defaultState

  try {
    const cleaned = colorStr.trim().toLowerCase()

    if (cleaned.startsWith('#')) {
      const rgba = hexToRgb(cleaned)
      const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b)
      return { ...rgba, ...hsv }
    }

    const rgbMatch = cleaned.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10)
      const g = parseInt(rgbMatch[2], 10)
      const b = parseInt(rgbMatch[3], 10)
      const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
      const hsv = rgbToHsv(r, g, b)
      return { r, g, b, ...hsv, a }
    }

    const hslMatch = cleaned.match(/^hsla?\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/)
    if (hslMatch) {
      const h = parseInt(hslMatch[1], 10)
      const s = parseFloat(hslMatch[2])
      const l = parseFloat(hslMatch[3])
      const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1
      const rgb = hslToRgb(h, s, l)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      return { ...rgb, h, s: hsv.s, v: hsv.v, a }
    }
  } catch (e) {
    console.error('Error parsing color:', e)
  }

  return defaultState
}
