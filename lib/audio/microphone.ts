export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function getAverageAudioLevel(data: ArrayLike<number>) {
  if (data.length === 0) return 0
  const total = Array.from({ length: data.length }, (_, index) => Math.abs(data[index] - 128)).reduce((sum, value) => sum + value, 0)
  return total / data.length
}
