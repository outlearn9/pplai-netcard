import { apiFetch } from '../lib/apiFetch'
import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Search, Plus, ChevronUp, ChevronDown, X, Check, Loader } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const CATEGORY_COLORS = {
  feature:     '#059669',
  improvement: '#6366F1',
  bug:         '#EF4444',
  other:       '#6B7280',
  // Legacy display labels for seed data
  UI: '#6366F1', Feature: '#059669', AI: '#8B5CF6', Integration: '#D97706',
}

const CAT_OPTIONS = [
  { id: 'feature',     label: 'Feature'     },
  { id: 'improvement', label: 'Improvement' },
  { id: 'bug',         label: 'Bug'         },
  { id: 'other',       label: 'Other'       },
]

const STATUS_META = {
  open:     { label: '',         color: 'var(--text-muted)' },
  planned:  { label: 'Planned',  color: '#D97706' },
  done:     { label: 'Done',     color: '#059669' },
  rejected: { label: 'Rejected', color: '#6B7280' },
}

export default function SuggestionsScreen({ navigate, goBack }) {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody,  setNewBody]  = useState('')
  const [newCat,   setNewCat]   = useState('feature')
  const [addErr,   setAddErr]   = useState('')
  const [adding,   setAdding]   = useState(false)
  const [added,    setAdded]    = useState(false)

  useEffect(() => {
    apiFetch(`/api/suggestions`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const vote = async (id, dir) => {
    const item = items.find(s => s.id === id)
    if (!item) return
    const newVote = item.my_vote === dir ? null : dir

    // Optimistic update
    setItems(prev => prev.map(s => {
      if (s.id !== id) return s
      let up = s.up, down = s.down
      if (s.my_vote === 'up') up -= 1
      if (s.my_vote === 'down') down -= 1
      if (newVote === 'up') up += 1
      if (newVote === 'down') down += 1
      return { ...s, up, down, my_vote: newVote }
    }))

    // Server update
    const r = await apiFetch(`/api/suggestions/${id}/vote`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: newVote }),
    }).catch(() => null)

    if (r) {
      const d = await r.json().catch(() => null)
      if (d?.success) {
        setItems(prev => prev.map(s => s.id === id ? { ...s, up: d.data.up, down: d.data.down, my_vote: d.data.my_vote } : s))
      }
    }
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) { setAddErr('Title is required'); return }
    if (!newBody.trim())  { setAddErr('Description is required'); return }
    setAdding(true); setAddErr('')
    try {
      const r = await apiFetch(`/api/suggestions`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim(), category: newCat }),
      })
      const d = await r.json()
      if (!d.success) { setAddErr(d.error || 'Failed to submit'); return }
      setItems(prev => [d.data, ...prev])
      setNewTitle(''); setNewBody(''); setNewCat('feature'); setAdded(true)
      setTimeout(() => { setAdded(false); setShowAdd(false) }, 1200)
    } catch {
      setAddErr('Network error — try again')
    } finally {
      setAdding(false)
    }
  }

  const sorted = useMemo(() =>
    [...items]
      .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.body || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.up - b.down) - (a.up - a.down)),
    [items, search]
  )

  return (
    <div className="screen">
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
            <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
            <rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <div className="screen-header">
        <button className="icon-btn" onClick={goBack ?? (() => navigate('home'))}><ArrowLeft size={20} /></button>
        <span className="header-title">Suggestions</span>
        <button className="icon-btn" onClick={() => setShowAdd(true)}><Plus size={20} /></button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: '10px 16px 0' }}>

          {/* Search + add row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search suggestions…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}
              />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={13}/></button>}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--indigo)', background: 'rgba(99,102,241,0.1)', cursor: 'pointer', color: 'var(--indigo)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <Plus size={13} /> Add new
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader size={22} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
                {sorted.length} suggestion{sorted.length !== 1 ? 's' : ''} · sorted by votes
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 32 }}>
                {sorted.map(s => {
                  const catColor = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other
                  const sm = STATUS_META[s.status] || STATUS_META.open
                  return (
                    <div key={s.id} style={{ background: 'var(--card)', borderRadius: 14, padding: '14px', display: 'flex', gap: 12 }}>
                      {/* Vote column */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => vote(s.id, 'up')}
                          style={{ background: s.my_vote === 'up' ? 'rgba(52,211,153,0.15)' : 'var(--elevated)', border: `1.5px solid ${s.my_vote === 'up' ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <ChevronUp size={15} color={s.my_vote === 'up' ? 'var(--green)' : 'var(--text-muted)'} strokeWidth={2.5} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: s.up - s.down > 0 ? 'var(--green)' : s.up - s.down < 0 ? 'var(--coral)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', minWidth: 20, textAlign: 'center' }}>
                          {s.up - s.down}
                        </span>
                        <button onClick={() => vote(s.id, 'down')}
                          style={{ background: s.my_vote === 'down' ? 'rgba(239,68,68,0.1)' : 'var(--elevated)', border: `1.5px solid ${s.my_vote === 'down' ? 'var(--coral)' : 'var(--border)'}`, borderRadius: 8, width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <ChevronDown size={15} color={s.my_vote === 'down' ? 'var(--coral)' : 'var(--text-muted)'} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.35 }}>{s.title}</span>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {sm.label && <span style={{ fontSize: 10, fontWeight: 700, color: sm.color, background: sm.color + '18', borderRadius: 5, padding: '2px 7px', fontFamily: 'var(--font-sans)' }}>{sm.label}</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, color: catColor, background: catColor + '18', borderRadius: 5, padding: '2px 7px', fontFamily: 'var(--font-sans)' }}>{s.category}</span>
                          </div>
                        </div>
                        {s.body && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-sans)' }}>{s.body}</p>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
                          {s.up} up · {s.down} down
                        </div>
                      </div>
                    </div>
                  )
                })}

                {sorted.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>No suggestions yet</div>
                    <div style={{ fontSize: 12, marginTop: 5, fontFamily: 'var(--font-sans)' }}>Be the first to suggest a feature!</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add suggestion sheet */}
      {showAdd && (
        <>
          <div onClick={() => { setShowAdd(false); setAdded(false) }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '16px 20px 40px', zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              <button onClick={() => { setShowAdd(false); setAdded(false) }} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'var(--elevated)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={15} /></button>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>New Suggestion</h3>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Title *</div>
              <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setAddErr('') }}
                placeholder="Short, clear title…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${addErr && !newTitle ? 'var(--coral)' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--indigo)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Description *</div>
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)}
                placeholder="More context or details…" rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = 'var(--indigo)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {addErr && <div style={{ fontSize: 12, color: 'var(--coral)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{addErr}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {CAT_OPTIONS.map(c => (
                  <button key={c.id} onClick={() => setNewCat(c.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${newCat === c.id ? CATEGORY_COLORS[c.id] : 'var(--border)'}`, background: newCat === c.id ? CATEGORY_COLORS[c.id] + '18' : 'var(--card)', color: newCat === c.id ? CATEGORY_COLORS[c.id] : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                  >{c.label}</button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} disabled={adding} className="btn-primary" style={{ width: '100%' }}>
              {adding ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
               : added  ? <><Check size={16} /> Added!</>
               : 'Submit Suggestion'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
