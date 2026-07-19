'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAverageAudioLevel } from '@/lib/audio/microphone'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

interface MicrophoneVisualizerProps {
  stream: MediaStream | null
  active: boolean
}

export default function MicrophoneVisualizer({ stream, active }: MicrophoneVisualizerProps) {
  const [level, setLevel] = useState(0.08)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!stream || !active || reducedMotion) return

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let frame = 0
    analyser.fftSize = 64
    source.connect(analyser)

    const readLevel = () => {
      analyser.getByteTimeDomainData(data)
      const average = getAverageAudioLevel(data)
      setLevel(Math.max(0.08, Math.min(1, average / 32)))
      frame = window.requestAnimationFrame(readLevel)
    }

    void audioContext.resume().catch(() => {})
    readLevel()

    return () => {
      window.cancelAnimationFrame(frame)
      source.disconnect()
      analyser.disconnect()
      void audioContext.close().catch(() => {})
    }
  }, [active, reducedMotion, stream])

  const bars = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const wave = 0.65 + Math.sin(index * 1.4) * 0.2
    return reducedMotion ? 0.42 + (index % 3) * 0.08 : Math.max(0.12, level * wave)
  }), [level, reducedMotion])

  return (
    <div className="rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/50 p-4" aria-label="Microphone level visualizer">
      <div className="flex h-16 items-center justify-center gap-1.5" aria-hidden="true">
        {bars.map((height, index) => <span key={index} className="w-1.5 rounded-full bg-(--accent) transition-[height] duration-150" style={{ height: `${Math.round(height * 100)}%` }} />)}
      </div>
      <p className="mt-2 text-center text-xs text-(--text-muted)">{reducedMotion ? 'Microphone input is active. The visual meter is simplified to respect your motion preference.' : 'Input level only - this does not measure pronunciation.'}</p>
    </div>
  )
}
