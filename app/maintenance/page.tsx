import type { Metadata } from 'next'
import MaintenanceView from '@/components/maintenance/MaintenanceView'

export const metadata: Metadata = {
  title: 'Mantenimiento | CubePath',
  description: 'Estamos realizando tareas de mantenimiento programado. Volveremos muy pronto con mejoras y nuevas funcionalidades.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenancePage() {
  return <MaintenanceView />
}
