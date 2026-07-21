'use client'

import { useEffect, useRef, useState } from 'react'
import { getAverageAudioLevel } from '@/lib/audio/microphone'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

interface MicrophoneVisualizerProps {
  stream: MediaStream | null
  active: boolean
}

const BAR_COUNT = 28

export default function MicrophoneVisualizer({ stream, active }: MicrophoneVisualizerProps) {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.15))
  const [audioLevel, setAudioLevel] = useState(0)
  const reducedMotion = useReducedMotion()
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      setBars(Array(BAR_COUNT).fill(0.12))
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
        analyser.getByteTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)
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
  }, [active, reducedMotion, stream])

  const isLive = active && audioLevel > 0.15

  return (
    <div className="relative overflow-hidden rounded-2xl border border-(--border-primary) bg-gradient-to-b from-(--bg-card) to-(--bg-secondary)/60 p-5 shadow-sm" aria-label="Voice audio bar visualizer">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${active ? (isLive ? 'bg-emerald-500 animate-pulse' : 'bg-(--accent)') : 'bg-(--text-muted)'}`} />
          <span className="font-display text-xs font-bold uppercase tracking-wider text-(--text-secondary)">
            {active ? (isLive ? 'Audio Detected' : 'Voice Visualizer Active') : 'Microphone Standby'}
          </span>
        </div>
        {active && (
          <span className="text-[10px] font-semibold text-(--accent) bg-(--accent-soft) px-2 py-0.5 rounded-full">
            Live Spectrum
          </span>
        )}
      </div>

      <div className="flex h-20 items-end justify-center gap-1 sm:gap-1.5 px-2" aria-hidden="true">
        {bars.map((height, index) => {
          const isHigh = height > 0.5
          return (
            <div
              key={index}
              className="flex-1 flex flex-col justify-end h-full items-center"
            >
              <span
                className={`w-full max-w-[8px] rounded-full transition-all duration-75 ${
                  isHigh
                    ? 'bg-gradient-to-t from-(--accent) via-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                    : 'bg-gradient-to-t from-(--accent)/60 to-(--accent)'
                }`}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-(--text-muted)">
        {reducedMotion
          ? 'Microphone is active. Visual motion simplified for accessibility.'
          : active
          ? 'Speak clearly into your microphone — watch the sound waves react.'
          : 'Activate voice mode or test your microphone to view live sound waves.'}
      </p>
    </div>
  )
}
