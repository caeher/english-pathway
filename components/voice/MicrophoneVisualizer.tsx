'use client'

import { useEffect, useRef, useState } from 'react'
import { getAverageAudioLevel } from '@/lib/audio/microphone'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

interface MicrophoneVisualizerProps {
  stream: MediaStream | null
  active: boolean
  muted?: boolean
  compact?: boolean
  className?: string
}

const BAR_COUNT = 28

export default function MicrophoneVisualizer({
  stream,
  active,
  muted = false,
  compact = false,
  className = '',
}: MicrophoneVisualizerProps) {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.15))
  const [audioLevel, setAudioLevel] = useState(0)
  const reducedMotion = useReducedMotion()
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active || muted) {
      setBars(Array(BAR_COUNT).fill(muted ? 0.08 : 0.12))
      setAudioLevel(0)
      return
    }

    if (reducedMotion) {
      setBars(Array.from({ length: BAR_COUNT }, (_, i) => 0.3 + (i % 4) * 0.1))
      return
    }

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let freqData: Uint8Array | null = null
    let timeData: Uint8Array | null = null

    if (stream) {
      try {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.75
        source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
        timeData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
        void audioContext.resume().catch(() => {})
      } catch {
        // Fallback to simulated audio wave
      }
    }

    const startTime = performance.now()

    const renderFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000

      let currentLevel = 0.08
      if (analyser && freqData && timeData) {
        analyser.getByteTimeDomainData(timeData as Uint8Array<ArrayBuffer>)
        analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>)
        const avg = getAverageAudioLevel(timeData)
        currentLevel = Math.max(0.08, Math.min(1, avg / 28))
      }

      setAudioLevel(currentLevel)

      const updatedBars = Array.from({ length: BAR_COUNT }, (_, index) => {
        // Create symmetrical bell curve weights for middle bars
        const centerDistance = Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2)
        const weight = 1 - Math.pow(centerDistance, 1.8) * 0.45

        let height = 0.12

        if (freqData && freqData.length > 0) {
          // Map frequency bins across the bars
          const binIndex = Math.min(freqData.length - 1, Math.floor((index / BAR_COUNT) * (freqData.length * 0.7)))
          const freqNorm = freqData[binIndex] / 255
          const wavePhase = Math.sin(elapsed * 6 + index * 0.4) * 0.15
          height = (freqNorm * 0.8 + currentLevel * 0.5 + wavePhase + 0.1) * weight
        } else {
          // Dynamic ambient sound wave simulation when active without direct stream
          const wave1 = Math.sin(elapsed * 4.5 + index * 0.35) * 0.3
          const wave2 = Math.cos(elapsed * 7.0 - index * 0.2) * 0.2
          const wave3 = Math.sin(elapsed * 2.0 + index * 0.5) * 0.15
          height = (0.28 + wave1 + wave2 + wave3) * weight
        }

        return Math.max(0.12, Math.min(1.0, height))
      })

      setBars(updatedBars)
      animFrameRef.current = requestAnimationFrame(renderFrame)
    }

    animFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (source) source.disconnect()
      if (analyser) analyser.disconnect()
      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close().catch(() => {})
      }
    }
  }, [active, muted, reducedMotion, stream])

  const isLive = active && !muted && audioLevel > 0.15

  const statusLabel = muted
    ? 'Microphone Muted'
    : active
      ? isLive
        ? 'Audio Detected'
        : 'Voice Visualizer Active'
      : 'Microphone Standby'

  const accessibleLabel = muted
    ? 'Voice audio bar visualizer - microphone muted'
    : active
      ? isLive
        ? 'Voice audio bar visualizer - audio detected'
        : 'Voice audio bar visualizer - active'
      : 'Voice audio bar visualizer - standby'

  const barColor = (height: number) => {
    if (muted) return 'bg-(--text-muted)/40'
    const isHigh = height > 0.5
    return isHigh
      ? 'bg-gradient-to-t from-(--accent) via-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
      : 'bg-gradient-to-t from-(--accent)/60 to-(--accent)'
  }

  if (compact) {
    return (
      <div
        className={`relative flex h-11 w-full items-center justify-between gap-1.5 sm:gap-2 overflow-hidden rounded-xl border border-(--border-primary) bg-gradient-to-b from-(--bg-card) to-(--bg-secondary)/60 px-2.5 sm:px-3 shadow-xs ${className}`}
        aria-label={accessibleLabel}
        role="img"
      >
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span
            className={`inline-block h-2 w-2 rounded-full transition-colors duration-300 ${
              muted
                ? 'bg-amber-500'
                : active
                  ? isLive
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-(--accent)'
                  : 'bg-(--text-muted)'
            }`}
          />
        </div>

        <div className="flex h-6 flex-1 min-w-0 items-end justify-center gap-0.5 sm:gap-1 px-0.5 sm:px-1" aria-hidden="true">
          {bars.map((height, index) => (
            <div key={index} className="flex h-full flex-1 flex-col justify-end items-center">
              <span
                className={`w-full max-w-[6px] rounded-full transition-all duration-75 ${barColor(height)}`}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            </div>
          ))}
        </div>

        {muted && (
          <span className="shrink-0 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hidden xs:inline" aria-hidden="true">
            Muted
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-(--border-primary) bg-gradient-to-b from-(--bg-card) to-(--bg-secondary)/60 p-3 sm:p-5 shadow-sm ${className}`}
      aria-label={accessibleLabel}
      role="img"
    >
      <div className="mb-2 sm:mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-colors duration-300 ${
              muted
                ? 'bg-amber-500'
                : active
                  ? isLive
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-(--accent)'
                  : 'bg-(--text-muted)'
            }`}
          />
          <span className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-wider text-(--text-secondary)">
            {statusLabel}
          </span>
        </div>
        {muted ? (
          <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
            Muted
          </span>
        ) : (
          active && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-(--accent) bg-(--accent-soft) px-1.5 sm:px-2 py-0.5 rounded-full">
              Live Spectrum
            </span>
          )
        )}
      </div>

      <div className="flex h-10 sm:h-16 lg:h-20 items-end justify-center gap-1 sm:gap-1.5 px-1 sm:px-2" aria-hidden="true">
        {bars.map((height, index) => (
          <div key={index} className="flex-1 flex flex-col justify-end h-full items-center">
            <span
              className={`w-full max-w-[8px] rounded-full transition-all duration-75 ${barColor(height)}`}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <p className="mt-2 sm:mt-3 text-center text-[11px] sm:text-xs text-(--text-muted) leading-snug sm:leading-normal">
        {reducedMotion
          ? 'Microphone is active. Visual motion simplified for accessibility.'
          : muted
            ? 'Microphone is muted. Click Unmute when you want to speak with your tutor.'
            : active
              ? 'Speak clearly into your microphone — watch the sound waves react.'
              : 'Activate voice mode or test your microphone to view live sound waves.'}
      </p>
    </div>
  )
}
