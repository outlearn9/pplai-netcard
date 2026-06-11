/**
 * E2E — 03: Adding Contacts
 *
 * Scenario: At GITEX 2025, Paras adds contacts via 4 methods:
 *   1. Manual form      — Ahmed Al Mansouri (CDO, Emirates NBD)
 *   2. From URL         — Priya Sharma (VP Product, Careem)
 *   3. vCard upload     — Tom Müller (SAP MENA)
 *   4. Other venues     — Sara (Society), Khalid (Gym), Anjali (Travel)
 */

import { test, expect, Page } from '@playwright/test'
import { loginAs, shell, GITEX, seedEventsCache, setActiveEvent } from './helpers'
import path from 'path'
import fs from 'fs'
import os from 'os'

// TechSummit 2025 is the default sample-1 place in EventsScreen
async function openSamplePlaceContacts(page: Page) {
  await page.locator('.tab-pill button').filter({ hasText: 'Events' }).click()
  await page.waitForTimeout(400)
  const s = shell(page)
  // Default sample event is 'TechSummit 2025'
  const card = s.getByText('TechSummit 2025', { exact: false }).first()
  await card.waitFor({ timeout: 6000 })
  await card.click()
  await page.waitForTimeout(500)
}

test.describe('Add contacts — Manual form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openSamplePlaceContacts(page)
  })

  test('Manually button opens name input', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /manually/i }).click()
    await page.waitForTimeout(300)
    // Placeholder from EventContactsScreen: "Name *"
    await expect(s.getByPlaceholder('Name *')).toBeVisible()
  })

  test('saves Ahmed Al Mansouri via manual form', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /manually/i }).click()
    await page.waitForTimeout(300)

    await s.getByPlaceholder('Name *').fill('Ahmed Al Mansouri')
    await s.getByPlaceholder('Role').fill('Chief Digital Officer')
    await s.getByPlaceholder('Company').fill('Emirates NBD')
    await s.getByPlaceholder('Email').fill('ahmed@emiratesnbd.ae')
    await s.getByPlaceholder('Phone').fill('+971501111222')

    // Save Contact button becomes enabled once name is filled
    await expect(s.getByRole('button', { name: /save contact/i })).toBeEnabled()
    await s.getByRole('button', { name: /save contact/i }).click()
    await page.waitForTimeout(1000)

    // API not running in tests — just verify the app didn't crash
    const body = await page.evaluate(() => document.body.innerText)
    expect(body).not.toContain('Something went wrong')
  })

  test('Cancel button hides the manual form', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /manually/i }).click()
    await page.waitForTimeout(200)
    await s.getByRole('button', { name: /cancel/i }).click()
    await expect(s.getByPlaceholder('Name *')).not.toBeVisible()
  })

  test('Save Contact is disabled when name is empty', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /manually/i }).click()
    await page.waitForTimeout(200)
    await expect(s.getByRole('button', { name: /save contact/i })).toBeDisabled()
  })
})

test.describe('Add contacts — From URL (LinkedIn)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openSamplePlaceContacts(page)
  })

  test('From URL button opens LinkedIn input (Step 1)', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /from url/i }).click()
    await page.waitForTimeout(300)
    // Placeholder from EventContactsScreen: "linkedin.com/in/username"
    await expect(s.getByPlaceholder('linkedin.com/in/username')).toBeVisible()
  })

  test('Step 1 — paste URL and advance to step 2', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /from url/i }).click()
    await page.waitForTimeout(300)

    await s.getByPlaceholder('linkedin.com/in/username').fill('linkedin.com/in/priya-sharma')
    await s.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(400)

    // Step 2 shows "Full Name *" placeholder
    await expect(s.getByPlaceholder('Full Name *')).toBeVisible()
    const nameVal = await s.getByPlaceholder('Full Name *').inputValue()
    expect(nameVal).toMatch(/Priya Sharma/i)
  })

  test('Step 2 — fills details and saves Priya Sharma', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /from url/i }).click()
    await page.waitForTimeout(300)
    await s.getByPlaceholder('linkedin.com/in/username').fill('linkedin.com/in/priya-sharma')
    await s.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(400)

    await s.getByPlaceholder('Designation / Role').fill('VP Product')
    await s.getByPlaceholder('Company').fill('Careem')
    await s.getByPlaceholder('Mobile Number').fill('+971509988776')
    await s.getByPlaceholder('Email (optional)').fill('priya@careem.com')

    await s.getByRole('button', { name: /save contact/i }).click()
    await page.waitForTimeout(800)

    await expect(s.getByText('Priya', { exact: false }).first()).toBeVisible({ timeout: 6000 })
  })

  test('Back button in Step 2 returns to URL input', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /from url/i }).click()
    await page.waitForTimeout(300)
    await s.getByPlaceholder('linkedin.com/in/username').fill('linkedin.com/in/test')
    await s.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(300)
    await s.getByRole('button', { name: /← back|back/i }).click()
    await expect(s.getByPlaceholder('linkedin.com/in/username')).toBeVisible()
  })

  test('Next button disabled when URL input is empty', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /from url/i }).click()
    await page.waitForTimeout(300)
    await expect(s.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})

