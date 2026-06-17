import { apiFetch } from '../lib/apiFetch'
import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Loader } from 'lucide-react'
import { readCache } from '../lib/syncQueue.js'

const API = import.meta.env.VITE_API_URL || ''

const SENIORITY_COLORS = {
  'CXO':            '#8B5CF6',
  'Decision Maker': '#6366F1',
  'Key Influencer': '#059669',
  'Gate Keeper':    '#D97706',
}
const STAGE_COLORS = {
  new:'#6366F1', contacted:'#D97706', qualified:'#8B5CF6',
  proposal:'#0EA5E9', won:'#059669', lost:'#EF4444',
}
const STAGE_LABELS = {
  new:'New', contacted:'Contacted', qualified:'Qualified',
  proposal:'Proposal', won:'Won', lost:'Lost',
}
const STAGE_ORDER  = ['new','contacted','qualified','proposal','won','lost']
const CHANNEL_COLORS = { WhatsApp:'#25D366', Email:'#6366F1', SMS:'#F43F5E', Call:'#6B7280' }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function SL({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginBottom:8 }}>
      {children}
    </div>
  )
}

function StatCard({ label, val, color }) {
  return (
    <div style={{ flex:1, background:'var(--card)', borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
      <div style={{ fontSize:22, fontWeight:700, color, fontFamily:'var(--font-serif)', lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:3, lineHeight:1.3 }}>{label}</div>
    </div>
  )
}

function MiniBar({ label, count, max, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', width:106, flexShrink:0, textAlign:'right' }}>{label}</span>
      <div style={{ flex:1, height:7, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:4, background:color, width:`${max ? (count/max)*100 : 0}%`, transition:'width 0.45s ease' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', width:22, flexShrink:0, textAlign:'right' }}>{count}</span>
    </div>
  )
}

function DonutChart({ items }) {
  const total = items.reduce((s, i) => s + i.count, 0)
  if (!total) return (
    <div style={{ width:112, height:112, borderRadius:'50%', background:'var(--border)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>—</span>
    </div>
  )
  let acc = 0
  const stops = items.map(item => {
    const deg = (item.count / total) * 360
    const from = acc; acc += deg
    return `${item.color} ${from.toFixed(1)}deg ${acc.toFixed(1)}deg`
  })
  return (
    <div style={{ position:'relative', width:112, height:112, borderRadius:'50%', background:`conic-gradient(${stops.join(', ')})`, flexShrink:0 }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:60, height:60, borderRadius:'50%', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-serif)', lineHeight:1 }}>{total}</span>
        <span style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>leads</span>
      </div>
    </div>
  )
}

export default function AnalyticsScreen({ goBack }) {
  const [apiStats, setApiStats] = useState(null)
  const [apiLoading, setApiLoading] = useState(true)

  useEffect(() => {
    apiFetch(`/api/analytics`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setApiStats(d.data) })
      .catch(() => {})
      .finally(() => setApiLoading(false))
  }, [])

  const leads      = load('netcard_crm_leads',           [])
  const sentLog    = load('netcard_sent_log',            [])
  const eventPlans = load('netcard_event_followup_plans',{})
  const events     = readCache('api/events') ?? []
  const contacts   = readCache('api/contacts') ?? []

  const s = useMemo(() => {
    // 1. Activity summary
    const eventsCount   = events.length
    const contactsCount = contacts.length || new Set(sentLog.map(l => l.id)).size
    const crmCount      = leads.length
    const bookmarked    = sentLog.filter(l => l.bookmarked).length

    // 2. Outreach
    const sentTotal     = sentLog.length
    const uniqueReached = new Set(sentLog.map(l => l.id)).size
    const channelMap    = {}
    sentLog.forEach(l => { channelMap[l.channel] = (channelMap[l.channel] || 0) + 1 })

    // 3. CRM health
    const withNotes = leads.filter(l => l.notes?.trim()).length
    const withPlan  = leads.filter(l => l.followUpPlan?.length > 0).length
    let totalSteps = 0, doneSteps = 0
    leads.forEach(l => { (l.followUpPlan || []).forEach(p => { totalSteps++; if (p.done) doneSteps++ }) })

    // 4. Pipeline stages
    const stageMap = {}
    STAGE_ORDER.forEach(id => { stageMap[id] = leads.filter(l => l.stage === id).length })

    // 5. Seniority
    const senMap = {}
    leads.forEach(l => { if (l.seniority) senMap[l.seniority] = (senMap[l.seniority] || 0) + 1 })
    const seniorityItems = Object.entries(senMap).map(([label, count]) => ({ label, count, color: SENIORITY_COLORS[label] || '#6B7280' }))

    // 6. Companies
    const coMap = {}
    leads.forEach(l => { if (l.company) coMap[l.company] = (coMap[l.company] || 0) + 1 })
    const companies = Object.entries(coMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))

    // 7. Events breakdown
    const eventBreakdown = events.map(ev => {
      const evLeads  = leads.filter(l => l.event === ev.name)
      const plan     = eventPlans[ev.id] || []
      return { id:ev.id, name:ev.name, status:ev.status, leadsCount:evLeads.length, planTotal:plan.length, planDone:plan.filter(p=>p.done).length }
    })
    // fallback: events only known from leads cache
    const cachedNames = new Set(events.map(e => e.name))
    ;[...new Set(leads.map(l => l.event).filter(e => e && !cachedNames.has(e)))].forEach(name => {
      eventBreakdown.push({ id:name, name, status:'past', leadsCount:leads.filter(l=>l.event===name).length, planTotal:0, planDone:0 })
    })

    return { eventsCount, contactsCount, crmCount, bookmarked, sentTotal, uniqueReached, channelMap, withNotes, withPlan, totalSteps, doneSteps, stageMap, seniorityItems, companies, eventBreakdown }
  }, [leads, sentLog, events, contacts, eventPlans])

  const maxStage = Math.max(...STAGE_ORDER.map(id => s.stageMap[id] || 0), 1)
  const maxCo    = s.companies[0]?.count || 1
  const isEmpty  = s.crmCount === 0 && s.sentTotal === 0 && s.eventsCount === 0 && !apiStats

  // Use API stats when available, fall back to local cache
  const eventsCount   = apiStats?.events.total   ?? s.eventsCount
  const contactsCount = apiStats?.contacts.total  ?? s.contactsCount
  const bookmarked    = apiStats?.contacts.bookmarked ?? s.bookmarked
  const crmCount      = s.crmCount

  // Seniority from API if available, else from local CRM
  const apiSeniority = (apiStats?.seniority ?? []).map(item => ({
    ...item,
    color: SENIORITY_COLORS[item.label] || '#6B7280',
  }))
  const seniorityItems = apiSeniority.length > 0 ? apiSeniority : s.seniorityItems

  // Top events from API
  const topEvents = apiStats?.top_events ?? []

  return (
    <div className="screen">
      {/* Status bar */}
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

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 10px' }}>
        <button onClick={goBack} className="icon-btn"><ArrowLeft size={18}/></button>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:26, fontWeight:500, letterSpacing:-0.8, color:'var(--text-primary)', flex:1 }}>Analytics</h1>
        <TrendingUp size={18} color="var(--indigo)"/>
      </div>

      <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'0 16px 40px' }}>

        {apiLoading && !apiStats ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
            <Loader size={22} color="var(--text-muted)" style={{ animation:'spin 1s linear infinite' }}/>
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)' }}>
            <TrendingUp size={40} color="var(--border)" style={{ margin:'0 auto 14px', display:'block' }}/>
            <div style={{ fontSize:15, fontWeight:500, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>No data yet</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:5 }}>Start networking to see your stats here</div>
          </div>
        ) : (<>

          {/* ── 1. ACTIVITY SUMMARY ── */}
          <div style={{ marginBottom:20 }}>
            <SL>Activity Summary</SL>
            <div style={{ display:'flex', gap:7 }}>
              <StatCard label="Events"     val={eventsCount}   color="var(--indigo)"/>
              <StatCard label="Contacts"   val={contactsCount} color="#0EA5E9"/>
              <StatCard label="In CRM"     val={crmCount}      color="#D97706"/>
              <StatCard label="Bookmarked" val={bookmarked}    color="#EF4444"/>
            </div>
          </div>

          {/* ── 2. OUTREACH ── */}
          {(s.sentTotal > 0) && (
            <div style={{ marginBottom:20 }}>
              <SL>Outreach</SL>
              <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-serif)', lineHeight:1 }}>{s.sentTotal}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:3 }}>Follow-ups sent</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:28, fontWeight:700, color:'var(--indigo)', fontFamily:'var(--font-serif)', lineHeight:1 }}>{s.uniqueReached}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:3 }}>Unique people</div>
                  </div>
                </div>
                {Object.keys(s.channelMap).length > 0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                    {Object.entries(s.channelMap).map(([ch, cnt]) => (
                      <div key={ch} style={{ display:'flex', alignItems:'center', gap:5, background:`${CHANNEL_COLORS[ch]||'#6B7280'}15`, borderRadius:20, padding:'4px 10px' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:CHANNEL_COLORS[ch]||'#6B7280' }}/>
                        <span style={{ fontSize:11, fontWeight:600, color:CHANNEL_COLORS[ch]||'#6B7280', fontFamily:'var(--font-sans)' }}>{ch} · {cnt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3. CRM HEALTH ── */}
          {s.crmCount > 0 && (
            <div style={{ marginBottom:20 }}>
              <SL>CRM Health</SL>
              <div style={{ display:'flex', gap:7, marginBottom:8 }}>
                <div style={{ flex:1, background:'var(--card)', borderRadius:12, padding:'10px 12px' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'#059669', fontFamily:'var(--font-serif)' }}>{s.withNotes}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:2 }}>With Notes</div>
                </div>
                <div style={{ flex:1, background:'var(--card)', borderRadius:12, padding:'10px 12px' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'#0EA5E9', fontFamily:'var(--font-serif)' }}>{s.withPlan}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:2 }}>Follow-up Plan</div>
                </div>
              </div>
              {s.totalSteps > 0 && (
                <div style={{ background:'var(--card)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>Plan steps completed</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#059669', fontFamily:'var(--font-sans)' }}>{s.doneSteps} / {s.totalSteps}</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, background:'#059669', width:`${(s.doneSteps/s.totalSteps)*100}%`, transition:'width 0.5s ease' }}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 4. PIPELINE STAGES ── */}
          {s.crmCount > 0 && STAGE_ORDER.some(id => s.stageMap[id] > 0) && (
            <div style={{ marginBottom:20 }}>
              <SL>Pipeline Stages</SL>
              <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9 }}>
                {STAGE_ORDER.filter(id => s.stageMap[id] > 0).map(id => (
                  <MiniBar key={id} label={STAGE_LABELS[id]} count={s.stageMap[id]} max={maxStage} color={STAGE_COLORS[id]}/>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. SENIORITY MIX ── */}
          {seniorityItems.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <SL>Seniority Mix</SL>
              <div style={{ background:'var(--card)', borderRadius:14, padding:'16px', display:'flex', alignItems:'center', gap:20 }}>
                <DonutChart items={seniorityItems}/>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9 }}>
                  {seniorityItems.map(item => (
                    <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', flex:1 }}>{item.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:item.color, fontFamily:'var(--font-serif)' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 6. COMPANIES MET ── */}
          {s.companies.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <SL>Companies Met</SL>
              <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9 }}>
                {s.companies.map(co => (
                  <MiniBar key={co.name} label={co.name} count={co.count} max={maxCo} color="var(--indigo)"/>
                ))}
              </div>
            </div>
          )}

          {/* ── 6b. TOP EVENTS BY CONTACTS (API) ── */}
          {topEvents.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <SL>Top Events by Contacts</SL>
              <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9 }}>
                {topEvents.map(ev => (
                  <MiniBar key={ev.name} label={ev.name} count={ev.count} max={topEvents[0].count} color="var(--indigo)"/>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. EVENTS BREAKDOWN ── */}
          {s.eventBreakdown.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <SL>Events Breakdown</SL>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {s.eventBreakdown.map(ev => (
                  <div key={ev.id} style={{ background:'var(--card)', borderRadius:14, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:600, color:'var(--text-primary)', flex:1, paddingRight:8 }}>{ev.name}</span>
                      <span style={{
                        fontSize:9, fontWeight:700, letterSpacing:0.4, textTransform:'uppercase', borderRadius:20, padding:'3px 8px', fontFamily:'var(--font-sans)', flexShrink:0,
                        color:  ev.status==='active'?'#059669': ev.status==='upcoming'?'var(--indigo)':'var(--text-muted)',
                        background: ev.status==='active'?'rgba(5,150,105,0.1)': ev.status==='upcoming'?'rgba(99,102,241,0.1)':'var(--elevated)',
                      }}>{ev.status || 'Past'}</span>
                    </div>
                    <div style={{ display:'flex', gap:14 }}>
                      <span style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>
                        <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{ev.leadsCount}</span> in CRM
                      </span>
                      {ev.planTotal > 0 && (
                        <span style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>
                          Plan: <span style={{ fontWeight:700, color:ev.planDone===ev.planTotal?'#059669':'var(--indigo)' }}>{ev.planDone}/{ev.planTotal}</span> done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>)}
      </div>
    </div>
  )
}
