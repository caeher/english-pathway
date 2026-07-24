/**
 * Generates curated MP3 clips for contrast-pair activities.
 * Uses Windows SAPI when available, then ffmpeg to produce MP3 assets.
 *
 * Usage: pnpm tsx scripts/generate-curated-audio.ts
 */
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'public', 'audio', 'curated')

const CLIPS = [
  { file: 'ship.mp3', text: 'ship' },
  { file: 'sheep.mp3', text: 'sheep' },
  { file: 'cat.mp3', text: 'cat' },
  { file: 'cut.mp3', text: 'cut' },
] as const

function ensureDir(directory: string) {
  fs.mkdirSync(directory, { recursive: true })
}

function synthesizeWithWindowsSapi(text: string, wavPath: string) {
  const script = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Neutral, [System.Speech.Synthesis.VoiceAge]::Adult, 0, [System.Globalization.CultureInfo]::GetCultureInfo('en-US')) | Out-Null
$synth.SetOutputToWaveFile('${wavPath.replace(/\\/g, '\\\\')}')
$synth.Speak('${text.replace(/'/g, "''")}')
$synth.Dispose()
`

  execFileSync('powershell', ['-NoProfile', '-Command', script], { stdio: 'inherit' })
}

function convertToMp3(wavPath: string, mp3Path: string) {
  const result = spawnSync('ffmpeg', [
    '-y',
    '-i', wavPath,
    '-codec:a', 'libmp3lame',
    '-qscale:a', '4',
    mp3Path,
  ], { stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${mp3Path}`)
  }
}

function main() {
  ensureDir(outputDir)

  for (const clip of CLIPS) {
    const wavPath = path.join(outputDir, clip.file.replace('.mp3', '.wav'))
    const mp3Path = path.join(outputDir, clip.file)

    synthesizeWithWindowsSapi(clip.text, wavPath)
    convertToMp3(wavPath, mp3Path)
    fs.unlinkSync(wavPath)

    console.log(`Generated ${path.relative(root, mp3Path)}`)
  }
}

main()
