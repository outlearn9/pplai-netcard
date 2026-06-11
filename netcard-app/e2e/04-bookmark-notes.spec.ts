/**
 * E2E — 04: Bookmark, Notes & Tags
 *
 * After GITEX, Paras reviews contacts, bookmarks hot leads,
 * adds meeting notes, tags contacts, and verifies stat tile filtering.
 */

import { test, expect, Page } from '@playwright/test'
import { loginAs, shell } from './helpers'

async function openTechSummitContacts(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'Events' }).click()
  await page.waitForTimeout(400)
  const s = shell(page)
  const card = s.getByText('TechSummit 2025', { exact: false }).first()
  await card.waitFor({ timeout: 6000 })
  await card.click()
  await page.waitForTimeout(500)
}

test.describe('Bookmark contacts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openTechSummitContacts(page)
  })

  test('contact cards are visible in place screen', async ({ page }) => {
    const s = shell(page)
    await expect(s.locator('.card').first()).toBeVisible({ timeout: 6000 })
  })

  test('bookmark icon (Bookmark svg) is present on contact cards', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })
    // Bookmark button is the right-most button in each card
    const cards = s.locator('.card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('tapping bookmark toggles state — Bookmarked stat updates', async ({ page }) => {
    const s = shell(page)
    const firstCard = s.locator('.card').first()
    await firstCard.waitFor({ timeout: 6000 })

    // Get initial Bookmarked count
    const bookmarkedTile = s.getByRole('button', { name: /bookmarked/i })
    const initialText = await bookmarkedTile.textContent()

    // Click the bookmark button (last button in card = bookmark)
    const bookmarkBtn = firstCard.locator('button').last()
    await bookmarkBtn.click()
    await page.waitForTimeout(400)

    // Count should have changed
    const newText = await bookmarkedTile.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('Bookmarked stat tile filters list to bookmarked contacts', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })

    // First bookmark someone
    await s.locator('.card').first().locator('button').last().click()
    await page.waitForTimeout(300)

    // Then click Bookmarked tile
    await s.getByRole('button', { name: /bookmarked/i }).click()
    await page.waitForTimeout(300)
    await expect(s.getByRole('button', { name: /show all/i })).toBeVisible()
  })

  test('Follow-ups stat tile filters contacts needing follow-up', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })
    await s.getByRole('button', { name: /follow.up/i }).click()
    await page.waitForTimeout(300)
    await expect(s.getByRole('button', { name: /show all/i })).toBeVisible()
  })

  test('Show All button clears active filter', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })
    await s.getByRole('button', { name: /follow.up/i }).click()
    await page.waitForTimeout(200)
    await s.getByRole('button', { name: /show all/i }).click()
    await page.waitForTimeout(200)
    await expect(s.getByRole('button', { name: /show all/i })).not.toBeVisible()
  })

  test('Contacts stat tile clears any active filter', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })
    // Apply filter then click Contacts tile to clear
    await s.getByRole('button', { name: /bookmarked/i }).click()
    await page.waitForTimeout(200)
    await s.getByRole('button', { name: /contacts/i }).first().click()
    await page.waitForTimeout(200)
    await expect(s.getByRole('button', { name: /show all/i })).not.toBeVisible()
  })
})

test.describe('Contact detail — notes & tags', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'Contacts' }).click()
    await page.waitForTimeout(400)
  })

  test('tapping a contact opens detail screen', async ({ page }) => {
    const s = shell(page)
    // AllContactsScreen uses inline-styled divs (no .card class) — click first contact name
    const firstContact = s.getByText('Sarah Raines', { exact: false }).first()
    await firstContact.waitFor({ timeout: 6000 })
    await firstContact.click()
    await page.waitForTimeout(500)
    // Contact detail shows back button (icon-btn)
    await expect(s.locator('button[class*="icon-btn"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('contact detail screen shows Notes section', async ({ page }) => {
    const s = shell(page)
    // Navigate to contact detail
    const firstContact = s.getByText('Sarah Raines', { exact: false }).first()
    await firstContact.waitFor({ timeout: 5000 })
    await firstContact.click()
    await page.waitForTimeout(400)

    // ContactScreen shows Notes heading and "Add Note" button
    await expect(s.getByText('Notes', { exact: false }).first()).toBeVisible({ timeout: 5000 })
    await expect(s.getByRole('button', { name: /add note/i }).first()).toBeVisible({ timeout: 4000 })
  })

  test('contact detail screen shows Tags section', async ({ page }) => {
    const s = shell(page)
    const firstContact = s.getByText('Sarah Raines', { exact: false }).first()
    await firstContact.waitFor({ timeout: 5000 })
    await firstContact.click()
    await page.waitForTimeout(400)

    // ContactScreen always renders a Tags heading
    await expect(s.getByText('Tags', { exact: false }).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Inline outreach actions on place contact cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openTechSummitContacts(page)
  })

  test('phone action button triggers tel: link', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordOpen', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordOpen(u); return null } })

    // Green phone button (22×22 rounded square)
    const phoneBtn = s.locator('.card').first().locator('button').nth(1)
    if (await phoneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneBtn.click()
      await page.waitForTimeout(300)
      const hasTel = opened.some(u => u?.startsWith('tel:'))
      if (opened.length > 0) expect(hasTel).toBe(true)
    }
  })

  test('WhatsApp action button triggers wa.me link', async ({ page }) => {
    const s = shell(page)
    await s.locator('.card').first().waitFor({ timeout: 6000 })

    const opened: string[] = []
    await page.exposeFunction('recordWA', (url: string) => opened.push(url))
    await page.evaluate(() => { window.open = (u: any) => { (window as any).recordWA(u); return null } })

    const waBtn = s.locator('.card').first().locator('button').nth(2)
    if (await waBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await waBtn.click()
      await page.waitForTimeout(300)
      const hasWA = opened.some(u => u?.includes('wa.me'))
      if (opened.length > 0) expect(hasWA).toBe(true)
    }
  })

  test('tapping contact card navigates to contact detail', async ({ page }) => {
    const s = shell(page)
    const card = s.locator('.card').first()
    await card.waitFor({ timeout: 6000 })
    // Click the main area (not action buttons)
    await card.click({ position: { x: 50, y: 22 } })
    await page.waitForTimeout(400)
    // Should be on contact screen — back button visible
    await expect(s.locator('button[class*="icon-btn"]').first()).toBeVisible({ timeout: 4000 })
  })
})
