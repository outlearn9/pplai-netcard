import { Page } from '@playwright/test'

// ── Personas ──────────────────────────────────────────────────────────────────

export const PARAS = {
  name:     'Paras Gupta',
  title:    'Founder & CEO',
  company:  'PPL AI',
  email:    'paras@pplai.co',
  phone:    '+971501234567',
  linkedin: 'linkedin.com/in/parasgupta',
  seeking:  'Distribution partners & enterprise clients in MENA',
  offering: 'AI-powered digital business card & CRM automation',
}

// Sample events matching EventsScreen.jsx SAMPLE_EVENTS exactly
export const GITEX = {
  id: 'sample-1', name: 'TechSummit 2025', venue_type: 'event',
  status: 'active', is_active: true,
  location: 'NIMHANS Convention Centre, Bangalore',
  start_date: '2026-04-25', end_date: '2026-04-27',
}

// ── Auth + profile bootstrap ──────────────────────────────────────────────────

export async function loginAs(page: Page, persona = PARAS) {
  await page.goto('/')

  await page.evaluate(({ persona }) => {
    localStorage.setItem('netcard_authed', '1')
    localStorage.setItem('netcard_my_profile', JSON.stringify({
      name:     persona.name,
      title:    persona.title,
      company:  persona.company,
      email:    persona.email,
      phone:    persona.phone,
      linkedin: persona.linkedin,
      seeking:  persona.seeking,
      offering: persona.offering,
    }))
    localStorage.setItem('netcard_seed_attempted', '1')
    localStorage.setItem('netcard_onboarding_complete', '1')
  }, { persona })

  await page.reload()
  await page.waitForSelector('.phone-shell', { timeout: 10000 })
}

// Cache key is `netcard_cache_` + route key (e.g. 'api/events')
export async function seedEventsCache(page: Page, events: object[]) {
  await page.evaluate((evts) => {
    localStorage.setItem('netcard_cache_api/events', JSON.stringify(evts))
  }, events)
}

export async function setActiveEvent(page: Page, event: object) {
  await page.evaluate((evt) => {
    localStorage.setItem('netcard_active_event', JSON.stringify(evt))
  }, event)
}

// ── Navigation helpers ────────────────────────────────────────────────────────

export async function goToPlaces(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'Events' }).click()
  await page.waitForTimeout(400)
}

export async function goToContacts(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'Contacts' }).click()
  await page.waitForTimeout(400)
}

export async function goToMyCard(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'My Card' }).click()
  await page.waitForTimeout(400)
}

export async function goToAI(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'AI' }).click()
  await page.waitForTimeout(400)
}

// ── Phone shell inner locator ─────────────────────────────────────────────────

export function shell(page: Page) {
  return page.locator('.phone-shell')
}
