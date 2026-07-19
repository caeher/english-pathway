import { LoadingState } from '@/components/ui'

export default function AccountLoading() {
  return <LoadingState title="Loading your learning space" description="Getting your latest progress and account details." className="px-6" lines={5} />
}
