import type { MockDatabase } from '@/types'
import { seedDatabase } from './seed'

const DB_KEY = 'qicheng_demo_db_v1'

let memoryDb: MockDatabase | null = null

export function loadDb(): MockDatabase {
  if (memoryDb) return memoryDb
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      memoryDb = JSON.parse(raw) as MockDatabase
      return memoryDb
    }
  } catch {
    // Fall back to seeded demo data when local storage is unavailable or invalid.
  }
  memoryDb = structuredClone(seedDatabase())
  persistDb()
  return memoryDb
}

export function persistDb() {
  if (!memoryDb) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(memoryDb))
  } catch {
    // Large image previews can exceed quota; the in-memory store still works for this session.
  }
}

export function writeDb(db: MockDatabase) {
  memoryDb = db
  persistDb()
}

export function resetDb(): MockDatabase {
  memoryDb = structuredClone(seedDatabase())
  persistDb()
  return memoryDb
}

export function clearDbCache() {
  memoryDb = null
  try {
    localStorage.removeItem(DB_KEY)
  } catch {
    // Ignore storage failures in demo mode.
  }
}