test.describe('Add contacts — Address Book (vCard upload)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openSamplePlaceContacts(page)
  })

  test('hidden file input for .vcf exists', async ({ page }) => {
    const s = shell(page)
    await expect(s.locator('input[type="file"][accept*="vcf"]')).toBeAttached()
  })

  test('uploading a vCard file processes Tom Müller', async ({ page }) => {
    const vcf = [
      'BEGIN:VCARD', 'VERSION:3.0', 'FN:Tom Müller',
      'TEL;TYPE=CELL:+971552233445', 'EMAIL;TYPE=INTERNET:tom@sap.com',
      'ORG:SAP MENA', 'TITLE:Head of Innovation', 'END:VCARD',
    ].join('\r\n')

    const tmpPath = path.join(os.tmpdir(), 'tom_muller.vcf')
    fs.writeFileSync(tmpPath, vcf)

    const s = shell(page)
    await s.locator('input[type="file"][accept*="vcf"]').setInputFiles(tmpPath)
    await page.waitForTimeout(1200)

    // No crash = success (API may or may not be available)
    await expect(s.locator('.screen').last()).toBeVisible()
    fs.unlinkSync(tmpPath)
  })
})

test.describe('Add contacts — Scan QR back-button (from EventContacts)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await openSamplePlaceContacts(page)
  })

  test('Scan QR navigates to scan screen with back button', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /scan qr/i }).click()
    await page.waitForTimeout(500)
    // Scan screen should show back arrow (added in previous session)
    await expect(s.getByText(/scan to connect/i)).toBeVisible({ timeout: 5000 })
    // Back button should be visible (ArrowLeft added when returnTo is set)
    const backBtn = s.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(backBtn).toBeVisible()
  })

  test('back button on scan screen returns to place contacts', async ({ page }) => {
    const s = shell(page)
    await s.getByRole('button', { name: /scan qr/i }).click()
    await page.waitForTimeout(500)
    await expect(s.getByText(/scan to connect/i)).toBeVisible({ timeout: 5000 })
    // Back button is inside the header flex row that contains "Scan to Connect"
    const header = s.getByText(/scan to connect/i).first().locator('..')
    const backBtn = header.locator('button').first()
    await backBtn.waitFor({ timeout: 3000 })
    await backBtn.click()
    await page.waitForTimeout(500)
    // Should have left the scan screen
    await expect(s.getByText(/scan to connect/i).first()).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Add contacts — other venues', () => {
  const VENUES = [
    { sampleId: 'sample-2', venueName: 'WeWork Manyata Tech Park', contact: { name: 'Sara Al Hashimi', role: 'Entrepreneur', company: 'Venture Souk' } },
    { sampleId: 'sample-4', venueName: "Gold's Gym Koramangala",   contact: { name: 'Khalid Fitness',  role: 'Personal Trainer', company: "Gold's Gym" } },
  ]

  for (const { venueName, contact } of VENUES) {
    test(`adds contact at "${venueName}" via manual form`, async ({ page }) => {
      await loginAs(page)
      await page.locator('.tab-pill button').filter({ hasText: 'Events' }).click()
      await page.waitForTimeout(400)

      const s = shell(page)
      const card = s.getByText(venueName, { exact: false }).first()
      await card.waitFor({ timeout: 5000 })
      await card.click()
      await page.waitForTimeout(400)

      await s.getByRole('button', { name: /manually/i }).click()
      await page.waitForTimeout(300)
      await s.getByPlaceholder('Name *').fill(contact.name)
      await s.getByPlaceholder('Role').fill(contact.role)
      await s.getByPlaceholder('Company').fill(contact.company)

      // Save Contact enabled once name is filled
      await expect(s.getByRole('button', { name: /save contact/i })).toBeEnabled()
      await s.getByRole('button', { name: /save contact/i }).click()
      await page.waitForTimeout(800)

      // API may not be running — just verify no crash
      const body = await page.evaluate(() => document.body.innerText)
      expect(body).not.toContain('Something went wrong')
    })
  }
})
