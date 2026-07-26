import { LoadingState } from '@/components/ui'

export default function CurriculumLoading() {
  return <LoadingState title="Loading the curriculum" description="Preparing modules and chapter progress." lines={6} />
}
