'use client'

import { useEffect, useRef } from 'react'

const BLOCKED_TAGS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed'])
const EVENT_ATTR_PATTERN = /^on/i

function sanitizeSvgMarkup(svgXml: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgXml, 'image/svg+xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Invalid SVG markup')
  }

  const walk = (node: Element) => {
    const tag = node.tagName.toLowerCase()
    if (BLOCKED_TAGS.has(tag)) {
      node.remove()
      return
    }

    for (const attr of Array.from(node.attributes)) {
      if (EVENT_ATTR_PATTERN.test(attr.name) || attr.value.trim().toLowerCase().startsWith('javascript:')) {
        node.removeAttribute(attr.name)
      }
    }

    for (const child of Array.from(node.children)) {
      walk(child)
    }
  }

  const svg = doc.documentElement
  walk(svg)
  return new XMLSerializer().serializeToString(svg)
}

export interface SvgSceneProps {
  svgXml: string
  className?: string
  containerClassName?: string
  onElementActivate?: (elementId: string) => void
}

export default function SvgScene({
  svgXml,
  className,
  containerClassName,
  onElementActivate,
}: SvgSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let sanitized: string
    try {
      sanitized = sanitizeSvgMarkup(svgXml)
    } catch {
      container.innerHTML = ''
      return
    }

    container.innerHTML = sanitized

    const clickableNodes = container.querySelectorAll('[data-clickable="true"]')
    const cleanups: Array<() => void> = []

    clickableNodes.forEach((node) => {
      const element = node as SVGElement
      const elementId = element.getAttribute('data-id') ?? element.id
      if (!elementId) return

      const handleActivate = () => onElementActivate?.(elementId)
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleActivate()
        }
      }
      element.setAttribute('tabindex', '0')
      element.setAttribute('role', 'button')
      element.setAttribute('aria-label', element.getAttribute('aria-label') ?? `Activate ${elementId}`)
      element.addEventListener('click', handleActivate)
      element.addEventListener('keydown', handleKeyDown)
      cleanups.push(() => {
        element.removeEventListener('click', handleActivate)
        element.removeEventListener('keydown', handleKeyDown)
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
      container.innerHTML = ''
    }
  }, [onElementActivate, svgXml])

  return (
    <div className={containerClassName}>
      <div
        ref={containerRef}
        className={className}
        role="group"
        aria-label="Interactive SVG scene"
      />
    </div>
  )
}
