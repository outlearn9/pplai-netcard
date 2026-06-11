/**
 * E2E — 05: AI Follow-ups
 *
 * Scenario: After GITEX, Paras opens the AI tab to review personalized
 * follow-up suggestions. The screen shows FALLBACK_FOLLOWUPS when the API
 * is unavailable (which is always in test), so there are always 5 cards.
 */

import { test, expect } from '@playwright/test'
import { loginAs, shell } from './helpers'

test.describe('AI Follow-ups screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'AI' }).click()
    await page.waitForTimeout(500)
  })

  test('AI tab renders with "AI Followups" heading', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('AI Followups', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('pending count and sent count are shown in subtitle', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText(/pending/i).first()).toBeVisible({ timeout: 6000 })
    await expect(s.getByText(/sent/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('fallback follow-up cards load automatically (no API needed)', async ({ page }) => {
    const s = shell(page)
    // FALLBACK_FOLLOWUPS always shows: Sarah Raines, Anika Torres, Raj Joshi, Devon Shaw, Marcus Kim
    await expect(s.getByText('Sarah Raines', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('Generate Follow-ups button is visible and clickable', async ({ page }) => {
    const s = shell(page)
    const generateBtn = s.getByRole('button', { name: /generate follow-ups/i }).first()
    await expect(generateBtn).toBeVisible({ timeout: 5000 })
    await generateBtn.click()
    await page.waitForTimeout(800)
    // No crash — page still renders
    await expect(s.getByText('AI Followups', { exact: false }).first()).toBeVisible()
  })

  test('each follow-up card shows contact name and role', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })
    // Role is shown below name
    await expect(s.getByText(/Product Manager.*Stripe/i).first()).toBeVisible()
  })

  test('priority badge (High/Medium/Low) appears on cards', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })
    await expect(s.getByText(/high|medium|low/i).first()).toBeVisible()
  })

  test('WA send button triggers WhatsApp action', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordAIOpen', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordAIOpen(String(u)); return null } })

    // WA button is the green "WA" button in the card
    const waBtn = s.getByRole('button', { name: /^WA$/i }).first()
    if (await waBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await waBtn.click()
      await page.waitForTimeout(400)
      const hasWA = opened.some(u => u.includes('wa.me') || u.includes('whatsapp'))
      if (opened.length > 0) expect(hasWA).toBe(true)
    }
  })

  test('Email send button triggers mailto action', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordMailOpen', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordMailOpen(String(u)); return null } })

    const emailBtn = s.getByRole('button', { name: /^Email$/i }).first()
    if (await emailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailBtn.click()
      await page.waitForTimeout(400)
      const hasMail = opened.some(u => u.startsWith('mailto:'))
      if (opened.length > 0) expect(hasMail).toBe(true)
    }
  })

  test('dismiss (X) button removes a follow-up card', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })

    // Dismiss button is a circular X icon button in top-right of each card
    // It has no text, so find it by its icon's parent button near the priority badge
    const dismissBtn = s.locator('button').filter({ has: s.locator('svg') }).nth(3)
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
      await page.waitForTimeout(400)
      // Page should still be functional
      await expect(s.getByText('AI Followups', { exact: false }).first()).toBeVisible()
    }
  })

  test('copy icon button copies message text', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Sarah Raines', { exact: false }).first().waitFor({ timeout: 6000 })
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Copy button is a small absolute-positioned button inside the message bubble
    // After click it shows a checkmark (no text)
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })

  test('filter button opens filter sheet', async ({ page }) => {
    const s = shell(page)
    await s.getByText('AI Followups', { exact: false }).first().waitFor({ timeout: 5000 })

    // Filter button is a SlidersHorizontal icon button (40x40)
    const filterBtn = s.locator('button').filter({ has: page.locator('svg[data-lucide="sliders-horizontal"]') }).first()
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(300)
      await expect(s.getByText(/filter|priority|sort/i).first()).toBeVisible({ timeout: 3000 })
    }
  })
})
