import '@/lib/env'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'

const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true'

// Real client
const realClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── In-memory store (mock mode only) ────────────────────────────────────────
type Row = Record<string, unknown>
const MOCK_PROFILE_ID = '00000000-0000-0000-0000-000000000000'

const store: Record<string, Row[]> = {
  profiles: [
    {
      id: MOCK_PROFILE_ID, user_id: MOCK_PROFILE_ID,
      name: 'Paras Gupta', title: 'Founder & CEO', company: 'PPL AI',
      email: 'paras@pplai.co', phone: '+1 (415) 555-0192',
      linkedin: 'linkedin.com/in/parasgupta', web: 'pplai.co',
      seeking: 'Distribution partners & early customers for AI tools',
      offering: 'AI workflow automation & custom LLM integrations',
      created_at: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: 'evt-1', profile_id: MOCK_PROFILE_ID,
      name: 'TechConnect Summit 2025',
      start_date: '2025-03-31', end_date: '2025-04-01',
      location: 'Moscone Center, SF',
      seeking: 'distribution partners', offering: 'AI tools',
      status: 'active', is_active: true,
      created_at: new Date('2025-03-01').toISOString(),
    },
    {
      id: 'evt-2', profile_id: MOCK_PROFILE_ID,
      name: 'AI Founders Mixer',
      start_date: '2025-04-12', end_date: '2025-04-12',
      location: 'Mission District, SF',
      seeking: 'investors & angels', offering: null,
      status: 'upcoming', is_active: false,
      created_at: new Date('2025-03-15').toISOString(),
    },
    {
      id: 'evt-3', profile_id: MOCK_PROFILE_ID,
      name: 'Web3 Networking Night',
      start_date: '2025-02-20', end_date: '2025-02-20',
      location: 'SoMa, San Francisco',
      seeking: null, offering: 'smart contracts',
      status: 'past', is_active: false,
      created_at: new Date('2025-02-01').toISOString(),
    },
  ],
  contacts: [],
  notes: [],
  tags: [],
  ai_followups: [],
  audit_logs: [],
}

let _nextId = 1000

function uid() { return `mock-${++_nextId}` }

/**
 * Chainable mock that mirrors the Supabase JS query builder.
 * Supports: from, select, insert, update, delete, eq, neq, order,
 *           limit, range, single, maybeSingle, then/await.
 */
function createMockClient() {
  const client = {
    from(table: string) {
      return buildQuery(table)
    },
  }

  function buildQuery(table: string) {
    type Op = { col: string; val: unknown; neg?: boolean }
    let _filters: Op[] = []
    let _insertData: Row | Row[] | null = null
    let _updateData: Row | null = null
    let _isDelete = false
    let _isInsert = false
    let _isUpdate = false
    let _single = false
    let _maybeSingle = false
    let _orderCol = ''
    let _orderAsc = true
    let _limitN: number | null = null
    let _rangeFrom: number | null = null
    let _rangeTo: number | null = null

    function applyFilters(rows: Row[]) {
      return rows.filter(r =>
        _filters.every(f => f.neg ? r[f.col] !== f.val : r[f.col] === f.val)
      )
    }

    async function execute(): Promise<{ data: unknown; error: null }> {
      const rows: Row[] = store[table] ?? []

      if (_isInsert && _insertData !== null) {
        const toInsert = Array.isArray(_insertData) ? _insertData : [_insertData]
        const inserted = toInsert.map(d => ({
          id: uid(),
          created_at: new Date().toISOString(),
          ...d,
        }))
        store[table] = [...rows, ...inserted]
        const result = _single || _maybeSingle ? inserted[0] ?? null : inserted
        return { data: result, error: null }
      }

      if (_isUpdate && _updateData !== null) {
        const updated: Row[] = []
        store[table] = rows.map(r => {
          if (applyFilters([r]).length) {
            const u = { ...r, ..._updateData }
            updated.push(u)
            return u
          }
          return r
        })
        const result = _single || _maybeSingle ? updated[0] ?? null : updated
        return { data: result, error: null }
      }

      if (_isDelete) {
        const removed = applyFilters(rows)
        store[table] = rows.filter(r => !removed.includes(r))
        return { data: removed, error: null }
      }

      // SELECT
      let result = applyFilters(rows)
      if (_orderCol) {
        result = [...result].sort((a, b) => {
          const av = a[_orderCol] as string, bv = b[_orderCol] as string
          return _orderAsc ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
        })
      }
      if (_rangeFrom !== null && _rangeTo !== null) result = result.slice(_rangeFrom, _rangeTo + 1)
      if (_limitN !== null) result = result.slice(0, _limitN)

      if (_single) return { data: result[0] ?? null, error: null }
      if (_maybeSingle) return { data: result[0] ?? null, error: null }
      return { data: result, error: null }
    }

    const q: any = {
      select(_cols?: string) { return q },
      insert(data: Row | Row[]) { _isInsert = true; _insertData = data; return q },
      update(data: Row) { _isUpdate = true; _updateData = data; return q },
      delete() { _isDelete = true; return q },
      eq(col: string, val: unknown) { _filters.push({ col, val }); return q },
      neq(col: string, val: unknown) { _filters.push({ col, val, neg: true }); return q },
      order(col: string, opts?: { ascending?: boolean }) {
        _orderCol = col; _orderAsc = opts?.ascending !== false; return q
      },
      limit(n: number) { _limitN = n; return q },
      range(from: number, to: number) { _rangeFrom = from; _rangeTo = to; return q },
      single() { _single = true; return { then: (r: any, j: any) => execute().then(r, j) } },
      maybeSingle() { _maybeSingle = true; return { then: (r: any, j: any) => execute().then(r, j) } },
      then(resolve: any, reject: any) { return execute().then(resolve, reject) },
    }
    return q
  }

  return client
}

// Export a mock if requested, otherwise return the real client
export const supabaseAdmin = isMock
  ? (createMockClient() as any)
  : realClient
