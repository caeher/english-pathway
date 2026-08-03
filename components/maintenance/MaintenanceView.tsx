'use client'

import Image from 'next/image'
import { Sparkles, Mic, BarChart3, Zap, Wrench, Shield, CheckCircle2 } from 'lucide-react'
import { UPCOMING_FEATURES, type UpcomingFeature } from '@/lib/maintenance/config'

function FeatureIcon({ icon }: { icon: UpcomingFeature['icon'] }) {
  switch (icon) {
    case 'mic':
      return <Mic className="h-5 w-5 text-amber-500" />
    case 'sparkles':
      return <Sparkles className="h-5 w-5 text-amber-500" />
    case 'chart':
      return <BarChart3 className="h-5 w-5 text-amber-500" />
    case 'zap':
      return <Zap className="h-5 w-5 text-amber-500" />
    case 'shield':
      return <Shield className="h-5 w-5 text-amber-500" />
    default:
      return <Wrench className="h-5 w-5 text-amber-500" />
  }
}

export default function MaintenanceView() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-amber-500/10 via-background to-amber-950/20 overflow-hidden">
      {/* Background ambient glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center space-y-8">
        
        {/* App Brand Title & CubePath Sponsor Logo */}
        <div className="flex flex-col items-center space-y-3 pt-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-outfit">
            English Pathway
          </h2>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-background/80 backdrop-blur-md border border-amber-500/20 shadow-md shadow-amber-500/5">
            <span className="text-xs text-muted-foreground font-medium">Alojado & Patrocinado por</span>
            <a
              href="https://my.cubepath.com/register?ref=HEAC.CRE4389"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center transition-opacity hover:opacity-80"
              aria-label="CubePath Sponsor"
            >
              <Image
                src="/logo-light.png"
                alt="CubePath Logo"
                width={120}
                height={24}
                priority
                className="h-6 w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Maintenance Main Card */}
        <div className="w-full rounded-3xl bg-card/80 backdrop-blur-xl border border-border p-6 md:p-10 shadow-2xl space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            Modo Mantenimiento Activo
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground font-outfit">
              Estamos mejorando English Pathway para ti
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              El sistema se encuentra temporalmente fuera de línea por mantenimiento programado y actualización de servidores. Volveremos pronto con una experiencia de aprendizaje optimizada.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />

          {/* Upcoming Changes Section */}
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground font-outfit">
                Próximos cambios que están por llegar
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPCOMING_FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/60 transition-all duration-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <FeatureIcon icon={feature.icon} />
                      </div>
                      {feature.badge && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>En desarrollo activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} English Pathway &bull; Patrocinado por CubePath. Todos los derechos reservados.
        </p>

      </div>
    </div>
  )
}
