import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, X, SlidersHorizontal, Tag, Trash2, MessageCircle, Mail, ChevronRight, ChevronDown, UserCircle, ArrowUpDown, Send, CalendarCheck, Shield, Check, Download, Users, Calendar, BarChart2 } from 'lucide-react'
import { readCache } from '../lib/syncQueue.js'

const STORAGE_KEY     = 'netcard_crm_leads'
const TEAM_KEY        = 'netcard_team'
const PROFILE_KEY     = 'netcard_my_profile'
const EVENT_PLANS_KEY = 'netcard_event_followup_plans'
const EVENT_QUALS_KEY = 'netcard_event_quals'

const STAGES = [
  { id: 'new',       label: 'New',       color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  { id: 'contacted', label: 'Contacted', color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  { id: 'qualified', label: 'Qualified', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
  { id: 'proposal',  label: 'Proposal',  color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)'  },
  { id: 'won',       label: 'Won',       color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  { id: 'lost',      label: 'Lost',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
]
const FOLLOWUP_STATUSES = ['Not Started','Thank You Email Sent','LinkedIn Connected','Follow-up 1','Follow-up 2','Follow-up 3','Meeting Scheduled','Closed']
const QUAL_DOMAINS      = ['Finance','Banking','Retail','FMCG','Consumer Internet','Technology','Healthcare','Real Estate','Manufacturing','Other']
const QUAL_COMPANY_TYPE = ['GCC','Non-GCC']
const QUAL_COMPANY_SCALE= ['Fortune 500','Fortune 1000','Large Cap','Mid Cap','Small Cap','Start-up']
const QUAL_SENIORITY    = ['CXO','Decision Maker','Key Influencer','Gate Keeper']
const SORT_OPTIONS      = [{ id:'stage',label:'Pipeline stage'},{ id:'name',label:'Name A–Z'},{ id:'company',label:'Company'},{ id:'event',label:'Event'}]

const DEFAULT_PLAN_TEMPLATE = [
  { action: 'Thank You Email',        dayOffset: 0  },
  { action: 'LinkedIn Connection',    dayOffset: 1  },
  { action: 'Follow-up 1',           dayOffset: 7  },
  { action: 'Follow-up on LinkedIn', dayOffset: 10 },
  { action: 'Follow-up 2',           dayOffset: 15 },
  { action: 'Follow-up 3',           dayOffset: 22 },
]

const SAMPLE = [
  { id:1, name:'Sarah Raines', designation:'Product Manager', role:'Product Manager', company:'Stripe',   email:'sarah@stripe.com',   phone:'+1 415 555 0101', whatsapp:'+1 415 555 0101', linkedin:'linkedin.com/in/sarairaines', url:'',           tags:['#fintech','#hot-lead'],       event:'TechConnect 2025', eventDate:'2025-03-14', notes:'Interested in API pricing.', city:'San Francisco', country:'USA',   stage:'qualified', assignee:null, addedBy:[{id:'me',name:'You'}], domain:'Finance',     companyType:'GCC',     companyScale:'Fortune 500', seniority:'Decision Maker', domainQualified:true,  seniorityQualified:true,  followUpStatus:'Thank You Email Sent', overallStatus:'Hot',  followUpPlan:[], comments:[], initials:'SR', grad:'grad-purple' },
  { id:2, name:'Arjun Mehta',  designation:'CTO',             role:'CTO',             company:'Razorpay', email:'arjun@razorpay.com', phone:'+91 98765 43210', whatsapp:'+91 98765 43210', linkedin:'linkedin.com/in/arjunmehta', url:'razorpay.com', tags:['#fintech','#decision-maker'], event:'TechConnect 2025', eventDate:'2025-03-14', notes:'Budget confirmed.',           city:'Mumbai',        country:'India', stage:'proposal',  assignee:null, addedBy:[{id:'me',name:'You'}], domain:'Finance',     companyType:'Non-GCC', companyScale:'Large Cap',   seniority:'CXO',            domainQualified:true,  seniorityQualified:true,  followUpStatus:'LinkedIn Connected',   overallStatus:'Hot',  followUpPlan:[{id:1,action:'Thank You Email',date:'2025-02-09',done:true},{id:2,action:'LinkedIn Connection',date:'2025-02-10',done:true}], comments:[{id:1,authorId:'me',authorName:'You',text:'Met at AI panel, very warm.',createdAt:'2025-03-14T10:00:00Z'}], initials:'AM', grad:'grad-indigo' },
  { id:3, name:'Lisa Chen',    designation:'VP Sales',        role:'VP Sales',        company:'Figma',    email:'lisa@figma.com',     phone:'+1 212 555 0199', whatsapp:'',               linkedin:'linkedin.com/in/lisachen',   url:'figma.com',    tags:['#design','#warm'],            event:'SaaStr Annual',    eventDate:'2025-02-05', notes:'Send deck by Friday.',       city:'New York',      country:'USA',   stage:'contacted', assignee:'me', addedBy:[{id:'me',name:'You'}], domain:'Technology',  companyType:'GCC',     companyScale:'Fortune 500', seniority:'Key Influencer', domainQualified:null,  seniorityQualified:null,  followUpStatus:'',                     overallStatus:'',     followUpPlan:[], comments:[], initials:'LC', grad:'grad-green'  },
  { id:4, name:'Omar Farooq',  designation:'Founder',         role:'Founder',         company:'Bloom',    email:'omar@bloom.io',      phone:'+44 7700 900000', whatsapp:'+44 7700 900000', linkedin:'linkedin.com/in/omarfarooq', url:'bloom.io',     tags:['#saas'],                      event:'SaaStr Annual',    eventDate:'2025-02-05', notes:'Revisit in Q3.',             city:'London',        country:'UK',    stage:'new',       assignee:null, addedBy:[{id:'me',name:'You'}], domain:'Retail',      companyType:'Non-GCC', companyScale:'Start-up',    seniority:'CXO',            domainQualified:false, seniorityQualified:true,  followUpStatus:'Not Started',          overallStatus:'',     followUpPlan:[], comments:[], initials:'OF', grad:'grad-amber'  },
]

function load()           { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)     || 'null') ?? SAMPLE } catch { return SAMPLE } }
function save(d)          { try { localStorage.setItem(STORAGE_KEY,     JSON.stringify(d)) } catch {} }
function loadTeam()       { try { return JSON.parse(localStorage.getItem(TEAM_KEY)        || '[]')  } catch { return [] } }
function loadProfile()    { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)     || '{}')  } catch { return {} } }
function loadEventPlans() { try { return JSON.parse(localStorage.getItem(EVENT_PLANS_KEY) || '{}')  } catch { return {} } }
function saveEventPlans(d){ try { localStorage.setItem(EVENT_PLANS_KEY, JSON.stringify(d)) } catch {} }
function loadEventQuals() { try { return JSON.parse(localStorage.getItem(EVENT_QUALS_KEY) || '{}')  } catch { return {} } }
function saveEventQuals(d){ try { localStorage.setItem(EVENT_QUALS_KEY, JSON.stringify(d)) } catch {} }

const TAG_COLORS = { '#hot-lead':'#EF4444','#warm':'#F59E0B','#fintech':'#6366F1','#decision-maker':'#8B5CF6','#design':'#059669','#saas':'#0EA5E9','#investor':'#D97706' }
const tagColor = t => TAG_COLORS[t] || 'var(--indigo)'

