const MIGRATION_FLAG = 'english-pathway-persist-migrated'

const KEY_MAP: Record<string, string> = {
  'english-pathway-progress': 'english-pathway-progress',
  'english-pathway-games': 'english-pathway-games',
  'english-pathway-theme': 'english-pathway-theme',
}

export function migratePersistKeys(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATION_FLAG) === '1') return

  for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
    const value = localStorage.getItem(oldKey)
    if (value && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, value)
    }
    if (value) {
      localStorage.removeItem(oldKey)
    }
  }

  localStorage.setItem(MIGRATION_FLAG, '1')
}
