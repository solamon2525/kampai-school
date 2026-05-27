/**
 * offline-queue.ts
 * IndexedDB-backed write queue for offline-first attendance.
 * When offline, writes go to the queue. On reconnect, flush() drains it.
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'kampai-offline';
const DB_VERSION = 1;
const STORE = 'attendance_queue';

export type QueuedAttendance = {
  id?: number;
  records: Array<{
    student_id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'late' | 'leave';
    notes?: string | null;
  }>;
  queued_at: number;
  attempts: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineQueue = {
  async enqueue(records: QueuedAttendance['records']): Promise<number> {
    const db = await getDb();
    return db.add(STORE, {
      records,
      queued_at: Date.now(),
      attempts: 0,
    });
  },

  async list(): Promise<QueuedAttendance[]> {
    const db = await getDb();
    return db.getAll(STORE);
  },

  async count(): Promise<number> {
    const db = await getDb();
    return db.count(STORE);
  },

  async remove(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(STORE, id);
  },

  async bumpAttempts(id: number): Promise<void> {
    const db = await getDb();
    const item = await db.get(STORE, id);
    if (item) {
      item.attempts = (item.attempts ?? 0) + 1;
      await db.put(STORE, item);
    }
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE);
  },
};

export const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;
