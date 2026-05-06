'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'success' | 'error'

const OPEN_ROLES = [
  'Software Engineer',
  'AI / ML Engineer',
  'Product Designer',
  'Growth & Marketing',
  'Other',
]

export default function JobsSection() {
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setStatus('sending')
    try {
      const body = new FormData()
      body.append('role', role)
      if (message) body.append('message', message)
      if (resume) body.append('resume', resume)
      const res = await fetch('/api/jobs', { method: 'POST', body })
      if (!res.ok) throw new Error()
      setStatus('success')
      setRole('')
      setMessage('')
      setResume(null)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="jobs" className="py-section">
      <div className="container">
        <div className="section-label">Jobs</div>
        <h2 className="section-h2">Join the team.</h2>
        <p className="section-sub">We&apos;re a small, fast-moving team building the future of professional networking. If that excites you, we want to hear from you.</p>

        <div className="jobs-grid">
          <div className="jobs-info">
            <div className="jobs-roles-title">Open roles</div>
            <div>
              {OPEN_ROLES.map(r => (
                <span key={r} className="jobs-role-tag">
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>•</span> {r}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>Why PPL AI?</div>
              {[
                ['🚀', 'Early team equity — ground floor opportunity'],
                ['🌍', 'Remote-first, async-friendly culture'],
                ['🤖', 'Cutting-edge AI stack (Claude, OpenRouter)'],
                ['📈', 'Real traction, real users, real problems'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13.5, color: 'var(--t2)', alignItems: 'flex-start' }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-card">
            {status === 'success' && (
              <div className="form-success">✓ Application received! We&apos;ll be in touch if there&apos;s a fit.</div>
            )}
            {status === 'error' && (
              <div className="form-error">Something went wrong. Please try again or email us at <strong>jobs@pplai.app</strong>.</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Role you&apos;re applying for</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="">Select a role…</option>
                  {OPEN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Message{' '}
                  <span style={{ fontSize: 12, color: 'var(--t4)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Tell us why you're excited about PPL AI, what you've built, or anything else you'd like us to know..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ minHeight: 110 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Resume / CV</label>
                <label
                  className="form-file"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 22 }}>📎</span>
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                    {resume ? resume.name : 'Click to upload your resume'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--t4)' }}>PDF, DOC or DOCX — max 5 MB</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => setResume(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <button className="form-submit" type="submit" disabled={status === 'sending' || !role}>
                {status === 'sending' ? 'Submitting…' : 'Submit application →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
