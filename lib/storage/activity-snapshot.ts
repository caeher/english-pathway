import { z } from 'zod'
import { getActivityDefinition } from '@/features/activities/registry'
import {
  ACTIVITY_SNAPSHOT_VERSION,
  activityProgressSnapshotSchema,
  type ActivityProgressSnapshot,
} from '@/features/activities/snapshot'
import type { ActivityTypeKey } from '@/features/activities/contracts'

export const ACTIVITY_SNAPSHOT_STORAGE_KEY = 'english-pathway-games'
export const SNAPSHOT_STORE_VERSION = 1
export const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000

const snapshotStoreSchema = z.object({
  version: z.literal(SNAPSHOT_STORE_VERSION),
  snapshots: z.record(z.string(), activityProgressSnapshotSchema),
})

export type SnapshotStore = z.infer<typeof snapshotStoreSchema>

function emptyStore(): SnapshotStore {
  return { version: SNAPSHOT_STORE_VERSION, snapshots: {} }
}

export function migrateSnapshotStore(raw: unknown): SnapshotStore {
  if (!raw || typeof raw !== 'object') return emptyStore()

  const version = (raw as { version?: number }).version
  if (typeof version !== 'number' || version > SNAPSHOT_STORE_VERSION) return emptyStore()

  const parsed = snapshotStoreSchema.safeParse(raw)
  return parsed.success ? parsed.data : emptyStore()
}

function readStore(): SnapshotStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const raw = window.localStorage.getItem(ACTIVITY_SNAPSHOT_STORAGE_KEY)
    if (!raw) return emptyStore()
    return migrateSnapshotStore(JSON.parse(raw))
  } catch {
    return emptyStore()
  }
}

function writeStore(store: SnapshotStore) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACTIVITY_SNAPSHOT_STORAGE_KEY, JSON.stringify(store))
  }
}

function isExpired(savedAt: string, now = Date.now()): boolean {
  const saved = Date.parse(savedAt)
  if (Number.isNaN(saved)) return true
  return now - saved > SNAPSHOT_TTL_MS
}

function validateSnapshot(snapshot: ActivityProgressSnapshot): ActivityProgressSnapshot | null {
  const envelope = activityProgressSnapshotSchema.safeParse(snapshot)
  if (!envelope.success) return null
  if (envelope.data.version !== ACTIVITY_SNAPSHOT_VERSION) return null
  if (isExpired(envelope.data.savedAt)) return null

  const definition = getActivityDefinition(envelope.data.activityType)
  if (!definition) return null

  const payload = definition.snapshot.schema.safeParse(envelope.data.payload)
  if (!payload.success) return null
  if (!definition.snapshot.isRestorable(payload.data as never)) return null

  return { ...envelope.data, activityType: envelope.data.activityType as ActivityTypeKey, payload: payload.data }
}

export function loadSnapshot(activityId: string): ActivityProgressSnapshot | null {
  const store = readStore()
  const snapshot = store.snapshots[activityId]
  if (!snapshot) return null

  const validated = validateSnapshot(snapshot as ActivityProgressSnapshot)
  if (!validated) {
    removeSnapshot(activityId)
    return null
  }

  return validated
}

export function saveSnapshot(
  snapshot: Omit<ActivityProgressSnapshot, 'savedAt'> & { savedAt?: string },
) {
  const definition = getActivityDefinition(snapshot.activityType)
  if (!definition) return

  const payload = definition.snapshot.schema.safeParse(snapshot.payload)
  if (!payload.success || !definition.snapshot.isRestorable(payload.data as never)) return

  const store = readStore()
  const entry: ActivityProgressSnapshot = {
    version: ACTIVITY_SNAPSHOT_VERSION,
    activityId: snapshot.activityId,
    activityType: snapshot.activityType,
    savedAt: snapshot.savedAt ?? new Date().toISOString(),
    payload: payload.data,
    hintMeta: snapshot.hintMeta,
  }

  store.snapshots[snapshot.activityId] = entry
  writeStore(store)
}

export function removeSnapshot(activityId: string) {
  const store = readStore()
  if (!store.snapshots[activityId]) return
  delete store.snapshots[activityId]
  writeStore(store)
}

export function purgeExpiredSnapshots(now = Date.now()) {
  const store = readStore()
  let changed = false

  for (const [activityId, snapshot] of Object.entries(store.snapshots)) {
    const validated = validateSnapshot(snapshot as ActivityProgressSnapshot)
    if (!validated || isExpired(snapshot.savedAt, now)) {
      delete store.snapshots[activityId]
      changed = true
    }
  }

  if (changed) writeStore(store)
}

export function summarizeSnapshot(snapshot: ActivityProgressSnapshot): string {
  const definition = getActivityDefinition(snapshot.activityType)
  if (!definition) return 'Saved progress available'
  const payload = definition.snapshot.schema.safeParse(snapshot.payload)
  if (!payload.success) return 'Saved progress available'
  return definition.snapshot.summarize(payload.data as never)
}
