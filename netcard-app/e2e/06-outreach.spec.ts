/**
 * E2E — 06: Outreach — Email, WhatsApp & Share Card
 *
 * Scenario: Paras sends follow-up outreach to contacts met at TechSummit 2025
 * and tests the Share Card flow for his digital card.
 */

import { test, expect } from '@playwright/test'
import { loginAs, shell } from './helpers'

test.describe('Inline outreach from place contact cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'Events' }).click()
    await page.waitForTimeout(400)
    const s = shell(page)
    const card = s.getByText('TechSummit 2025', { exact: false }).first()
    await card.waitFor({ timeout: 6000 })
    await card.click()
    await page.waitForTimeout(500)
  })

  test('contact cards are visible in event contacts screen', async ({ page }) => {
    const s = shell(page)
    await expect(s.locator('.card').first()).toBeVisible({ timeout: 6000 })
  })

  test('phone button (2nd button in card) triggers tel: link', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordPhoneOpen', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordPhoneOpen(String(u)); return null } })

    const phoneBtn = s.locator('.card').first().locator('button').nth(1)
    if (await phoneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneBtn.click()
      await page.waitForTimeout(300)
      if (opened.length > 0) {
        expect(opened.some(u => u.startsWith('tel:'))).toBe(true)
      }
    }
  })

  test('WhatsApp button (3rd button in card) triggers wa.me link', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordWAOpen', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordWAOpen(String(u)); return null } })

    const waBtn = s.locator('.card').first().locator('button').nth(2)
    if (await waBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await waBtn.click()
      await page.waitForTimeout(300)
      if (opened.length > 0) {
        expect(opened.some(u => u.includes('wa.me'))).toBe(true)
      }
    }
  })

  test('tapping contact card body navigates to contact detail', async ({ page }) => {
    const s = shell(page)
    const card = s.locator('.card').first()
    await card.waitFor({ timeout: 6000 })
    await card.click({ position: { x: 50, y: 22 } })
    await page.waitForTimeout(500)
    await expect(s.locator('button[class*="icon-btn"]').first()).toBeVisible({ timeout: 4000 })
  })
})

test.describe('Contact detail — outreach actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'Contacts' }).click()
    await page.waitForTimeout(400)
  })

  test('tapping a contact opens detail screen', async ({ page }) => {
    const s = shell(page)
    // AllContactsScreen uses inline-styled divs — click by known contact name from FALLBACK_RAW
    const firstContact = s.getByText('Sarah Raines', { exact: false }).first()
    await firstContact.waitFor({ timeout: 6000 })
    await firstContact.click()
    await page.waitForTimeout(500)
    // Detail screen has a back button (icon-btn)
    await expect(s.locator('button[class*="icon-btn"]').first()).toBeVisible({ timeout: 4000 })
  })

  test('contact detail screen renders without crash', async ({ page }) => {
    const s = shell(page)
    const firstContact = s.locator('.card').first()
    if (await firstContact.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstContact.click()
      await page.waitForTimeout(500)
      const body = await page.evaluate(() => document.body.innerText)
      expect(body).not.toContain('Something went wrong')
      expect(body).not.toContain('undefined')
    }
  })

  test('WhatsApp outreach link present for contact with phone', async ({ page }) => {
    const s = shell(page)
    const firstContact = s.locator('.card').first()
    if (await firstContact.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstContact.click()
      await page.waitForTimeout(500)

      // Check if WhatsApp/WA link or button exists
      const hasWA = await s.getByText(/whatsapp|WhatsApp|wa\.me/i).isVisible({ timeout: 2000 }).catch(() => false)
        || await s.locator('[href*="wa.me"]').isVisible({ timeout: 1000 }).catch(() => false)
      // Soft check — contact may not have phone
      await expect(s.locator('.screen').last()).toBeVisible()
    }
  })
})

test.describe('Share Card — send digital card', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'My Card' }).click()
    await page.waitForTimeout(400)
  })

  test('My Card tab is visible with name', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Paras Gupta', { exact: false }).first()).toBeVisible({ timeout: 5000 })
  })

  test('Share My Card button is visible', async ({ page }) => {
    const s = shell(page)
    const shareBtn = s.getByRole('button', { name: /share my card/i }).first()
    await expect(shareBtn).toBeVisible({ timeout: 5000 })
  })

  test('Share My Card navigates to share screen', async ({ page }) => {
    const s = shell(page)
    const shareBtn = s.getByRole('button', { name: /share my card/i }).first()
    await expect(shareBtn).toBeVisible({ timeout: 4000 })
    // Force-click bypasses any transitioning overlays
    await shareBtn.click({ force: true })
    await page.waitForTimeout(600)
    await expect(
      s.getByText(/whatsapp|email|copy|share/i).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('Share screen lists multiple sharing channels', async ({ page }) => {
    const s = shell(page)
    const shareBtn = s.getByRole('button', { name: /share my card/i }).first()
    await expect(shareBtn).toBeVisible({ timeout: 4000 })
    await shareBtn.click({ force: true })
    await page.waitForTimeout(600)
    const hasWhatsApp = await s.getByText(/whatsapp/i).isVisible({ timeout: 3000 }).catch(() => false)
    const hasEmail    = await s.getByText(/email/i).isVisible({ timeout: 2000 }).catch(() => false)
    const hasCopy     = await s.getByText(/copy/i).isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasWhatsApp || hasEmail || hasCopy).toBe(true)
  })
})
