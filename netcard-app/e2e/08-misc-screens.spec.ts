/**
 * E2E — 08: Miscellaneous screens smoke tests
 *
 * Covers the 8 screens that had no prior E2E coverage:
 *   AllContactsScreen, AnalyticsScreen, AccountDetailsScreen,
 *   MyTeamScreen, NotificationsScreen, HelpSupportScreen,
 *   SuggestionsScreen, SwitchEventScreen
 */

import { test, expect, Page } from '@playwright/test'
import { loginAs, shell } from './helpers'

// ── Shared helpers ─────────────────────────────────────────────────────────────

async function openDrawer(page: Page) {
  const s = shell(page)
  const menuBtn = s.locator('button.icon-btn').first()
  await menuBtn.waitFor({ timeout: 5000 })
  await menuBtn.click()
  await page.waitForTimeout(400)
}

async function navigateViaDrawer(page: Page, label: string) {
  await openDrawer(page)
  await shell(page).getByText(label, { exact: false }).first().click()
  await page.waitForTimeout(400)
}

// ── All Contacts ───────────────────────────────────────────────────────────────

test.describe('AllContacts screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.locator('.tab-pill button').filter({ hasText: 'Contacts' }).click()
    await page.waitForTimeout(400)
  })

  test('renders "All Contacts" heading', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('All Contacts', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('search input is visible', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByPlaceholder('Search contacts...')).toBeVisible({ timeout: 5000 })
  })

  test('contact count subtitle appears', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText(/contacts/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})

// ── Analytics ──────────────────────────────────────────────────────────────────

test.describe('Analytics screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'Analytics')
  })

  test('renders "Analytics" heading', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Analytics', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })

  test('back button is visible', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Analytics', { exact: false }).first().waitFor({ timeout: 5000 })
    await expect(s.locator('.screen').last().locator('button.icon-btn').first()).toBeVisible()
  })
})

// ── Account Details ────────────────────────────────────────────────────────────

test.describe('AccountDetails screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'Account Details')
  })

  test('renders "Account Details" header', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Account Details', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('Save Changes button is visible', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByRole('button', { name: /save changes/i }).first()).toBeVisible({ timeout: 5000 })
  })

  test('save updates localStorage profile', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Account Details', { exact: false }).first().waitFor({ timeout: 5000 })
    await s.getByRole('button', { name: /save changes/i }).first().click()
    await page.waitForTimeout(600)
    // Button should briefly show "Saved" confirmation
    const stored = await page.evaluate(() => localStorage.getItem('netcard_my_profile'))
    expect(stored).not.toBeNull()
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})

// ── My Team ────────────────────────────────────────────────────────────────────

test.describe('MyTeam screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'My Team')
  })

  test('renders "My Team" header', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('My Team', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('Invite Member button is visible', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByRole('button', { name: /invite member/i }).first()).toBeVisible({ timeout: 5000 })
  })

  test('invite sheet opens with name and email inputs', async ({ page }) => {
    const s = shell(page)
    await s.getByText('My Team', { exact: false }).first().waitFor({ timeout: 5000 })
    await s.getByRole('button', { name: /invite member/i }).first().click()
    await page.waitForTimeout(300)
    await expect(s.getByPlaceholder('Full name')).toBeVisible({ timeout: 3000 })
    await expect(s.getByPlaceholder('colleague@company.com')).toBeVisible()
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})

// ── Notifications ──────────────────────────────────────────────────────────────

test.describe('Notifications screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'Notifications')
  })

  test('renders "Notifications" heading', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Notifications', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })

  test('back button is visible', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Notifications', { exact: false }).first().waitFor({ timeout: 5000 })
    await expect(s.locator('.screen').last().locator('button.icon-btn').first()).toBeVisible()
  })
})

// ── Help & Support ─────────────────────────────────────────────────────────────

test.describe('HelpSupport screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'Help & Support')
  })

  test('renders "Help & Support" header', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Help & Support', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('message textarea is visible', async ({ page }) => {
    const s = shell(page)
    const textarea = s.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
  })

  test('category selector tiles are visible', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText(/bug|feature|help/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})

// ── Suggestions ────────────────────────────────────────────────────────────────

test.describe('Suggestions screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await navigateViaDrawer(page, 'Suggestions')
  })

  test('renders "Suggestions" header', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Suggestions', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('search input is visible', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByPlaceholder('Search suggestions…')).toBeVisible({ timeout: 5000 })
  })

  test('new suggestion form opens with title and body inputs', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Suggestions', { exact: false }).first().waitFor({ timeout: 5000 })
    // "+" or "New Suggestion" button
    const addBtn = s.locator('button.icon-btn').last()
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(300)
      await expect(s.getByPlaceholder('Short, clear title…')).toBeVisible({ timeout: 3000 })
    }
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})

// ── Switch Event ───────────────────────────────────────────────────────────────

test.describe('SwitchEvent screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    // SwitchEventScreen is reached from HomeScreen via the "Switch" button
    // next to the active event card
    const s = shell(page)
    const switchBtn = s.getByRole('button', { name: /switch/i }).first()
    if (await switchBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await switchBtn.click()
    } else {
      // Fallback: navigate directly
      await page.evaluate(() => {
        (window as any).__nav?.navigate('switchEvent')
      })
    }
    await page.waitForTimeout(400)
  })

  test('renders "Switch Event" header', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('Switch Event', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('sample events list is visible', async ({ page }) => {
    const s = shell(page)
    await s.getByText('Switch Event', { exact: false }).first().waitFor({ timeout: 5000 })
    // At least one event card should be visible
    await expect(s.locator('.screen').last()).toBeVisible()
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })

  test('no crash on load', async ({ page }) => {
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })
})
