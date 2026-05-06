/**
 * Offline-first sync utility.
 *
 * - Cache: localStorage mirror of backend data per resource key
 * - Queue: pending writes that failed due to connectivity
 * - Drain: retried on `window online` + every 15 min
 */

const QUEUE_KEY = 'netcard_sync_queue'
const CACHE_PREFIX = 'netcard_cache_'

// ─── Cache ────────────────────────────────────────────────────────────────────

export function readCache(key) {
  try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + key)) ?? null }
  catch { return null }
}

export function writeCache(key, data) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)) }
  catch { /* storage full – ignore */ }
}

// ─── Queue ────────────────────────────────────────────────────────────────────

function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) ?? [] }
  catch { return [] }
}

function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) }
  catch { /* ignore */ }
}

/** Add a failed write to the pending queue */
export function enqueue(item) {
  const q = readQueue()
  q.push({ ...item, queuedAt: Date.now() })
  saveQueue(q)
}

export function getPendingCount() {
  return readQueue().length
}

/**
 * Attempt to flush the queue.
 * Each item: { method, url, body, cacheKey, optimisticData }
 */
export async function drain() {
  const q = readQueue()
  if (!q.length) return

  const remaining = []
  for (const item of q) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item.body),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      // On success, refresh cache for this key
      if (item.cacheKey) {
        const API = import.meta.env.VITE_API_URL || ''
        const fresh = await fetch(`${API}/${item.cacheKey}`, { credentials: 'include' })
        if (fresh.ok) {
          const json = await fresh.json()
          writeCache(item.cacheKey, json.data ?? json)
        }
      }
    } catch {
      remaining.push(item)
    }
  }

  saveQueue(remaining)
}

// ─── Auto-sync setup (call once at app start) ─────────────────────────────────

let _syncTimer = null

export function startAutoSync() {
  if (_syncTimer) return // already started

  // Drain on coming back online
  window.addEventListener('online', drain)

  // Drain every 15 minutes
  _syncTimer = setInterval(drain, 15 * 60 * 1000)

  // Attempt once immediately in case there's a backlog
  drain()
}
