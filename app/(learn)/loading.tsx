import { LoadingState } from '@/components/ui'

export default function LearnLoading() {
  return <LoadingState title="Preparing your lesson" description="Loading your tutor and learning context." className="px-6" lines={5} />
}
