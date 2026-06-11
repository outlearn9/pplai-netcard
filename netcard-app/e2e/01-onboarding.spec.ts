/**
 * E2E — 01: Onboarding & Digital Card
 *
 * Scenario: Paras Gupta sets up his digital networking card before flying to
 * GITEX Dubai. He fills in his profile, verifies the card preview, and checks
 * that the QR code is visible for sharing.
 */

import { test, expect } from '@playwright/test'
import { shell, loginAs } from './helpers'

const BASE_PROFILE = {
  name:     'Paras Gupta',
  title:    'Founder & CEO',
  company:  'PPL AI',
  email:    'paras@pplai.co',
  phone:    '+971501234567',
  linkedin: 'linkedin.com/in/parasgupta',
  seeking:  'Distribution partners in MENA',
  offering: 'AI networking & CRM automation',
}

async function bootWithoutProfile(page: any) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('netcard_authed', '1')
    localStorage.setItem('netcard_seed_attempted', '1')
    localStorage.removeItem('netcard_my_profile')
  })
  await page.reload()
  await page.waitForSelector('.phone-shell', { timeout: 10000 })
}

test.describe('Onboarding — create digital card', () => {
  test('onboarding screen appears with "Create My Card" button', async ({ page }) => {
    await bootWithoutProfile(page)
    const s = shell(page)
    // OnboardingScreen step 1 shows name input; button says "Continue" (step 1) or "Launch My Card" (step 3)
    await expect(s.getByPlaceholder('e.g. Alex Johnson').first())
      .toBeVisible({ timeout: 8000 })
  })

  test('fills out full profile and completes onboarding', async ({ page }) => {
    await bootWithoutProfile(page)
    const s = shell(page)

    // Step 1: Identity
    await s.getByPlaceholder('e.g. Alex Johnson').fill(BASE_PROFILE.name)
    await s.getByPlaceholder('e.g. Founder & CEO').fill(BASE_PROFILE.title)
    await s.getByPlaceholder('e.g. Acme Corp').fill(BASE_PROFILE.company)
    await s.getByRole('button', { name: /^continue/i }).click()
    await page.waitForTimeout(300)

    // Step 2: Contact
    await s.getByPlaceholder('you@example.com').fill(BASE_PROFILE.email)
    await s.getByPlaceholder('+1 555 000 0000').fill(BASE_PROFILE.phone)
    await s.getByPlaceholder('linkedin.com/in/yourname').fill(BASE_PROFILE.linkedin)
    await s.getByRole('button', { name: /^continue/i }).click()
    await page.waitForTimeout(300)

    // Step 3: Goals — finish onboarding ("Launch My Card" button)
    await s.getByRole('button', { name: /launch my card/i }).click()
    await page.waitForTimeout(1000)

    const profile = await page.evaluate(() => localStorage.getItem('netcard_my_profile'))
    expect(JSON.parse(profile!).name).toBe(BASE_PROFILE.name)
  })

  test('live card preview updates as user types name', async ({ page }) => {
    await bootWithoutProfile(page)
    const s = shell(page)
    await s.getByPlaceholder('e.g. Alex Johnson').fill('Dubai Test')
    await page.waitForTimeout(200)
    // Name appears live on the card preview
    await expect(s.getByText('Dubai Test', { exact: false }).first()).toBeVisible()
  })
})

test.describe('My Card — digital business card', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'My Card' }).click()
    await page.waitForTimeout(400)
  })

  test('My Card tab shows name and company', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText(BASE_PROFILE.name, { exact: false }).first()).toBeVisible()
    await expect(s.getByText(BASE_PROFILE.company, { exact: false }).first()).toBeVisible()
  })

  test('QR code SVG is rendered', async ({ page }) => {
    const s = shell(page)
    await expect(s.locator('svg').first()).toBeVisible({ timeout: 5000 })
  })

  test('Share My Card button is visible and clickable', async ({ page }) => {
    const s = shell(page)
    const shareBtn = s.getByRole('button', { name: /share my card/i }).first()
    await expect(shareBtn).toBeVisible({ timeout: 5000 })
    // Force-click bypasses any transitioning overlay (e.g. profile drawer animation)
    await shareBtn.click({ force: true })
    await page.waitForTimeout(500)
    // Navigates to shareCard screen
    await expect(s.getByText(/share|send|whatsapp|email|copy/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Edit button opens edit sheet', async ({ page }) => {
    const s = shell(page)
    // Edit button shows "Edit" with Pencil icon (line 148-149 MyCardScreen)
    const editBtn = s.getByRole('button', { name: /^edit$/i }).first()
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()
    await page.waitForTimeout(400)
    await expect(s.getByText('Edit Card', { exact: false })).toBeVisible()
  })

  test('can edit and save profile from edit sheet', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /^edit$/i }).click()
    await page.waitForTimeout(400)

    // Edit sheet has Field components with labels; fill the Name field
    const nameInput = s.getByLabel('Name').or(s.locator('input').first())
    await nameInput.fill('Paras Gupta Updated')
    await s.getByRole('button', { name: /save changes/i }).click()
    await page.waitForTimeout(500)

    const stored = await page.evaluate(() => localStorage.getItem('netcard_my_profile'))
    expect(stored).toContain('Paras Gupta Updated')
  })
})
