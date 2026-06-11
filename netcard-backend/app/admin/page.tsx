'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────

type Session = { key: string; email: string; role: string }
type Stats = {
  users: number; dau: number; events: number; contacts: number
  messages: number; ai_followups: number; open_tickets: number; crashes_7d: number
}
type Timeseries = { profiles: DayPt[]; contacts: DayPt[]; events: DayPt[]; messages: DayPt[] }
type DayPt      = { date: string; count: number }
type Ticket = {
  id: string; category: string; message: string
  email: string | null; status: string; admin_note: string | null; created_at: string
}
type Suggestion = {
  id: string; title: string; body: string; category: string
  up: number; down: number; status: string; created_at: string
}
type Crash = {
  id: string; owner_id: string | null; error: string; stack: string | null
  url: string | null; ua: string | null; created_at: string
}
type TableStat  = { table: string; count: number | null; error: string | null }
type AdminUser  = { id: string; email: string; role: string; added_by: string | null; created_at: string }
type AppUser    = { id: string; clerk_user_id: string; name: string | null; email: string | null; role: string | null; company: string | null; created_at: string }
type TableData  = { rows: Record<string, unknown>[]; total: number; limit: number; offset: number }
type Tab = 'stats' | 'database' | 'crashes' | 'suggestions' | 'support' | 'users' | 'sessions'

type SessionRow = {
  id: string; user_id: string; session_type: string; browser: string
  device_type: string; os: string; country: string | null; city: string | null
  started_at: string; ended_at: string | null; duration_s: number | null
}
type SessionStats = {
  total: number; avg_duration_s: number
  by_session_type: Record<string, number>
  by_browser: Record<string, number>
  by_device_type: Record<string, number>
  by_country: Record<string, number>
}
type SessionsData = { sessions: SessionRow[]; stats: SessionStats }

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES = ['view', 'comment', 'admin'] as const
type Role = typeof ROLES[number]
function canDo(userRole: string, min: Role) {
  return ROLES.indexOf(userRole as Role) >= ROLES.indexOf(min)
}

const C = {
  bg:      '#f8fafc',
  surface: '#ffffff',
  sub:     '#f1f5f9',
  border:  '#e2e8f0',
  t1:      '#0f172a',
  t2:      '#475569',
  t3:      '#94a3b8',
  indigo:  '#6366f1',
  green:   '#059669',
  red:     '#ef4444',
  amber:   '#d97706',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  pink:    '#ec4899',
  orange:  '#f97316',
  shadow:  '0 1px 3px rgba(0,0,0,0.07)',
  shadow2: '0 4px 20px rgba(0,0,0,0.11)',
}

const CHART_COLORS = [C.indigo, C.green, C.amber, C.blue]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  try { return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return s }
}
function fmtDay(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return s }
}

async function apiFetch<T>(path: string, sess: Session, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`/api/admin${path}`, {
      ...opts,
      headers: {
        'x-admin-key':   sess.key,
        'x-admin-email': sess.email,
        'Content-Type':  'application/json',
        ...(opts?.headers ?? {}),
      },
      cache: 'no-store',
    })
    const d = await res.json()
    return d.success ? d.data : null
  } catch { return null }
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open: C.indigo, in_progress: C.amber, resolved: C.green, closed: C.t3,
  planned: C.amber, done: C.green, rejected: C.red, pending: C.indigo,
  ok: C.green, view: C.t3, comment: C.amber, admin: C.indigo,
}

function Badge({ text }: { text: string }) {
  const c = STATUS_COLORS[text] ?? C.t3
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: c + '18', color: c, border: `1px solid ${c}40`,
    }}>{text}</span>
  )
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '9px 13px', textAlign: 'left' as const, fontSize: 10.5, fontWeight: 700,
      color: C.t2, textTransform: 'uppercase' as const, letterSpacing: 0.5,
      background: C.sub, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' as const,
    }}>{children}</th>
  )
}

function TD({ children, mono, small, style }: { children: React.ReactNode; mono?: boolean; small?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: small ? '7px 13px' : '11px 13px', fontSize: small ? 11.5 : 12.5, color: C.t1,
      borderBottom: `1px solid ${C.border}`, fontFamily: mono ? 'monospace' : 'inherit',
      verticalAlign: 'top' as const, maxWidth: 260, wordBreak: 'break-word' as const,
      ...style,
    }}>{children}</td>
  )
}

function Btn({ onClick, disabled, children, variant = 'primary', small }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger'; small?: boolean
}) {
  const bg    = variant === 'primary' ? C.indigo : variant === 'danger' ? C.red : 'transparent'
  const color = variant === 'ghost' ? C.t2 : '#fff'
  const border = variant === 'ghost' ? `1px solid ${C.border}` : 'none'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg, color, border, borderRadius: 6,
      padding: small ? '4px 10px' : '8px 16px',
      fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1,
    }}>{children}</button>
  )
}

