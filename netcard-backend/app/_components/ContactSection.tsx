'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ name: '', email: '', subject: 'general', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-section section-alt" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-label">Contact</div>
        <h2 className="section-h2">Get in touch.</h2>
        <p className="section-sub">Questions, feedback, or partnership enquiries — we read every message.</p>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-card">
              <div className="contact-card-icon">💬</div>
              <div className="contact-card-title">General enquiries</div>
              <div className="contact-card-body">
                Questions about features, pricing, or how PPL AI works.<br />
                <a href="mailto:hello@pplai.app" style={{ color: 'var(--indigo)', fontWeight: 600 }}>hello@pplai.app</a>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">🐞</div>
              <div className="contact-card-title">Bug reports</div>
              <div className="contact-card-body">
                Something broken? Tell us exactly what happened and we&apos;ll fix it fast.<br />
                <a href="mailto:bugs@pplai.app" style={{ color: 'var(--indigo)', fontWeight: 600 }}>bugs@pplai.app</a>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">🤝</div>
              <div className="contact-card-title">Partnerships &amp; enterprise</div>
              <div className="contact-card-body">
                Team deals, white-label, or integration enquiries.<br />
                <a href="mailto:partnerships@pplai.app" style={{ color: 'var(--indigo)', fontWeight: 600 }}>partnerships@pplai.app</a>
              </div>
            </div>
          </div>

          <div className="form-card">
            {status === 'success' && (
              <div className="form-success">✓ Message received! We&apos;ll get back to you within 24 hours.</div>
            )}
            {status === 'error' && (
              <div className="form-error">Something went wrong. Please try again or email us directly.</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your name</label>
                  <input
                    className="form-input"
                    placeholder="Paras Gupta"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                >
                  <option value="general">General enquiry</option>
                  <option value="bug">Bug report</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  required
                  minLength={10}
                />
              </div>
              <button className="form-submit" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
