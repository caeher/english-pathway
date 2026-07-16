import { AuthLayoutShell } from '@/components/layouts/auth-layout-shell'

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>
}
