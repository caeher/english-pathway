import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SVGScene, SVGSceneItem } from '../../types'
import { SpeakButton } from '@/components/ui/SpeakButton'
import ActivityResult from './ActivityResult'
import { svgSceneCoverage } from '@/lib/games/scoring'

interface SVGInteractiveProps {
  scene: SVGScene
  onItemClick?: (item: SVGSceneItem) => void
  onComplete?: (result: { score: number; total: number; discovered: number }) => void
}

export default function SVGInteractive({ scene, onItemClick, onComplete }: SVGInteractiveProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [discovered, setDiscovered] = useState<Set<string>>(new Set())
  const [finished, setFinished] = useState(false)

  const hovered = scene.items.find((i) => i.id === hoveredId)

  const handleClick = (item: SVGSceneItem) => {
    const next = new Set([...discovered, item.id])
    setDiscovered(next)
    onItemClick?.(item)
    if (next.size === scene.items.length) {
      setFinished(true)
      const pct = svgSceneCoverage(next.size, scene.items.length)
      onComplete?.({ score: pct, total: 100, discovered: next.size })
    }
  }

  const handleKeyActivate = (e: React.KeyboardEvent, item: SVGSceneItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(item)
    }
  }

  const handleRestart = () => {
    setDiscovered(new Set())
    setFinished(false)
  }

  const renderItem = (item: SVGSceneItem) => {
    const isHovered = hoveredId === item.id
    const isFound = discovered.has(item.id)
    const common = {
      onMouseEnter: () => setHoveredId(item.id),
      onMouseLeave: () => setHoveredId(null),
      onClick: () => handleClick(item),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyActivate(e, item),
      tabIndex: 0,
      role: 'button' as const,
      'aria-label': isFound ? `${item.labelEn} descubierto` : `Descubrir ${item.labelEn}`,
      className: 'cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)',
      style: {
        filter: isHovered ? 'brightness(1.2)' : 'none',
        stroke: isFound ? '#10b981' : 'none',
        strokeWidth: isFound ? 2 : 0,
      },
    }

    switch (item.type) {
      case 'circle':
        return <circle key={item.id} cx={item.cx} cy={item.cy} r={item.r} fill={item.fill} {...common} />
      case 'ellipse':
        return <ellipse key={item.id} cx={item.cx} cy={item.cy} rx={item.rx} ry={item.ry} fill={item.fill} {...common} />
      case 'rect':
        return <rect key={item.id} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.fill} rx={2} {...common} />
      case 'polygon':
        return <polygon key={item.id} points={item.points} fill={item.fill} {...common} />
      case 'path':
        return <path key={item.id} d={item.d} fill={item.fill} {...common} />
      default:
        return null
    }
  }

  if (finished) {
    const pct = svgSceneCoverage(discovered.size, scene.items.length)
    return (
      <ActivityResult
        percent={pct}
        score={discovered.size}
        total={scene.items.length}
        subtitle={`Descubriste ${discovered.size} de ${scene.items.length} elementos`}
        onRetry={handleRestart}
      />
    )
  }

  return (
    <div className="space-y-3" role="region" aria-label="Escena interactiva">
      <div className="flex justify-between text-sm font-display font-bold text-(--text-muted) mb-1">
        <span>Haz clic en los objetos para descubrir sus nombres</span>
        <span style={{ color: 'var(--success)' }}>{discovered.size}/{scene.items.length} encontrados</span>
      </div>

      <svg viewBox={scene.viewBox} className="w-full rounded-2xl border-2 border-(--border-primary) bg-amber-50/50 dark:bg-slate-800" style={{ maxHeight: 400 }} role="img" aria-label="Escena SVG interactiva">
        {scene.bg && <rect width="100%" height="100%" fill={scene.bg} />}
        {scene.items.map(renderItem)}
      </svg>

      {hovered && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm bg-(--bg-card) px-5 py-2.5 rounded-xl shadow-sm border border-(--border-primary) mx-auto w-fit flex items-center gap-2"
          role="status" aria-live="polite">
          <span className="font-display font-bold" style={{ color: 'var(--accent)' }}>{hovered.labelEn}</span>
          <span className="text-(--text-muted) font-medium">({hovered.label})</span>
          <SpeakButton text={hovered.labelEn} size="sm" />
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {scene.items.map((item) => (
          <span key={item.id}
            className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
              discovered.has(item.id)
                ? 'bg-(--success-soft) border border-(--success)/20'
                : 'bg-(--bg-tertiary) text-(--text-muted) border border-(--border-primary)'}`}>
            {discovered.has(item.id) ? item.labelEn : '???'}
          </span>
        ))}
      </div>
    </div>
  )
}