function StageBadge({ stageId, small }) {
  const s = STAGES.find(x => x.id === stageId) || STAGES[0]
  return <span style={{ fontSize:small?10:11, fontWeight:600, color:s.color, background:s.bg, borderRadius:6, padding:small?'2px 6px':'3px 9px', fontFamily:'var(--font-sans)', whiteSpace:'nowrap' }}>{s.label}</span>
}

function QualBadge({ ok, label }) {
  const color = ok === true ? '#059669' : ok === false ? '#EF4444' : 'var(--text-muted)'
  const bg    = ok === true ? 'rgba(5,150,105,0.1)' : ok === false ? 'rgba(239,68,68,0.1)' : 'var(--elevated)'
  const icon  = ok === true ? '✓' : ok === false ? '✗' : '—'
  return <span style={{ fontSize:10, fontWeight:700, color, background:bg, borderRadius:5, padding:'2px 7px', fontFamily:'var(--font-sans)' }}>{icon} {label}</span>
}

function Chip({ color, children }) {
  return <span style={{ fontSize:10, fontWeight:600, color, background:color+'18', borderRadius:5, padding:'2px 6px', fontFamily:'var(--font-sans)' }}>{children}</span>
}

function AssigneePill({ assignee, team, myName, small }) {
  if (!assignee) return null
  const member = team.find(m => m.id === assignee) || (assignee === 'me' ? { name: myName } : null)
  if (!member) return null
  const ini = member.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(99,102,241,0.1)', borderRadius:20, padding:small?'2px 7px':'3px 8px' }}>
      <div style={{ width:small?14:16, height:small?14:16, borderRadius:'50%', background:'var(--indigo)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:7, fontWeight:700, color:'#fff', fontFamily:'var(--font-sans)' }}>{ini}</span>
      </div>
      <span style={{ fontSize:small?9:10, fontWeight:600, color:'var(--indigo)', fontFamily:'var(--font-sans)' }}>{member.name.split(' ')[0]}</span>
    </div>
  )
}

function BarChart({ items, color='var(--indigo)' }) {
  if (!items.length) return <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-sans)', padding:'6px 0' }}>No data yet</div>
  const max = Math.max(...items.map(i => i.count), 1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
      {items.map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', width:108, flexShrink:0, textAlign:'right', lineHeight:1.3 }}>{item.label}</span>
          <div style={{ flex:1, height:8, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background:item.color||color, width:`${(item.count/max)*100}%`, transition:'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', width:70, flexShrink:0 }}>{item.sub||item.count}</span>
        </div>
      ))}
    </div>
  )
}

function escapeCSV(val) {
  if (val == null) return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s
}

