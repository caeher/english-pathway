const mutableEnv = process.env as Record<string, string | undefined>

export function setTestEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete mutableEnv[key]
  } else {
    mutableEnv[key] = value
  }
}

export function snapshotTestEnv(keys: readonly string[]): Record<string, string | undefined> {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]))
}

export function restoreTestEnv(
  snapshot: Record<string, string | undefined>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    setTestEnv(key, snapshot[key])
  }
}
