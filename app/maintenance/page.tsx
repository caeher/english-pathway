import type { Metadata } from 'next'
import MaintenanceView from '@/components/maintenance/MaintenanceView'

export const metadata: Metadata = {
  title: 'Mantenimiento | English Pathway (Hosted on CubePath)',
  description: 'English Pathway está realizando tareas de mantenimiento programado. Volveremos muy pronto con mejoras y nuevas funcionalidades.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenancePage() {
  return <MaintenanceView />
}