function SectionTitle({ children, count, note }: { children: React.ReactNode; count?: number; note?: string }) {
  return (
    <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
      {count !== undefined && count > 0 && <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{count} total</span>}
      {note && <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>{note}</span>}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
      boxShadow: C.shadow, ...style,
    }}>{children}</div>
  )
}

// ── Row components ─────────────────────────────────────────────────────────────

function TicketRow({ t, sess, canEdit, onSaved }: { t: Ticket; sess: Session; canEdit: boolean; onSaved: () => void }) {
  const [status, setStatus] = useState(t.status)
  const [note, setNote]     = useState(t.admin_note ?? '')
  const [busy, setBusy]     = useState(false)
  const [saved, setSaved]   = useState(false)
  const save = async () => {
    setBusy(true)
    await apiFetch(`/tickets/${t.id}`, sess, { method: 'PATCH', body: JSON.stringify({ status, admin_note: note }) })
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved()
  }
  return (
    <tr>
      <TD small>{fmtDate(t.created_at)}</TD>
      <TD small><Badge text={t.category} /></TD>
      <TD small>{t.message}</TD>
      <TD small mono><span style={{ color: C.t2 }}>{t.email ?? '—'}</span></TD>
      <TD small>
        {canEdit
          ? <select value={status} onChange={e => setStatus(e.target.value)} style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 7px', fontSize: 11.5 }}>
              {['open','in_progress','resolved','closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          : <Badge text={status} />
        }
      </TD>
      <TD small>
        {canEdit
          ? <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note…" style={{ background: C.sub, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 7px', fontSize: 11.5, width: '100%' }} />
          : <span style={{ color: C.t2 }}>{note || '—'}</span>
        }
      </TD>
      {canEdit && <TD small><Btn onClick={save} disabled={busy} small>{busy ? '…' : saved ? '✓' : 'Save'}</Btn></TD>}
    </tr>
  )
}

function SuggestionRow({ s, sess, canEdit, onSaved }: { s: Suggestion; sess: Session; canEdit: boolean; onSaved: () => void }) {
  const [status, setStatus] = useState(s.status)
  const [busy, setBusy]     = useState(false)
  const [saved, setSaved]   = useState(false)
  const save = async () => {
    setBusy(true)
    await apiFetch(`/suggestions/${s.id}`, sess, { method: 'PATCH', body: JSON.stringify({ status }) })
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved()
  }
  const net = s.up - s.down
  return (
    <tr>
      <TD small>
        <span style={{ fontWeight: 700, color: net > 0 ? C.green : C.t3 }}>{net > 0 ? '+' : ''}{net}</span>
        <span style={{ color: C.t3, fontSize: 10, marginLeft: 4 }}>({s.up}↑ {s.down}↓)</span>
      </TD>
      <TD small>
        <div style={{ fontWeight: 600, color: C.t1 }}>{s.title}</div>
        <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{s.body?.slice(0, 80)}{(s.body?.length ?? 0) > 80 ? '…' : ''}</div>
      </TD>
      <TD small><span style={{ fontSize: 11, color: C.t2 }}>{s.category}</span></TD>
      <TD small>
        {canEdit
          ? <select value={status} onChange={e => setStatus(e.target.value)} style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 7px', fontSize: 11.5 }}>
              {['open','planned','done','rejected'].map(st => <option key={st}>{st}</option>)}
            </select>
          : <Badge text={status} />
        }
      </TD>
      <TD small>{fmtDate(s.created_at)}</TD>
      {canEdit && <TD small><Btn onClick={save} disabled={busy} small>{busy ? '…' : saved ? '✓' : 'Save'}</Btn></TD>}
    </tr>
  )
}

function CrashRow({ c }: { c: Crash }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr onClick={() => setExpanded(v => !v)} style={{ cursor: 'pointer' }}>
        <TD small>{fmtDate(c.created_at)}</TD>
        <TD small mono><span style={{ color: C.red }}>{c.error.slice(0, 80)}{c.error.length > 80 ? '…' : ''}</span></TD>
        <TD small mono><span style={{ fontSize: 10.5, color: C.t2 }}>{c.url ?? '—'}</span></TD>
        <TD small><span style={{ fontSize: 10.5, color: C.t2 }}>{c.ua?.slice(0, 50) ?? '—'}</span></TD>
        <TD small><span style={{ fontSize: 10.5, color: C.indigo }}>{c.stack ? (expanded ? '▲ hide' : '▼ stack') : '—'}</span></TD>
      </tr>
      {expanded && c.stack && (
        <tr><td colSpan={5} style={{ padding: '0 13px 13px', background: C.sub }}>
          <pre style={{ margin: 0, fontSize: 10, color: C.t2, whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 260, overflowY: 'auto' as const }}>{c.stack}</pre>
        </td></tr>
      )}
    </>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab({ stats, timeseries }: { stats: Stats | null; timeseries: Timeseries | null }) {
  if (!stats) return <div style={{ color: C.red, fontSize: 14 }}>Failed to load stats</div>

  const statCards = [
    { label: 'Total Users',   val: stats.users,        color: C.indigo },
    { label: 'DAU (today)',   val: stats.dau,          color: C.green },
    { label: 'Events',        val: stats.events,       color: C.blue },
    { label: 'Contacts',      val: stats.contacts,     color: C.purple },
    { label: 'Messages',      val: stats.messages,     color: C.amber },
    { label: 'AI Follow-ups', val: stats.ai_followups, color: C.pink },
    { label: 'Open Tickets',  val: stats.open_tickets, color: C.red },
    { label: 'Crashes (7d)',  val: stats.crashes_7d,   color: C.orange },
  ]

  // Bar chart data
  const barData = statCards.map(s => ({ name: s.label.replace(' (today)', '').replace(' (7d)', ''), value: s.val }))

  // Merge timeseries into one array for multi-line chart
  const lineData = (timeseries?.profiles ?? []).map((p, i) => ({
    date: fmtDay(p.date),
    Users:    timeseries?.profiles[i]?.count ?? 0,
    Contacts: timeseries?.contacts[i]?.count ?? 0,
    Events:   timeseries?.events[i]?.count   ?? 0,
    Messages: timeseries?.messages[i]?.count ?? 0,
  }))

  return (
    <div>
      <SectionTitle>Usage Overview</SectionTitle>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding: '18px 20px', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.val.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

        {/* Bar chart — current totals */}
        <Card style={{ padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 16 }}>Entity Totals</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.t2 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: C.t2 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
              <Bar dataKey="value" fill={C.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line chart — 14-day trend */}
        <Card style={{ padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 16 }}>14-Day Activity Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.t2 }} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: C.t2 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(['Users','Contacts','Events','Messages'] as const).map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Stats table */}
      <Card style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr><TH>Metric</TH><TH>Value</TH><TH>Notes</TH></tr>
          </thead>
          <tbody>
            {[
              { metric: 'Total Users',       val: stats.users,        note: 'All registered profiles' },
              { metric: 'Daily Active Users', val: stats.dau,          note: 'Profiles updated today' },
              { metric: 'Total Events',       val: stats.events,       note: 'Events created across all users' },
              { metric: 'Total Contacts',     val: stats.contacts,     note: 'Contacts scanned/added' },
              { metric: 'Messages Sent',      val: stats.messages,     note: 'DM messages across all conversations' },
              { metric: 'AI Follow-ups',      val: stats.ai_followups, note: 'Generated (pending + sent + dismissed)' },
              { metric: 'Open Tickets',       val: stats.open_tickets, note: 'Support tickets awaiting response' },
              { metric: 'Crashes (7 days)',   val: stats.crashes_7d,   note: 'Error reports in last 7 days' },
            ].map(r => (
              <tr key={r.metric}>
                <TD><span style={{ fontWeight: 600 }}>{r.metric}</span></TD>
                <TD><span style={{ fontWeight: 700, fontSize: 14, color: C.indigo }}>{r.val.toLocaleString()}</span></TD>
                <TD><span style={{ color: C.t2, fontSize: 12 }}>{r.note}</span></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Database Tab ──────────────────────────────────────────────────────────────

function DatabaseTab({ tables, sess }: { tables: TableStat[]; sess: Session }) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<Record<string, TableData>>({})
  const [loading, setLoading]     = useState<string | null>(null)
  const [offsets, setOffsets]     = useState<Record<string, number>>({})

  const loadTable = async (name: string, offset = 0) => {
    setLoading(name)
    const d = await apiFetch<TableData>(`/database/${name}?limit=50&offset=${offset}`, sess)
    if (d) {
      setTableData(prev => ({ ...prev, [name]: d }))
      setOffsets(prev => ({ ...prev, [name]: offset }))
    }
    setLoading(null)
  }

  const toggle = (name: string) => {
    if (expandedTable === name) { setExpandedTable(null); return }
    setExpandedTable(name)
    if (!tableData[name]) loadTable(name, 0)
  }

  return (
    <div>
      <SectionTitle count={tables.length}>Supabase Tables</SectionTitle>

      {/* Summary card */}
      <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead><tr><TH>#</TH><TH>Table</TH><TH>Rows</TH><TH>Status</TH><TH> </TH></tr></thead>
          <tbody>
            {tables.map((t, i) => (
              <>
                <tr
                  key={t.table}
                  onClick={() => toggle(t.table)}
                  style={{ cursor: 'pointer', background: expandedTable === t.table ? C.sub : C.surface }}
                >
                  <TD small><span style={{ color: C.t3 }}>{i + 1}</span></TD>
                  <TD small mono><span style={{ fontWeight: expandedTable === t.table ? 700 : 400 }}>{t.table}</span></TD>
                  <TD small>
                    <span style={{ fontWeight: 700, fontSize: 14, color: t.error ? C.red : C.t1 }}>
                      {t.error ? '—' : (t.count ?? 0).toLocaleString()}
                    </span>
                  </TD>
                  <TD small>{t.error ? <span style={{ color: C.red, fontSize: 11 }}>{t.error}</span> : <Badge text="ok" />}</TD>
                  <TD small>
                    <span style={{ fontSize: 11, color: C.indigo }}>
                      {loading === t.table ? '…' : expandedTable === t.table ? '▲ collapse' : '▼ view rows'}
                    </span>
                  </TD>
                </tr>

                {/* Inline expanded rows */}
                {expandedTable === t.table && (
                  <tr key={`${t.table}-expanded`}>
                    <td colSpan={5} style={{ padding: 0, background: C.sub, borderBottom: `1px solid ${C.border}` }}>
                      {!tableData[t.table] && loading === t.table
                        ? <div style={{ padding: 16, color: C.t3, fontSize: 12 }}>Loading…</div>
                        : tableData[t.table]
                          ? <TableRows data={tableData[t.table]} tableName={t.table} onPage={(o) => loadTable(t.table, o)} currentOffset={offsets[t.table] ?? 0} />
                          : null
                      }
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function TableRows({ data, tableName, onPage, currentOffset }: {
  data: TableData; tableName: string; onPage: (offset: number) => void; currentOffset: number
}) {
  if (!data.rows.length) return <div style={{ padding: 16, color: C.t3, fontSize: 12 }}>Empty table</div>
  const cols = Object.keys(data.rows[0])

  return (
    <div style={{ overflowX: 'auto' as const }}>
      <div style={{ padding: '8px 13px 6px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, color: C.t2, fontWeight: 600 }}>{tableName}</span>
        <span style={{ fontSize: 11, color: C.t3 }}>showing {currentOffset + 1}–{Math.min(currentOffset + data.limit, data.total)} of {data.total.toLocaleString()}</span>
        <div style={{ flex: 1 }} />
        <button disabled={currentOffset === 0} onClick={() => onPage(Math.max(0, currentOffset - 50))}
          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.t2, cursor: currentOffset === 0 ? 'default' : 'pointer', opacity: currentOffset === 0 ? 0.4 : 1 }}>← prev</button>
        <button disabled={currentOffset + data.limit >= data.total} onClick={() => onPage(currentOffset + 50)}
          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.t2, cursor: currentOffset + data.limit >= data.total ? 'default' : 'pointer', opacity: currentOffset + data.limit >= data.total ? 0.4 : 1 }}>next →</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 11 }}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={{ padding: '7px 12px', textAlign: 'left' as const, fontWeight: 700, color: C.t2, background: C.sub, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' as const, fontSize: 10.5 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? C.surface : '#fafbfc' }}>
              {cols.map(c => {
                const v = row[c]
                const str = v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
                return (
                  <td key={c} style={{
                    padding: '6px 12px', borderBottom: `1px solid ${C.border}`,
                    fontFamily: typeof v === 'string' && v.includes('-') && v.length > 20 ? 'monospace' : 'inherit',
                    color: v === null ? C.t3 : C.t1,
                    maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }} title={str}>{v === null ? 'null' : str.slice(0, 80)}{str.length > 80 ? '…' : ''}</td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── App Users Tab ─────────────────────────────────────────────────────────────

function AppUsersSection({ sess }: { sess: Session }) {
  const [appUsers, setAppUsers]     = useState<AppUser[]>([])
  const [loading, setLoading]       = useState(false)
  const [impersonating, setImp]     = useState<string | null>(null)
  const [copied, setCopied]         = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    apiFetch<AppUser[]>('/app-users', sess).then(d => { if (d) setAppUsers(d) }).finally(() => setLoading(false))
  }, [sess])

  const generateLoginLink = async (u: AppUser) => {
    if (!u.clerk_user_id) { alert('No Clerk ID for this user'); return }
    setImp(u.id)
    const d = await apiFetch<{ signInUrl: string }>(`/impersonate/${u.clerk_user_id}`, sess, { method: 'POST' })
    setImp(null)
    if (!d?.signInUrl) { alert('Failed to generate sign-in link'); return }
    navigator.clipboard.writeText(d.signInUrl).catch(() => {})
    setCopied(u.id)
    setTimeout(() => setCopied(null), 3000)
    if (confirm(`Sign-in link copied to clipboard!\n\nOpen now in a new tab?\n\n${d.signInUrl}`)) {
      window.open(d.signInUrl, '_blank')
    }
  }

  return (
    <div style={{ marginTop: 36 }}>
      <SectionTitle count={appUsers.length} note="app profiles">App Users</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead><tr><TH>Name</TH><TH>Email</TH><TH>Role / Company</TH><TH>Joined</TH><TH>Login As</TH></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>Loading…</td></tr>}
            {!loading && appUsers.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No app users yet</td></tr>
            )}
            {appUsers.map(u => (
              <tr key={u.id}>
                <TD><span style={{ fontWeight: 600 }}>{u.name || '(no name)'}</span></TD>
                <TD mono>{u.email || '—'}</TD>
                <TD><span style={{ color: C.t2 }}>{[u.role, u.company].filter(Boolean).join(' · ') || '—'}</span></TD>
                <TD>{fmtDate(u.created_at)}</TD>
                <TD>
                  <button
                    onClick={() => generateLoginLink(u)}
                    disabled={impersonating === u.id}
                    style={{
                      background: copied === u.id ? C.green : C.indigo,
                      color: '#fff', border: 'none', borderRadius: 5,
                      padding: '4px 10px', fontSize: 12, fontWeight: 600,
                      cursor: impersonating === u.id ? 'default' : 'pointer',
                      opacity: impersonating === u.id ? 0.6 : 1,
                      transition: 'background 0.2s',
                    }}
                  >
                    {impersonating === u.id ? 'Generating…' : copied === u.id ? '✓ Copied!' : 'Login Link'}
                  </button>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ sess, users, onRefresh }: { sess: Session; users: AdminUser[]; onRefresh: () => void }) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState<Role>('view')
  const [adding, setAdding] = useState(false)
  const [err, setErr]       = useState('')
  const [ok, setOk]         = useState('')

  const addUser = async () => {
    if (!email.includes('@')) { setErr('Enter a valid email'); return }
    setAdding(true); setErr(''); setOk('')
    const res = await apiFetch('/users', sess, { method: 'POST', body: JSON.stringify({ email: email.trim(), role }) })
    setAdding(false)
    if (res) { setEmail(''); setRole('view'); setOk(`${email} added — invite email sent`); onRefresh() }
    else setErr('User already exists or error')
  }

  const removeUser = async (id: string, targetEmail: string) => {
    if (!confirm(`Remove ${targetEmail} from admin?`)) return
    await apiFetch(`/users/${id}`, sess, { method: 'DELETE' })
    onRefresh()
  }

  const changeRole = async (id: string, newRole: string) => {
    await apiFetch(`/users/${id}`, sess, { method: 'PATCH', body: JSON.stringify({ role: newRole }) })
    onRefresh()
  }

  return (
    <div>
      <SectionTitle count={users.length}>Admin Users</SectionTitle>

      {/* Add user form */}
      <Card style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>Add New User</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t2, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Email</div>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="user@company.com"
              style={{ width: '100%', boxSizing: 'border-box' as const, background: C.bg, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t2, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Access Level</div>
            <select value={role} onChange={e => setRole(e.target.value as Role)}
              style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13 }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Btn onClick={addUser} disabled={adding || !email}>{adding ? 'Adding…' : 'Add User'}</Btn>
        </div>
        {err && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>{err}</div>}
        {ok  && <div style={{ color: C.green, fontSize: 12, marginTop: 10 }}>✓ {ok}</div>}
        <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 12, color: C.t3 }}>
          {[['view','Read-only access to all panels'],['comment','Read + update support tickets'],['admin','Full access including user management']].map(([r, d]) => (
            <span key={r}><strong style={{ color: C.t2 }}>{r}</strong> — {d}</span>
          ))}
        </div>
      </Card>

      {/* Admin users table */}
      <Card style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead><tr><TH>Email</TH><TH>Role</TH><TH>Added By</TH><TH>Added On</TH><TH> </TH></tr></thead>
          <tbody>
            {users.length === 0
              ? <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No users yet</td></tr>
              : users.map(u => (
                <tr key={u.id} style={{ background: u.email === sess.email ? C.sub : C.surface }}>
                  <TD>
                    <span style={{ fontWeight: 600 }}>{u.email}</span>
                    {u.email === sess.email && <span style={{ marginLeft: 8, fontSize: 10, color: C.t3, background: C.sub, border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 5px' }}>you</span>}
                  </TD>
                  <TD>
                    <select
                      value={u.role}
                      disabled={u.email === sess.email}
                      onChange={e => changeRole(u.id, e.target.value)}
                      style={{ background: C.surface, color: STATUS_COLORS[u.role] ?? C.t2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 12, fontWeight: 700, cursor: u.email === sess.email ? 'default' : 'pointer' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </TD>
                  <TD><span style={{ color: C.t2 }}>{u.added_by ?? '—'}</span></TD>
                  <TD>{fmtDate(u.created_at)}</TD>
                  <TD>
                    <button
                      onClick={() => removeUser(u.id, u.email)}
                      disabled={u.email === sess.email}
                      style={{ background: 'none', border: 'none', color: u.email === sess.email ? C.t3 : C.red, cursor: u.email === sess.email ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, padding: '3px 6px', borderRadius: 4 }}
                    >Remove</button>
                  </TD>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>

      <AppUsersSection sess={sess} />
    </div>
  )
}

// ── Sessions Tab ─────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<string, string> = {
  web: 'Web', mobile_web: 'Mobile Web', mobile_app: 'Mobile App', tablet: 'Tablet',
}
const BROWSER_LABELS: Record<string, string> = {
  chrome: 'Chrome', safari: 'Safari', firefox: 'Firefox', edge: 'Edge',
  android: 'Android', ios: 'iOS', other: 'Other',
}

function fmtDuration(s: number | null) {
  if (s == null) return '—'
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function StatPills({ map, labelMap }: { map: Record<string, number>; labelMap?: Record<string, string> }) {
  const total = Object.values(map).reduce((a, b) => a + b, 0)
  if (!total) return <span style={{ color: C.t3, fontSize: 12 }}>No data</span>
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
      {Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
        <span key={k} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: C.sub, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: '3px 9px', fontSize: 12,
        }}>
          <span style={{ fontWeight: 700, color: C.t1 }}>{labelMap?.[k] ?? k}</span>
          <span style={{ color: C.t3 }}>{v}</span>
          <span style={{ color: C.t3, fontSize: 10 }}>({Math.round(v / total * 100)}%)</span>
        </span>
      ))}
    </div>
  )
}

function SessionsTab({ data }: { data: SessionsData | null }) {
  if (!data) return <div style={{ color: C.red, fontSize: 14 }}>Failed to load sessions</div>
  const { sessions, stats } = data

  return (
    <div>
      <SectionTitle count={stats.total}>User Sessions</SectionTitle>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Sessions',   val: stats.total,          color: C.indigo },
          { label: 'Avg Duration',     val: fmtDuration(stats.avg_duration_s), color: C.green, raw: true },
          { label: 'Web',              val: stats.by_session_type['web'] ?? 0,         color: C.blue },
          { label: 'Mobile Web',       val: stats.by_session_type['mobile_web'] ?? 0,  color: C.amber },
          { label: 'Tablet',           val: stats.by_session_type['tablet'] ?? 0,      color: C.purple },
          { label: 'Mobile App',       val: stats.by_session_type['mobile_app'] ?? 0,  color: C.pink },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 18px', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>
              {'raw' in s ? s.val : typeof s.val === 'number' ? s.val.toLocaleString() : s.val}
            </div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown rows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { title: 'By Session Type', map: stats.by_session_type, labels: SESSION_TYPE_LABELS },
          { title: 'By Browser',      map: stats.by_browser,      labels: BROWSER_LABELS },
          { title: 'By Device Type',  map: stats.by_device_type,  labels: undefined },
          { title: 'By Country',      map: stats.by_country,      labels: undefined },
        ].map(({ title, map, labels }) => (
          <Card key={title} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 }}>{title}</div>
            <StatPills map={map} labelMap={labels} />
          </Card>
        ))}
      </div>

      {/* Sessions table */}
      <Card style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr>
              <TH>Started</TH><TH>User</TH><TH>Session Type</TH><TH>Browser</TH>
              <TH>Device</TH><TH>OS</TH><TH>Location</TH><TH>Duration</TH>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No sessions recorded yet</td></tr>
            )}
            {sessions.map(s => (
              <tr key={s.id}>
                <TD small>{fmtDate(s.started_at)}</TD>
                <TD small mono><span style={{ color: C.t2, fontSize: 10.5 }}>{s.user_id.slice(0, 16)}…</span></TD>
                <TD small><Badge text={SESSION_TYPE_LABELS[s.session_type] ?? s.session_type} /></TD>
                <TD small><span style={{ fontWeight: 600 }}>{BROWSER_LABELS[s.browser] ?? s.browser}</span></TD>
                <TD small>{s.device_type}</TD>
                <TD small>{s.os ?? '—'}</TD>
                <TD small>{[s.city, s.country].filter(Boolean).join(', ') || '—'}</TD>
                <TD small style={{ fontWeight: s.duration_s ? 600 : 400, color: s.duration_s ? C.t1 : C.t3 }}>
                  {fmtDuration(s.duration_s)}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [sess, setSess]             = useState<Session | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [keyInput, setKeyInput]     = useState('')
  const [loginErr, setLoginErr]     = useState('')
  const [verifying, setVerifying]   = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const [tab, setTab]               = useState<Tab>('stats')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [timeseries, setTimeseries] = useState<Timeseries | null>(null)
  const [tickets, setTickets]       = useState<Ticket[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [crashes, setCrashes]       = useState<Crash[]>([])
  const [dbTables, setDbTables]     = useState<TableStat[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [sessionsData, setSessionsData] = useState<SessionsData | null>(null)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('pplai_admin_sess')
    if (raw) { try { setSess(JSON.parse(raw)) } catch { /* ignore */ } }
  }, [])

  const login = async () => {
    setVerifying(true); setLoginErr('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: keyInput }),
      })
      const d = await res.json()
      if (d.success) {
        const s: Session = { key: d.data.token, email: d.data.email, role: d.data.role }
        sessionStorage.setItem('pplai_admin_sess', JSON.stringify(s))
        setSess(s)
      } else { setLoginErr('Invalid email or password') }
    } catch { setLoginErr('Server unreachable') }
    setVerifying(false)
  }

  const sendForgotPassword = async () => {
    setForgotLoading(true)
    try {
      await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      setForgotSent(true)
    } catch { /* silent */ }
    setForgotLoading(false)
  }

  const loadAdminUsers = useCallback(async (s: Session) => {
    const d = await apiFetch<AdminUser[]>('/users', s)
    if (d) setAdminUsers(d)
  }, [])

  const loadTab = useCallback(async (t: Tab, s: Session) => {
    setLoading(true)
    if (t === 'stats') {
      const [st, ts] = await Promise.all([
        apiFetch<Stats>('/stats', s),
        apiFetch<Timeseries>('/stats/timeseries', s),
      ])
      if (st) setStats(st)
      if (ts) setTimeseries(ts)
    } else if (t === 'support') {
      const d = await apiFetch<Ticket[]>('/tickets', s); if (d) setTickets(d)
    } else if (t === 'suggestions') {
      const d = await apiFetch<Suggestion[]>('/suggestions', s); if (d) setSuggestions(d)
    } else if (t === 'crashes') {
      const d = await apiFetch<Crash[]>('/crashes', s); if (d) setCrashes(d)
    } else if (t === 'database') {
      const d = await apiFetch<TableStat[]>('/database', s); if (d) setDbTables(d)
    } else if (t === 'users') {
      await loadAdminUsers(s)
    } else if (t === 'sessions') {
      const d = await apiFetch<SessionsData>('/sessions', s); if (d) setSessionsData(d)
    }
    setLoading(false)
  }, [loadAdminUsers])

  useEffect(() => {
    if (!sess) return
    loadTab(tab, sess)
  }, [tab, sess, loadTab])

  const signOut = () => {
    sessionStorage.removeItem('pplai_admin_sess')
    setSess(null); setEmailInput(''); setKeyInput('')
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!sess) {
    const inputStyle: React.CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, background: C.bg, color: C.t1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 13px', fontSize: 14, outline: 'none' }
    const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: 0.4 }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '44px 48px', width: 380, boxShadow: C.shadow2 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, marginBottom: 4, letterSpacing: -0.3 }}>PPL AI · Admin</div>
          <div style={{ fontSize: 13, color: C.t2, marginBottom: 30 }}>
            {forgotMode ? 'Reset your password' : 'Sign in to your admin account'}
          </div>

          {forgotMode ? (
            forgotSent ? (
              <>
                <div style={{ color: C.green, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>✓ Check your email for the reset link.</div>
                <button onClick={() => { setForgotMode(false); setForgotSent(false) }}
                  style={{ width: '100%', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Back to Sign In
                </button>
              </>
            ) : (
              <>
                <label style={labelStyle}>Email</label>
                <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendForgotPassword()}
                  placeholder="you@pplai.app" autoFocus
                  style={{ ...inputStyle, marginBottom: 20 }} />
                <button onClick={sendForgotPassword} disabled={forgotLoading || !emailInput}
                  style={{ width: '100%', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: forgotLoading || !emailInput ? 'default' : 'pointer', opacity: forgotLoading || !emailInput ? 0.6 : 1, marginBottom: 12 }}>
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button onClick={() => setForgotMode(false)}
                  style={{ width: '100%', background: 'transparent', color: C.t2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            )
          ) : (
            <>
              <label style={labelStyle}>Email</label>
              <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
                placeholder="you@pplai.app" autoFocus
                style={{ ...inputStyle, marginBottom: 14 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <label style={labelStyle}>Password</label>
                <button onClick={() => setForgotMode(true)}
                  style={{ background: 'none', border: 'none', color: C.indigo, fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                  Forgot password?
                </button>
              </div>
              <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
                placeholder="Enter your password…"
                style={{ ...inputStyle, marginBottom: 20, marginTop: 6 }} />

              {loginErr && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{loginErr}</div>}
              <button onClick={login} disabled={verifying || !emailInput || !keyInput}
                style={{ width: '100%', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: verifying || !emailInput || !keyInput ? 'default' : 'pointer', opacity: verifying || !emailInput || !keyInput ? 0.6 : 1 }}>
                {verifying ? 'Signing in…' : 'Sign In'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const isAdmin = canDo(sess.role, 'admin')
  const canEdit = canDo(sess.role, 'comment')

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'stats',       label: 'Stats' },
    { id: 'sessions',    label: 'Sessions' },
    { id: 'database',    label: 'Database' },
    { id: 'crashes',     label: 'Crashes',     badge: stats?.crashes_7d },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'support',     label: 'Support',     badge: stats?.open_tickets },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Users' }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.t1, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, boxShadow: C.shadow }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: -0.3 }}>PPL AI Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: C.t2 }}>{sess.email}</span>
          <Badge text={sess.role} />
        </div>
        <div style={{ flex: 1 }} />
        <Btn onClick={() => loadTab(tab, sess)} variant="ghost" small>↻ Refresh</Btn>
        <Btn onClick={signOut} variant="ghost" small>Sign out</Btn>
      </div>

      {/* Tabs */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.indigo : C.t2,
            borderBottom: `2px solid ${tab === t.id ? C.indigo : 'transparent'}`,
          }}>
            {t.label}
            {(t.badge ?? 0) > 0 && (
              <span style={{ marginLeft: 6, background: C.red, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
        {loading && <div style={{ color: C.t3, fontSize: 13, marginBottom: 16 }}>Loading…</div>}

        {tab === 'stats'       && <StatsTab stats={stats} timeseries={timeseries} />}
        {tab === 'sessions'    && <SessionsTab data={sessionsData} />}
        {tab === 'database'    && <DatabaseTab tables={dbTables} sess={sess} />}
        {tab === 'crashes'     && (
          <div>
            <SectionTitle note="click row to expand stack">{`Crash Reports`}</SectionTitle>
            <Card style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead><tr><TH>Date</TH><TH>Error</TH><TH>URL</TH><TH>User Agent</TH><TH>Stack</TH></tr></thead>
                <tbody>
                  {crashes.length === 0
                    ? <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No crash reports</td></tr>
                    : crashes.map(c => <CrashRow key={c.id} c={c} />)}
                </tbody>
              </table>
            </Card>
          </div>
        )}
        {tab === 'suggestions' && (
          <div>
            <SectionTitle count={suggestions.length}>{`Suggestions`}</SectionTitle>
            <Card style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead><tr><TH>Votes</TH><TH>Title & Body</TH><TH>Category</TH><TH>Status</TH><TH>Date</TH>{canEdit && <TH>Save</TH>}</tr></thead>
                <tbody>
                  {suggestions.length === 0
                    ? <tr><td colSpan={canEdit ? 6 : 5} style={{ padding: 28, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No suggestions</td></tr>
                    : suggestions.map(s => <SuggestionRow key={s.id} s={s} sess={sess} canEdit={canEdit} onSaved={() => loadTab('stats', sess)} />)}
                </tbody>
              </table>
            </Card>
          </div>
        )}
        {tab === 'support' && (
          <div>
            <SectionTitle count={tickets.length} note={!canEdit ? 'view only' : undefined}>{`Support Tickets`}</SectionTitle>
            <Card style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead><tr><TH>Date</TH><TH>Category</TH><TH>Message</TH><TH>Email</TH><TH>Status</TH><TH>Note</TH>{canEdit && <TH>Save</TH>}</tr></thead>
                <tbody>
                  {tickets.length === 0
                    ? <tr><td colSpan={canEdit ? 7 : 6} style={{ padding: 28, textAlign: 'center' as const, color: C.t3, fontSize: 13 }}>No tickets</td></tr>
                    : tickets.map(t => <TicketRow key={t.id} t={t} sess={sess} canEdit={canEdit} onSaved={() => loadTab('stats', sess)} />)}
                </tbody>
              </table>
            </Card>
          </div>
        )}
        {tab === 'users' && isAdmin && (
          <UsersTab sess={sess} users={adminUsers} onRefresh={() => loadAdminUsers(sess)} />
        )}
      </div>
    </div>
  )
}
