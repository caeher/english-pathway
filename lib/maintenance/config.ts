export interface UpcomingFeature {
  id: string
  title: string
  description: string
  icon: 'sparkles' | 'mic' | 'chart' | 'zap' | 'shield' | 'book'
  badge?: string
}

export const UPCOMING_FEATURES: UpcomingFeature[] = [
  {
    id: 'ai-tutor-v2',
    title: 'Tutor de voz IA de nueva generación',
    description: 'Conversaciones más fluidas, corrección de pronunciación en tiempo real y detección adaptativa de acento.',
    icon: 'mic',
    badge: 'Próximamente',
  },
  {
    id: 'interactive-scenarios',
    title: 'Escenarios interactivos del mundo real',
    description: 'Nuevos módulos prácticos para entrevistas de trabajo, presentaciones ejecutivas y viajes.',
    icon: 'sparkles',
    badge: 'Nuevo',
  },
  {
    id: 'advanced-analytics',
    title: 'Analítica de aprendizaje y tablero de progreso',
    description: 'Métricas detalladas sobre tu vocabulario adquirido, precisión gramatical y metas diarias.',
    icon: 'chart',
    badge: 'Mejora',
  },
  {
    id: 'performance-boost',
    title: 'Optimización de velocidad y rendimiento',
    description: 'Carga ultrarrápida de actividades, respuestas instantáneas del tutor y menor latencia en audio.',
    icon: 'zap',
    badge: 'Optimización',
  },
]

export function isMaintenanceModeActive(): boolean {
  return (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' ||
    process.env.MAINTENANCE_MODE === 'true'
  )
}