function doExport(leads) {
  const today = new Date().toISOString().slice(0,10)
  const planCols = Array.from({length:6},(_,i)=>[`Plan ${i+1} Action`,`Plan ${i+1} Date`,`Plan ${i+1} Done`]).flat()
  const header = ['Event','Event Date','Name','Company','Designation','Email','Phone','WhatsApp','LinkedIn','URL','Location','Added By','Tags','Stage','Assigned To','Domain','Company Type','Company Scale','Seniority','Domain Qualified','Seniority Qualifies','Follow-up Status','Overall Status','Notes',...planCols,'Comments']
  const rows = [header]
  leads.forEach(l => {
    const pc = Array.from({length:6},(_,i)=>{ const s=(l.followUpPlan||[])[i]; return s?[s.action,s.date||'',s.done?'Yes':'No']:['','',''] }).flat()
    rows.push([l.event||'',l.eventDate||'',l.name||'',l.company||'',l.designation||l.role||'',l.email||'',l.phone||'',l.whatsapp||'',l.linkedin||'',l.url||'',[l.city,l.country].filter(Boolean).join(', '),Array.isArray(l.addedBy)?l.addedBy.map(a=>a.name).join('; '):(l.addedBy||''),(l.tags||[]).join('; '),l.stage||'',l.assignee||'',l.domain||'',l.companyType||'',l.companyScale||'',l.seniority||'',l.domainQualified==null?'':l.domainQualified?'Y':'N',l.seniorityQualified==null?'':l.seniorityQualified?'Y':'N',l.followUpStatus||'',l.overallStatus||'',l.notes||'',...pc,(l.comments||[]).map(c=>`${c.authorName}: ${c.text}`).join(' | ')])
  })
  const dm={},sm={},cm={},tm={},scm={}
  leads.forEach(l=>{
    if(l.domain){dm[l.domain]=dm[l.domain]||{p:0,c:new Set()};dm[l.domain].p++;dm[l.domain].c.add(l.company||'')}
    if(l.seniority)sm[l.seniority]=(sm[l.seniority]||0)+1
    if(l.company)cm[l.company]=(cm[l.company]||0)+1
    if(l.companyType)tm[l.companyType]=(tm[l.companyType]||0)+1
    if(l.companyScale)scm[l.companyScale]=(scm[l.companyScale]||0)+1
  })
  const qual=leads.filter(l=>l.domain&&l.seniority).length, won=leads.filter(l=>l.stage==='won').length
  rows.push([],[`=== ANALYTICS (${today}) ===`],['Total Leads','Qualified','Won','Conversion %'],[leads.length,qual,won,leads.length?`${Math.round(won/leads.length*100)}%`:'0%'])
  rows.push([],['DOMAIN'],['Domain','People','Companies'])
  Object.entries(dm).forEach(([d,v])=>rows.push([d,v.p,v.c.size]))
  rows.push([],['SENIORITY'],['Seniority','Count'])
  Object.entries(sm).forEach(([s,c])=>rows.push([s,c]))
  rows.push([],['TOP COMPANIES'],['Company','People'])
  Object.entries(cm).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([co,c])=>rows.push([co,c]))
  rows.push([],['COMPANY TYPE'],['Type','Count'])
  Object.entries(tm).forEach(([t,c])=>rows.push([t,c]))
  rows.push([],['COMPANY SCALE'],['Scale','Count'])
  Object.entries(scm).forEach(([s,c])=>rows.push([s,c]))
  const csv = '\uFEFF' + rows.map(r=>Array.isArray(r)?r.map(escapeCSV).join(','):String(r)).join('\n')
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`leads-${today}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function LeadsCRMScreen({ navigate, goBack }) {
  const [tab, setTab]               = useState('events')
  const [leads, setLeads]           = useState(load)
  const [search, setSearch]         = useState('')
  const [filterTag, setFilterTag]   = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [sortBy, setSortBy]         = useState('stage')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [detail, setDetail]         = useState(null)
  const [commentInput, setCommentInput] = useState('')
  const [planAction, setPlanAction] = useState('')
  const [planDate, setPlanDate]     = useState('')
  const [eventPlans, setEventPlans] = useState(loadEventPlans)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [evPlanInput, setEvPlanInput] = useState('')
  const [evPlanDate, setEvPlanDate]   = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [eventQuals, setEventQuals]   = useState(loadEventQuals)
  const [expandedQual, setExpandedQual] = useState(null)
  const [qualInput, setQualInput]     = useState({ domains:'', companyTypes:'', companyScales:'', seniorities:'' })

  const team    = loadTeam()
  const profile = loadProfile()
  const myName  = profile.name || 'Me'
  const isAdmin = true
  const role = isAdmin ? 'admin' : (team.find(m => m.id === 'me')?.access ?? 'viewer')
  const assignees = [{ id:'me', name:myName }, ...team]
  const events    = readCache('api/events') ?? []

  const [form, setForm] = useState({ name:'', role:'', company:'', email:'', tags:'', event:'', notes:'', city:'', country:'', stage:'new', assignee:null })
  const setF = k => v => setForm(f => ({ ...f, [k]: v }))

  const update     = l => { setLeads(l); save(l) }
  const updateLead = (id, patch) => { const u=leads.map(l=>l.id===id?{...l,...patch}:l); update(u); if(detail?.id===id) setDetail(d=>({...d,...patch})) }
  const removeLead = id => { update(leads.filter(l=>l.id!==id)); setDetail(null) }

  const handleAdd = () => {
    if (!form.name.trim()) return
    const lead = { id:Date.now(), name:form.name.trim(), designation:form.role.trim(), role:form.role.trim(), company:form.company.trim(), email:form.email.trim(), phone:'', whatsapp:'', linkedin:'', url:'', tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t), event:form.event.trim(), eventDate:'', notes:form.notes.trim(), city:form.city.trim(), country:form.country.trim(), stage:form.stage, assignee:form.assignee, addedBy:[{id:'me',name:myName}], domain:'', companyType:'', companyScale:'', seniority:'', domainQualified:null, seniorityQualified:null, followUpStatus:'', overallStatus:'', followUpPlan:[], comments:[], initials:form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), grad:['grad-indigo','grad-purple','grad-green','grad-amber','grad-coral'][Math.floor(Math.random()*5)] }
    update([lead,...leads]); setForm({name:'',role:'',company:'',email:'',tags:'',event:'',notes:'',city:'',country:'',stage:'new',assignee:null}); setShowAdd(false)
  }

  const allTags = useMemo(()=>[...new Set(leads.flatMap(l=>l.tags))],[leads])

  const filtered = useMemo(()=>{
    let r = leads.filter(l=>{
      if(search&&!`${l.name} ${l.role} ${l.company} ${l.notes}`.toLowerCase().includes(search.toLowerCase())) return false
      if(filterTag&&!l.tags.includes(filterTag)) return false
      if(filterStage&&l.stage!==filterStage) return false
      if(filterAssignee&&l.assignee!==filterAssignee) return false
      return true
    })
    if(sortBy==='name')    r=[...r].sort((a,b)=>a.name.localeCompare(b.name))
    if(sortBy==='company') r=[...r].sort((a,b)=>(a.company||'').localeCompare(b.company||''))
    if(sortBy==='event')   r=[...r].sort((a,b)=>(a.event||'').localeCompare(b.event||''))
    if(sortBy==='stage')   r=[...r].sort((a,b)=>STAGES.findIndex(s=>s.id===a.stage)-STAGES.findIndex(s=>s.id===b.stage))
    return r
  },[leads,search,filterTag,filterStage,filterAssignee,sortBy])

  const analytics = useMemo(()=>{
    const total=leads.length, won=leads.filter(l=>l.stage==='won').length
    const qualified=leads.filter(l=>l.domain&&l.seniority).length
    const open=leads.filter(l=>!['won','lost'].includes(l.stage)).length
    const assigned=leads.filter(l=>l.assignee).length
    const myLeads=leads.filter(l=>l.assignee==='me')
    const stageBreakdown=STAGES.map(s=>({label:s.label,count:leads.filter(l=>l.stage===s.id).length,color:s.color})).filter(s=>s.count>0)
    const dm={},sm={},cm={},tm={},scm={}
    leads.forEach(l=>{
      if(l.domain){dm[l.domain]=dm[l.domain]||{p:0,c:new Set()};dm[l.domain].p++;dm[l.domain].c.add(l.company||'')}
      if(l.seniority)sm[l.seniority]=(sm[l.seniority]||0)+1
      if(l.company)cm[l.company]=(cm[l.company]||0)+1
      if(l.companyType)tm[l.companyType]=(tm[l.companyType]||0)+1
      if(l.companyScale)scm[l.companyScale]=(scm[l.companyScale]||0)+1
    })
    const domainChart=Object.entries(dm).sort((a,b)=>b[1].p-a[1].p).map(([label,v])=>({label,count:v.p,sub:`${v.p} ppl · ${v.c.size} co${v.c.size!==1?'s':''}`,color:'var(--indigo)'}))
    const seniorityChart=QUAL_SENIORITY.filter(s=>sm[s]).map(s=>({label:s,count:sm[s],color:'#8B5CF6'}))
    const companyChart=Object.entries(cm).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,count])=>({label,count,sub:`${count} ppl`,color:'#059669'}))
    const typeChart=Object.entries(tm).map(([label,count])=>({label,count,color:'#D97706'}))
    const scaleChart=QUAL_COMPANY_SCALE.filter(s=>scm[s]).map(s=>({label:s,count:scm[s],color:'#0EA5E9'}))
    const myStatusMap={}; myLeads.forEach(l=>{if(l.followUpStatus)myStatusMap[l.followUpStatus]=(myStatusMap[l.followUpStatus]||0)+1})
    const todayStr=new Date().toISOString().slice(0,10)
    const overdue=leads.flatMap(l=>(l.followUpPlan||[]).filter(s=>!s.done&&s.date&&s.date<todayStr).map(s=>({...s,leadName:l.name})))
    return {total,qualified,won,open,assigned,stageBreakdown,domainChart,seniorityChart,companyChart,typeChart,scaleChart,myLeads:myLeads.length,myStatusMap,overdue}
  },[leads])

  const getEventPlan = ev => {
    if (eventPlans[ev.id]) return eventPlans[ev.id]
    const base = ev.end_date || ev.start_date
    const baseDate = base ? new Date(base) : new Date()
    return DEFAULT_PLAN_TEMPLATE.map((t,i)=>{ const d=new Date(baseDate); d.setDate(d.getDate()+t.dayOffset); return {id:i+1,action:t.action,date:d.toISOString().slice(0,10),done:false} })
  }
  const toggleExpandPlan = ev => {
    if (expandedPlan===ev.id) { setExpandedPlan(null); return }
    if (!eventPlans[ev.id]) { const plan=getEventPlan(ev); const next={...eventPlans,[ev.id]:plan}; setEventPlans(next); saveEventPlans(next) }
    setExpandedPlan(ev.id); setEvPlanInput(''); setEvPlanDate('')
  }
  const updateEventPlan = (evId, plan) => { const next={...eventPlans,[evId]:plan}; setEventPlans(next); saveEventPlans(next) }

  const QUAL_CATS = [
    { key:'domains',      label:'Domain',       defaults:QUAL_DOMAINS,       color:'#059669' },
    { key:'companyTypes', label:'Company Type',  defaults:QUAL_COMPANY_TYPE,  color:'#D97706' },
    { key:'companyScales',label:'Company Scale', defaults:QUAL_COMPANY_SCALE, color:'#0EA5E9' },
    { key:'seniorities',  label:'Seniority',     defaults:QUAL_SENIORITY,     color:'#8B5CF6' },
  ]
  const getEvQuals = evId => eventQuals[evId] || { domains:[],companyTypes:[],companyScales:[],seniorities:[],extra:{domains:[],companyTypes:[],companyScales:[],seniorities:[]} }
  const toggleQual = (evId, cat, val) => {
    const q = getEvQuals(evId)
    const cur = q[cat] || []
    const next = { ...q, [cat]: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur,val] }
    const u = { ...eventQuals, [evId]:next }; setEventQuals(u); saveEventQuals(u)
  }
  const addCustomQual = (evId, cat) => {
    const val = qualInput[cat]?.trim(); if (!val) return
    const q = getEvQuals(evId)
    const extra = { ...(q.extra||{}), [cat]: [...new Set([...(q.extra?.[cat]||[]), val])] }
    const selected = [...new Set([...(q[cat]||[]), val])]
    const u = { ...eventQuals, [evId]: { ...q, extra, [cat]: selected } }
    setEventQuals(u); saveEventQuals(u); setQualInput(p=>({...p,[cat]:''}))
  }

  const SL = ({ children }) => <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-sans)' }}>{children}</div>

  const FI = ({ label, value, onChange, placeholder, multiline }) => (
    <div style={{ marginBottom:11 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:5 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{ width:'100%', boxSizing:'border-box', padding:'9px 11px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none', resize:'none', lineHeight:1.5 }} onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', boxSizing:'border-box', padding:'9px 11px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none' }} onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
      }
    </div>
  )

  const hasFilter = filterTag || filterStage || filterAssignee

  return (
    <div className="screen">
      <div className="status-bar">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/><rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/><rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/></svg>
        </div>
      </div>

      <div className="screen-header">
        <button className="icon-btn" onClick={goBack??(() => navigate('home'))}><ArrowLeft size={20}/></button>
        <span className="header-title">Leads CRM</span>
        {tab==='pipeline' && <button className="icon-btn" onClick={()=>setShowAdd(true)}><Plus size={20}/></button>}
        {tab==='analytics' && isAdmin && (
          <div style={{ position:'relative' }}>
            <button className="icon-btn" onClick={()=>setShowExportMenu(e=>!e)}><Download size={18}/></button>
            {showExportMenu && (
              <div style={{ position:'absolute', right:0, top:38, zIndex:60, background:'var(--card)', borderRadius:12, boxShadow:'0 8px 28px rgba(0,0,0,0.18)', border:'1px solid var(--border)', overflow:'hidden', minWidth:170 }}>
                {['CSV','Excel (CSV)'].map(opt=>(
                  <button key={opt} onClick={()=>{ doExport(leads); setShowExportMenu(false) }}
                    style={{ width:'100%', padding:'11px 14px', border:'none', background:'none', color:'var(--text-primary)', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', fontFamily:'var(--font-sans)' }}>
                    Export as {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tab==='events' && <div style={{ width:36 }}/>}
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, padding:'0 16px 10px', borderBottom:'1px solid var(--border)' }}>
        {[
          { id:'events',    icon:<Calendar size={12}/>,          label:'Events'   },
          { id:'pipeline',  icon:<SlidersHorizontal size={12}/>, label:'Pipeline' },
          { id:'analytics', icon:<BarChart2 size={12}/>,         label:'Analytics'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px 0', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:12, fontWeight:tab===t.id?700:500, background:tab===t.id?'var(--indigo)':'var(--card)', color:tab===t.id?'#fff':'var(--text-secondary)', transition:'all 0.15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PIPELINE TAB ── */}
      {tab==='pipeline' && (
        <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ padding:'10px 16px 0' }}>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {[{label:'Total',val:analytics.total,color:'var(--indigo)'},{label:'Qualified',val:analytics.qualified,color:'#8B5CF6'},{label:'Assigned',val:analytics.assigned,color:'#D97706'}].map(s=>(
                <div key={s.label} style={{ flex:1, background:'var(--card)', borderRadius:10, padding:'8px 6px', textAlign:'center' }}>
                  <div style={{ fontSize:17, fontWeight:700, color:s.color, fontFamily:'var(--font-serif)' }}>{s.val}</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-sans)', lineHeight:1.2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:10, WebkitOverflowScrolling:'touch' }}>
              <button onClick={()=>setFilterStage('')} style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${!filterStage?'var(--indigo)':'var(--border)'}`, background:!filterStage?'rgba(99,102,241,0.1)':'var(--card)', color:!filterStage?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>All</button>
              {STAGES.map(s=>{ const cnt=leads.filter(l=>l.stage===s.id).length; return (
                <button key={s.id} onClick={()=>setFilterStage(filterStage===s.id?'':s.id)}
                  style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20, border:`1.5px solid ${filterStage===s.id?s.color:'var(--border)'}`, background:filterStage===s.id?s.bg:'var(--card)', color:filterStage===s.id?s.color:'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>
                  {s.label}<span style={{ background:filterStage===s.id?s.color:'var(--border)', color:filterStage===s.id?'#fff':'var(--text-muted)', borderRadius:10, padding:'1px 5px', fontSize:9, fontWeight:700 }}>{cnt}</span>
                </button>
              )})}
            </div>
            <div style={{ display:'flex', gap:7, marginBottom:8 }}>
              <div style={{ flex:1, position:'relative' }}>
                <Search size={13} color="var(--text-muted)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px 8px 29px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none' }}/>
              </div>
              <div style={{ position:'relative' }}>
                <button onClick={()=>setShowSortMenu(s=>!s)} style={{ display:'flex', alignItems:'center', padding:'8px 10px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', cursor:'pointer', color:'var(--text-secondary)' }}><ArrowUpDown size={14}/></button>
                {showSortMenu && (
                  <div style={{ position:'absolute', right:0, top:38, zIndex:30, background:'var(--card)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid var(--border)', overflow:'hidden', minWidth:160 }}>
                    {SORT_OPTIONS.map(o=><button key={o.id} onClick={()=>{ setSortBy(o.id); setShowSortMenu(false) }} style={{ width:'100%', padding:'10px 14px', border:'none', background:sortBy===o.id?'rgba(99,102,241,0.08)':'transparent', color:sortBy===o.id?'var(--indigo)':'var(--text-primary)', fontSize:13, fontWeight:sortBy===o.id?600:400, cursor:'pointer', textAlign:'left', fontFamily:'var(--font-sans)' }}>{o.label}</button>)}
                  </div>
                )}
              </div>
              <button onClick={()=>setShowFilters(f=>!f)} style={{ display:'flex', alignItems:'center', padding:'8px 10px', borderRadius:10, border:`1.5px solid ${hasFilter?'var(--indigo)':'var(--border)'}`, background:hasFilter?'rgba(99,102,241,0.1)':'var(--card)', cursor:'pointer', color:hasFilter?'var(--indigo)':'var(--text-secondary)' }}><SlidersHorizontal size={14}/></button>
            </div>
            {showFilters && (
              <div style={{ background:'var(--card)', borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
                {[{label:'Tag',value:filterTag,set:setFilterTag,opts:allTags},{label:'Assignee',value:filterAssignee,set:setFilterAssignee,opts:assignees,isA:true}].map(f=>(
                  <div key={f.label} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>{f.isA?<UserCircle size={10}/>:<Tag size={10}/>} {f.label}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {f.isA ? assignees.map(a=><button key={a.id} onClick={()=>f.set(f.value===a.id?'':a.id)} style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${f.value===a.id?'var(--indigo)':'var(--border)'}`, background:f.value===a.id?'rgba(99,102,241,0.1)':'transparent', color:f.value===a.id?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{a.name.split(' ')[0]}</button>)
                       : f.opts.map(o=><button key={o} onClick={()=>f.set(f.value===o?'':o)} style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${f.value===o?'var(--indigo)':'var(--border)'}`, background:f.value===o?'rgba(99,102,241,0.1)':'transparent', color:f.value===o?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{o}</button>)}
                    </div>
                  </div>
                ))}
                {hasFilter && <button onClick={()=>{ setFilterTag(''); setFilterAssignee('') }} style={{ background:'none', border:'none', color:'var(--coral)', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-sans)', padding:0, marginTop:2 }}>Clear filters</button>}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:8, paddingBottom:32 }}>
              {filtered.length===0 && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}><Search size={28} color="var(--border)" style={{ margin:'0 auto 10px', display:'block' }}/><div style={{ fontSize:14, fontWeight:500, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>No leads found</div></div>}
              {filtered.map(l=>(
                <div key={l.id} onClick={()=>setDetail(l)} style={{ background:'var(--card)', borderRadius:14, padding:'12px 14px', cursor:'pointer', borderLeft:`3px solid ${STAGES.find(s=>s.id===l.stage)?.color||'var(--border)'}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
                    <div className={`avatar ${l.grad}`} style={{ width:38, height:38, fontSize:12, flexShrink:0 }}>{l.initials}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:2 }}>
                        <span style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>{l.name}</span>
                        <StageBadge stageId={l.stage} small/>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>{[l.role,l.company].filter(Boolean).join(' · ')}</div>
                      {/* Admin: qual status + qual chips + followup/assigned + tags */}
                      {role === 'admin' && (<>
                        {(l.domainQualified !== null || l.seniorityQualified !== null) && (
                          <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}>
                            {l.domainQualified !== null && <QualBadge ok={l.domainQualified} label="Domain"/>}
                            {l.seniorityQualified !== null && <QualBadge ok={l.seniorityQualified} label="Seniority"/>}
                          </div>
                        )}
                        {(l.domain||l.companyType||l.seniority) && (
                          <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                            {l.domain && <Chip color="#059669">{l.domain}</Chip>}
                            {l.companyType && <Chip color="#D97706">{l.companyType}</Chip>}
                            {l.seniority && <Chip color="#8B5CF6">{l.seniority}</Chip>}
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' }}>
                          {l.followUpStatus && <span style={{ fontSize:10, fontWeight:600, color:'var(--indigo)', background:'rgba(99,102,241,0.1)', borderRadius:5, padding:'2px 7px', fontFamily:'var(--font-sans)' }}>{l.followUpStatus}</span>}
                          <AssigneePill assignee={l.assignee} team={team} myName={myName} small/>
                        </div>
                        {l.tags.length>0 && <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>{l.tags.slice(0,2).map(t=><span key={t} style={{ fontSize:10, fontWeight:600, color:tagColor(t), background:tagColor(t)+'18', borderRadius:5, padding:'2px 6px', fontFamily:'var(--font-sans)' }}>{t}</span>)}</div>}
                      </>)}
                      {/* Editor: followup/assigned + tags + event */}
                      {role === 'editor' && (<>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' }}>
                          {l.followUpStatus && <span style={{ fontSize:10, fontWeight:600, color:'var(--indigo)', background:'rgba(99,102,241,0.1)', borderRadius:5, padding:'2px 7px', fontFamily:'var(--font-sans)' }}>{l.followUpStatus}</span>}
                          <AssigneePill assignee={l.assignee} team={team} myName={myName} small/>
                        </div>
                        {l.tags.length>0 && <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>{l.tags.slice(0,2).map(t=><span key={t} style={{ fontSize:10, fontWeight:600, color:tagColor(t), background:tagColor(t)+'18', borderRadius:5, padding:'2px 6px', fontFamily:'var(--font-sans)' }}>{t}</span>)}</div>}
                        {l.event && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:4 }}>{l.event}</div>}
                      </>)}
                      {/* Viewer: followup/assigned (for their own tasks) + tags + event/location */}
                      {role === 'viewer' && (<>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' }}>
                          {l.followUpStatus && <span style={{ fontSize:10, fontWeight:600, color:'var(--indigo)', background:'rgba(99,102,241,0.1)', borderRadius:5, padding:'2px 7px', fontFamily:'var(--font-sans)' }}>{l.followUpStatus}</span>}
                          <AssigneePill assignee={l.assignee} team={team} myName={myName} small/>
                        </div>
                        {l.tags.length>0 && <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>{l.tags.slice(0,2).map(t=><span key={t} style={{ fontSize:10, fontWeight:600, color:tagColor(t), background:tagColor(t)+'18', borderRadius:5, padding:'2px 6px', fontFamily:'var(--font-sans)' }}>{t}</span>)}</div>}
                        {(l.event||l.city) && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:4 }}>{[l.event,l.city].filter(Boolean).join(' · ')}</div>}
                      </>)}
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink:0, marginTop:4 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ── */}
      {tab==='events' && (
        <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'12px 16px 32px' }}>
          {events.length===0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)' }}>
              <Calendar size={36} color="var(--border)" style={{ margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontSize:14, fontFamily:'var(--font-sans)', fontWeight:500, color:'var(--text-secondary)' }}>No events yet</div>
              <button onClick={()=>navigate('addEvent')} className="btn-primary" style={{ marginTop:16 }}><Plus size={14}/> Create Event</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {events.map(ev=>{
                const isActive=ev.is_active||ev.status==='active'
                const contactCount=Array.isArray(ev.contacts)?(ev.contacts[0]?.count??0):(ev.contacts??0)
                const plan=eventPlans[ev.id]||null
                const planSteps=plan?plan.length:DEFAULT_PLAN_TEMPLATE.length
                const planDone=plan?plan.filter(s=>s.done).length:0
                const isExpanded=expandedPlan===ev.id
                return (
                  <div key={ev.id} style={{ background:'var(--card)', borderRadius:16, overflow:'hidden', border:isActive?'1.5px solid var(--green)':'1.5px solid var(--border)' }}>
                    {isActive && <div style={{ background:'rgba(52,211,153,0.1)', padding:'5px 14px', display:'flex', alignItems:'center', gap:6 }}><span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}/><span style={{ fontSize:10, fontWeight:700, color:'var(--green)', letterSpacing:0.5, fontFamily:'var(--font-sans)' }}>ACTIVE</span></div>}
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{ev.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginBottom:10 }}>{contactCount} contacts · {planDone}/{planSteps} steps done</div>
                      <div style={{ display:'flex', gap:8, marginBottom:7 }}>
                        <button onClick={()=>navigate('eventContacts',ev)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, background:'var(--indigo)', border:'none', borderRadius:10, padding:'8px 0', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:600, fontFamily:'var(--font-sans)' }}><Users size={12}/> Contacts</button>
                        <button onClick={()=>toggleExpandPlan(ev)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, background:isExpanded?'rgba(99,102,241,0.12)':'var(--elevated)', border:`1.5px solid ${isExpanded?'var(--indigo)':'var(--border)'}`, borderRadius:10, padding:'8px 0', cursor:'pointer', color:isExpanded?'var(--indigo)':'var(--text-secondary)', fontSize:12, fontWeight:600, fontFamily:'var(--font-sans)' }}>
                          <CalendarCheck size={12}/> Follow-up Plan {isExpanded?<ChevronDown size={11}/>:<ChevronRight size={11}/>}
                        </button>
                      </div>
                      {(() => {
                        const isQualExpanded = expandedQual === ev.id
                        const quals = getEvQuals(ev.id)
                        const totalSelected = QUAL_CATS.reduce((s,c)=>(quals[c.key]?.length||0)+s,0)
                        return (
                          <button onClick={()=>setExpandedQual(isQualExpanded?null:ev.id)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:isQualExpanded?'rgba(99,102,241,0.08)':'var(--elevated)', border:`1.5px solid ${isQualExpanded?'var(--indigo)':'var(--border)'}`, borderRadius:10, padding:'7px 12px', cursor:'pointer', color:isQualExpanded?'var(--indigo)':'var(--text-secondary)', fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}><Shield size={12}/> Qualification Criteria</div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              {totalSelected>0 && <span style={{ fontSize:10, fontWeight:700, color:'var(--green)', background:'rgba(52,211,153,0.15)', borderRadius:10, padding:'1px 7px' }}>{totalSelected} set</span>}
                              {isQualExpanded?<ChevronDown size={11}/>:<ChevronRight size={11}/>}
                            </div>
                          </button>
                        )
                      })()}
                    </div>
                    {expandedQual===ev.id && (()=>{
                      const quals = getEvQuals(ev.id)
                      const canEdit = role==='admin'||role==='editor'
                      return (
                        <div style={{ borderTop:'1px solid var(--border)', padding:'12px 14px 14px' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-sans)' }}>Qualification Criteria</div>
                          {QUAL_CATS.map(cat=>{
                            const allOpts = [...cat.defaults, ...(quals.extra?.[cat.key]||[])]
                            const selected = quals[cat.key]||[]
                            return (
                              <div key={cat.key} style={{ marginBottom:12 }}>
                                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:6, fontFamily:'var(--font-sans)' }}>{cat.label}</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom: canEdit?6:0 }}>
                                  {allOpts.map(opt=>{ const on=selected.includes(opt); return (
                                    <button key={opt} onClick={()=>canEdit&&toggleQual(ev.id,cat.key,opt)}
                                      style={{ padding:'3px 10px', borderRadius:20, border:`1.5px solid ${on?cat.color:'var(--border)'}`, background:on?cat.color+'18':'transparent', color:on?cat.color:'var(--text-muted)', fontSize:11, fontWeight:on?700:400, cursor:canEdit?'pointer':'default', fontFamily:'var(--font-sans)', transition:'all 0.12s' }}>
                                      {on?'✓ ':''}{opt}
                                    </button>
                                  )})}
                                </div>
                                {canEdit && (
                                  <div style={{ display:'flex', gap:5 }}>
                                    <input value={qualInput[cat.key]||''} onChange={e=>setQualInput(p=>({...p,[cat.key]:e.target.value}))}
                                      onKeyDown={e=>{ if(e.key==='Enter') addCustomQual(ev.id,cat.key) }}
                                      placeholder={`+ add own ${cat.label.toLowerCase()}…`}
                                      style={{ flex:1, padding:'5px 9px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--elevated)', color:'var(--text-primary)', fontSize:11, fontFamily:'var(--font-sans)', outline:'none' }}
                                      onFocus={e=>e.target.style.borderColor=cat.color} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                                    <button onClick={()=>addCustomQual(ev.id,cat.key)} style={{ padding:'5px 10px', borderRadius:8, border:'none', background:qualInput[cat.key]?.trim()?cat.color:'var(--elevated)', color:qualInput[cat.key]?.trim()?'#fff':'var(--text-muted)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)', flexShrink:0 }}>+</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    {isExpanded && (()=>{
                      const steps=eventPlans[ev.id]||[]
                      return (
                        <div style={{ borderTop:'1px solid var(--border)', padding:'12px 14px 14px' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10, fontFamily:'var(--font-sans)' }}>Follow-up Steps</div>
                          {steps.map((step,i)=>(
                            <div key={step.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                              <button onClick={()=>updateEventPlan(ev.id,steps.map(s=>s.id===step.id?{...s,done:!s.done}:s))} style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>
                                <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${step.done?'var(--green)':'var(--border)'}`, background:step.done?'var(--green)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {step.done && <Check size={11} color="#fff" strokeWidth={3}/>}
                                </div>
                              </button>
                              <span style={{ flex:1, fontSize:12, color:step.done?'var(--text-muted)':'var(--text-primary)', fontFamily:'var(--font-sans)', textDecoration:step.done?'line-through':'none' }}>{i+1}. {step.action}</span>
                              <input type="date" value={step.date||''} onChange={e=>updateEventPlan(ev.id,steps.map(s=>s.id===step.id?{...s,date:e.target.value}:s))} style={{ width:100, padding:'4px 7px', borderRadius:7, border:'1.5px solid var(--border)', background:'var(--elevated)', color:step.date?'var(--text-primary)':'var(--text-muted)', fontSize:10, fontFamily:'var(--font-sans)', outline:'none' }}/>
                              <button onClick={()=>updateEventPlan(ev.id,steps.filter(s=>s.id!==step.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2, flexShrink:0 }}><X size={12}/></button>
                            </div>
                          ))}
                          <div style={{ display:'flex', gap:6, marginTop:10 }}>
                            <input value={evPlanInput} onChange={e=>setEvPlanInput(e.target.value)} placeholder="Add step…"
                              onKeyDown={e=>{ if(e.key==='Enter'&&evPlanInput.trim()){ updateEventPlan(ev.id,[...steps,{id:Date.now(),action:evPlanInput.trim(),date:evPlanDate,done:false}]); setEvPlanInput(''); setEvPlanDate('') }}}
                              style={{ flex:1, padding:'7px 10px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--elevated)', color:'var(--text-primary)', fontSize:12, fontFamily:'var(--font-sans)', outline:'none' }}
                              onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                            <input type="date" value={evPlanDate} onChange={e=>setEvPlanDate(e.target.value)} style={{ width:100, padding:'7px 8px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--elevated)', color:evPlanDate?'var(--text-primary)':'var(--text-muted)', fontSize:10, fontFamily:'var(--font-sans)', outline:'none' }}/>
                            <button onClick={()=>{ if(!evPlanInput.trim()) return; updateEventPlan(ev.id,[...steps,{id:Date.now(),action:evPlanInput.trim(),date:evPlanDate,done:false}]); setEvPlanInput(''); setEvPlanDate('') }} style={{ background:evPlanInput.trim()?'var(--indigo)':'var(--elevated)', border:'none', borderRadius:9, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:evPlanInput.trim()?'pointer':'default', color:evPlanInput.trim()?'#fff':'var(--text-muted)', flexShrink:0 }}><Plus size={14}/></button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab==='analytics' && (
        <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'12px 16px 32px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {[{label:'Total Leads',val:analytics.total,color:'var(--indigo)'},{label:'Qualified',val:analytics.qualified,color:'#8B5CF6'},{label:'Won',val:analytics.won,color:'var(--green)'},{label:'Conversion',val:analytics.total?`${Math.round(analytics.won/analytics.total*100)}%`:'0%',color:'#D97706'}].map(s=>(
              <div key={s.label} style={{ background:'var(--card)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'var(--font-serif)' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {[
            { title:'Pipeline Breakdown', items:analytics.stageBreakdown },
          ].map(c=>(
            <div key={c.title} style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-sans)' }}>{c.title}</div>
              <BarChart items={c.items}/>
            </div>
          ))}

          <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:10, fontFamily:'var(--font-sans)' }}>My Stats</div>
            <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'var(--font-sans)', marginBottom:8 }}><span style={{ fontWeight:700, color:'var(--indigo)' }}>{analytics.myLeads}</span> leads assigned to me</div>
            {Object.keys(analytics.myStatusMap).length>0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {Object.entries(analytics.myStatusMap).map(([s,c])=><span key={s} style={{ fontSize:10, fontWeight:600, color:'var(--indigo)', background:'rgba(99,102,241,0.1)', borderRadius:20, padding:'3px 9px', fontFamily:'var(--font-sans)' }}>{s}: {c}</span>)}
              </div>
            )}
            {analytics.overdue.length>0 && (
              <div style={{ background:'rgba(239,68,68,0.07)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#EF4444', marginBottom:6, fontFamily:'var(--font-sans)' }}>⚠ Overdue ({analytics.overdue.length})</div>
                {analytics.overdue.slice(0,3).map(s=><div key={s.id} style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', marginBottom:3 }}>{s.leadName} — {s.action} <span style={{ color:'#EF4444' }}>({s.date})</span></div>)}
              </div>
            )}
          </div>

          {[
            { title:'By Domain',        items:analytics.domainChart,   color:'var(--indigo)' },
            { title:'By Seniority',     items:analytics.seniorityChart,color:'#8B5CF6'       },
            { title:'By Company',       items:analytics.companyChart,  color:'#059669'       },
          ].map(c=>(
            <div key={c.title} style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-sans)' }}>{c.title}</div>
              <BarChart items={c.items} color={c.color}/>
            </div>
          ))}

          <div style={{ background:'var(--card)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-sans)' }}>Company Type</div>
            <BarChart items={analytics.typeChart} color="#D97706"/>
            {analytics.scaleChart.length>0 && <>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.4, textTransform:'uppercase', margin:'14px 0 12px', fontFamily:'var(--font-sans)' }}>Company Scale</div>
              <BarChart items={analytics.scaleChart} color="#0EA5E9"/>
            </>}
          </div>
        </div>
      )}

      {/* ── Detail sheet ── */}
      {detail && (
        <>
          <div onClick={()=>setDetail(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40 }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--bg)', borderRadius:'20px 20px 0 0', padding:'0 0 36px', zIndex:50, maxHeight:'88%', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 20px 0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', position:'relative', marginBottom:16 }}>
                <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }}/>
                <button onClick={()=>setDetail(null)} style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', background:'var(--elevated)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)' }}><X size={15}/></button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div className={`avatar ${detail.grad}`} style={{ width:52, height:52, fontSize:16 }}>{detail.initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>{detail.name}</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--font-sans)' }}>{[detail.role,detail.company].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {detail.email && <button onClick={()=>window.open(`mailto:${detail.email}`)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'var(--card)', border:'none', borderRadius:12, padding:'10px 0', cursor:'pointer', color:'var(--green)', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500 }}><Mail size={14}/>Email</button>}
                <button onClick={()=>{ setDetail(null); navigate('chat',detail) }} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'var(--indigo)', border:'none', borderRadius:12, padding:'10px 0', cursor:'pointer', color:'#fff', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500 }}><MessageCircle size={14}/>Message</button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
              {/* Contact Info */}
              <div style={{ marginBottom:16 }}>
                <SL>Contact Info</SL>
                <div style={{ background:'var(--card)', borderRadius:12, overflow:'hidden' }}>
                  {[{label:'Event',val:detail.event},{label:'Date',val:detail.eventDate?new Date(detail.eventDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''},{label:'Company',val:detail.company},{label:'Designation',val:detail.designation||detail.role},{label:'Email',val:detail.email},{label:'Phone',val:detail.phone},{label:'WhatsApp',val:detail.whatsapp},{label:'Location',val:[detail.city,detail.country].filter(Boolean).join(', ')},{label:'LinkedIn',val:detail.linkedin},{label:'URL',val:detail.url},{label:'Added By',val:Array.isArray(detail.addedBy)?detail.addedBy.map(a=>a.name).join(', '):(detail.addedBy||'')}].filter(r=>r.val).map((r,i,arr)=>(
                    <div key={r.label} style={{ display:'flex', padding:'8px 12px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none', gap:10 }}>
                      <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)', width:76, flexShrink:0, paddingTop:1 }}>{r.label}</span>
                      <span style={{ fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-sans)', flex:1, wordBreak:'break-word' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {(detail.tags||[]).length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>{detail.tags.map(t=><span key={t} style={{ fontSize:11, fontWeight:600, color:tagColor(t), background:tagColor(t)+'18', borderRadius:6, padding:'4px 10px', fontFamily:'var(--font-sans)' }}>{t}</span>)}</div>}

              {/* Pipeline Stage */}
              <div style={{ marginBottom:16 }}>
                <SL>Pipeline Stage</SL>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {STAGES.map(s=><button key={s.id} onClick={()=>updateLead(detail.id,{stage:s.id})} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${detail.stage===s.id?s.color:'var(--border)'}`, background:detail.stage===s.id?s.bg:'var(--card)', color:detail.stage===s.id?s.color:'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)', transition:'all 0.15s' }}>{s.label}</button>)}
                </div>
              </div>

              {/* Qualification */}
              {isAdmin && (
                <div style={{ marginBottom:16 }}>
                  <SL><Shield size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/>Qualification</SL>
                  <div style={{ background:'var(--card)', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>
                    {[{label:'Domain',opts:QUAL_DOMAINS,field:'domain',color:'#059669'},{label:'Company Type',opts:QUAL_COMPANY_TYPE,field:'companyType',color:'#D97706'},{label:'Company Scale',opts:QUAL_COMPANY_SCALE,field:'companyScale',color:'#0EA5E9'},{label:'Seniority',opts:QUAL_SENIORITY,field:'seniority',color:'#8B5CF6'}].map(q=>(
                      <div key={q.field}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:0.4, textTransform:'uppercase', marginBottom:6, fontFamily:'var(--font-sans)' }}>{q.label}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {q.opts.map(o=>{ const active=detail[q.field]===o; return <button key={o} onClick={()=>updateLead(detail.id,{[q.field]:active?'':o})} style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${active?q.color:'var(--border)'}`, background:active?q.color+'18':'transparent', color:active?q.color:'var(--text-muted)', fontSize:11, fontWeight:active?700:500, cursor:'pointer', fontFamily:'var(--font-sans)', whiteSpace:'nowrap', transition:'all 0.12s' }}>{o}</button> })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment */}
              {isAdmin && (
                <div style={{ marginBottom:16 }}>
                  <SL>Assigned To</SL>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    <button onClick={()=>updateLead(detail.id,{assignee:null})} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${!detail.assignee?'var(--indigo)':'var(--border)'}`, background:!detail.assignee?'rgba(99,102,241,0.1)':'var(--card)', color:!detail.assignee?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>Unassigned</button>
                    {assignees.map(a=><button key={a.id} onClick={()=>updateLead(detail.id,{assignee:a.id})} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${detail.assignee===a.id?'var(--indigo)':'var(--border)'}`, background:detail.assignee===a.id?'rgba(99,102,241,0.1)':'var(--card)', color:detail.assignee===a.id?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{a.name.split(' ')[0]}</button>)}
                  </div>
                </div>
              )}

              {/* Follow-up Plan */}
              {isAdmin && (
                <div style={{ marginBottom:16 }}>
                  <SL><CalendarCheck size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/>Follow-up Plan</SL>
                  {(detail.followUpPlan||[]).length>0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                      {(detail.followUpPlan||[]).map((step,i)=>(
                        <div key={step.id} style={{ display:'flex', alignItems:'center', gap:9, background:'var(--card)', borderRadius:10, padding:'9px 12px' }}>
                          <button onClick={()=>updateLead(detail.id,{followUpPlan:(detail.followUpPlan||[]).map(s=>s.id===step.id?{...s,done:!s.done}:s)})} style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>
                            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${step.done?'var(--green)':'var(--border)'}`, background:step.done?'var(--green)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{step.done && <Check size={11} color="#fff" strokeWidth={3}/>}</div>
                          </button>
                          <span style={{ fontSize:12, fontWeight:500, color:step.done?'var(--text-muted)':'var(--text-primary)', fontFamily:'var(--font-sans)', flex:1, textDecoration:step.done?'line-through':'none' }}>{i+1}. {step.action}</span>
                          {step.date && <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-sans)', flexShrink:0 }}>{new Date(step.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                          <button onClick={()=>updateLead(detail.id,{followUpPlan:(detail.followUpPlan||[]).filter(s=>s.id!==step.id)})} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2, flexShrink:0 }}><X size={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                    <input value={planAction} onChange={e=>setPlanAction(e.target.value)} placeholder="Add step…"
                      onKeyDown={e=>{ if(e.key==='Enter'&&planAction.trim()){ updateLead(detail.id,{followUpPlan:[...(detail.followUpPlan||[]),{id:Date.now(),action:planAction.trim(),date:planDate,done:false}]}); setPlanAction(''); setPlanDate('') }}}
                      style={{ flex:1, padding:'8px 11px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:12, fontFamily:'var(--font-sans)', outline:'none' }}
                      onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                    <input type="date" value={planDate} onChange={e=>setPlanDate(e.target.value)} style={{ width:110, padding:'8px 9px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:planDate?'var(--text-primary)':'var(--text-muted)', fontSize:11, fontFamily:'var(--font-sans)', outline:'none' }} onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                    <button onClick={()=>{ if(!planAction.trim()) return; updateLead(detail.id,{followUpPlan:[...(detail.followUpPlan||[]),{id:Date.now(),action:planAction.trim(),date:planDate,done:false}]}); setPlanAction(''); setPlanDate('') }} style={{ background:planAction.trim()?'var(--indigo)':'var(--elevated)', border:'none', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:planAction.trim()?'pointer':'default', color:planAction.trim()?'#fff':'var(--text-muted)', flexShrink:0 }}><Plus size={15}/></button>
                  </div>
                </div>
              )}

              {/* Follow-up Status */}
              <div style={{ marginBottom:16 }}>
                <SL>Follow-up Status</SL>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {FOLLOWUP_STATUSES.map(s=><button key={s} onClick={()=>updateLead(detail.id,{followUpStatus:detail.followUpStatus===s?'':s})} style={{ padding:'5px 11px', borderRadius:20, border:`1.5px solid ${detail.followUpStatus===s?'var(--indigo)':'var(--border)'}`, background:detail.followUpStatus===s?'rgba(99,102,241,0.1)':'var(--card)', color:detail.followUpStatus===s?'var(--indigo)':'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)', transition:'all 0.12s' }}>{s}</button>)}
                </div>
              </div>

              {/* Overall Status */}
              <div style={{ marginBottom:16 }}>
                <SL>Overall Status</SL>
                <input value={detail.overallStatus||''} onChange={e=>updateLead(detail.id,{overallStatus:e.target.value})} placeholder="e.g. Hot lead, Needs nurturing…" style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none' }} onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
              </div>

              {/* Notes */}
              <div style={{ marginBottom:16 }}>
                <SL>Notes</SL>
                <textarea value={detail.notes||''} onChange={e=>updateLead(detail.id,{notes:e.target.value})} placeholder="Add notes…" rows={3} style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none', resize:'none', lineHeight:1.55 }} onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
              </div>

              {/* Comments */}
              <div style={{ marginBottom:16 }}>
                <SL><MessageCircle size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/>Comments</SL>
                {(detail.comments||[]).length>0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
                    {(detail.comments||[]).map(c=>(
                      <div key={c.id} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                        <div className="avatar grad-indigo" style={{ width:28, height:28, fontSize:9, flexShrink:0 }}>{c.authorName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
                        <div style={{ flex:1, background:'var(--card)', borderRadius:10, padding:'8px 11px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>{c.authorName.split(' ')[0]}</span>
                            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-sans)' }}>{new Date(c.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                          </div>
                          <p style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--font-sans)', margin:0, lineHeight:1.5 }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <textarea value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder="Add a comment…" rows={2}
                    style={{ flex:1, padding:'9px 12px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-sans)', outline:'none', resize:'none', lineHeight:1.5 }}
                    onFocus={e=>e.target.style.borderColor='var(--indigo)'} onBlur={e=>e.target.style.borderColor='var(--border)'}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(!commentInput.trim()) return; const c={id:Date.now(),authorId:'me',authorName:myName,text:commentInput.trim(),createdAt:new Date().toISOString()}; updateLead(detail.id,{comments:[...(detail.comments||[]),c]}); setCommentInput('') }}}/>
                  <button onClick={()=>{ if(!commentInput.trim()) return; const c={id:Date.now(),authorId:'me',authorName:myName,text:commentInput.trim(),createdAt:new Date().toISOString()}; updateLead(detail.id,{comments:[...(detail.comments||[]),c]}); setCommentInput('') }} style={{ background:commentInput.trim()?'var(--indigo)':'var(--elevated)', border:'none', borderRadius:10, padding:'10px 12px', cursor:commentInput.trim()?'pointer':'default', color:commentInput.trim()?'#fff':'var(--text-muted)', transition:'all 0.15s', flexShrink:0 }}><Send size={15}/></button>
                </div>
              </div>

              <button onClick={()=>removeLead(detail.id)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'11px 0', cursor:'pointer', color:'#EF4444', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, marginBottom:4 }}><Trash2 size={14}/> Remove Lead</button>
            </div>
          </div>
        </>
      )}

      {/* ── Add sheet ── */}
      {showAdd && (
        <>
          <div onClick={()=>setShowAdd(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40 }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--bg)', borderRadius:'20px 20px 0 0', padding:'16px 20px 40px', zIndex:50, maxHeight:'85%', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', position:'relative', marginBottom:18 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }}/>
              <button onClick={()=>setShowAdd(false)} style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', background:'var(--elevated)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)' }}><X size={15}/></button>
            </div>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>Add Lead</h3>
            <FI label="Name *"   value={form.name}    onChange={setF('name')}    placeholder="Full name"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <FI label="Role"    value={form.role}    onChange={setF('role')}    placeholder="Job title"/>
              <FI label="Company" value={form.company} onChange={setF('company')} placeholder="Company"/>
            </div>
            <FI label="Email"   value={form.email}   onChange={setF('email')}   placeholder="email@co.com"/>
            <FI label="Tags"    value={form.tags}    onChange={setF('tags')}    placeholder="#hot-lead, #fintech"/>
            <FI label="Event"   value={form.event}   onChange={setF('event')}   placeholder="TechConnect 2025"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <FI label="City"    value={form.city}    onChange={setF('city')}    placeholder="City"/>
              <FI label="Country" value={form.country} onChange={setF('country')} placeholder="Country"/>
            </div>
            <FI label="Notes" value={form.notes} onChange={setF('notes')} placeholder="Key notes…" multiline/>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', letterSpacing:0.5, textTransform:'uppercase', marginBottom:7 }}>Stage</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {STAGES.map(s=><button key={s.id} onClick={()=>setF('stage')(s.id)} style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${form.stage===s.id?s.color:'var(--border)'}`, background:form.stage===s.id?s.bg:'transparent', color:form.stage===s.id?s.color:'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{s.label}</button>)}
              </div>
            </div>
            <button onClick={handleAdd} className="btn-primary" style={{ width:'100%' }}>Add Lead</button>
          </div>
        </>
      )}
    </div>
  )
}