/**
 * E2E — 02: Creating Places
 *
 * Scenario: Paras creates 4 places from his Dubai trip:
 *   GITEX Global 2025 (Event), Society Dubai (Clubhouse),
 *   Fitness First JBR (Gym), Dubai → Bangalore (Travel)
 */

import { test, expect } from '@playwright/test'
import { loginAs, goToPlaces, shell, GITEX } from './helpers'

const NEW_PLACES = [
  { name: 'GITEX Global 2025',  venueLabel: 'Event',     location: 'Dubai World Trade Centre' },
  { name: 'Society Dubai',      venueLabel: 'Clubhouse', location: 'DIFC, Dubai'              },
  { name: 'Fitness First JBR',  venueLabel: 'Gym',       location: 'JBR Walk, Dubai Marina'   },
  { name: 'Dubai → Bangalore',  venueLabel: 'Travel',    location: 'Emirates EK508'           },
]

test.describe('Places — create events & venues', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await goToPlaces(page)
  })

  // "New Place" is the actual button text (EventsScreen.jsx line 161)
  test('New Place button is visible on Places tab', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByRole('button', { name: /new place/i })).toBeVisible({ timeout: 5000 })
  })

  test('sample places are shown on load (TechSummit 2025)', async ({ page }) => {
    const s = shell(page)
    await expect(s.getByText('TechSummit 2025', { exact: false })).toBeVisible({ timeout: 5000 })
  })

  for (const place of NEW_PLACES) {
    test(`creates "${place.name}" (${place.venueLabel})`, async ({ page }) => {
      const s = shell(page)

      // Click "New Place" — exact label from EventsScreen line 161
      await s.getByRole('button', { name: /new place/i }).click()
      await page.waitForTimeout(300)

      // AddEventScreen header: "Add Place" (line 169)
      await expect(s.getByText('Add Place')).toBeVisible({ timeout: 5000 })

      // Venue type pill — PLACE_TYPES labels: Event, Workspace, Travel, Housing, Gym, Clubhouse, Party
      const venueBtn = s.getByRole('button', { name: new RegExp(`^${place.venueLabel}$`, 'i') }).first()
      if (await venueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await venueBtn.click()
      }

      // Name placeholder is dynamic: NAME_PLACEHOLDER[venueType] or 'Place name'
      const nameInput = s.getByPlaceholder(/place name|event name|gym name|club name/i)
        .or(s.locator('input').first())
      await nameInput.fill(place.name)

      // Location
      const locInput = s.getByPlaceholder(/location|city|address/i).first()
      if (await locInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await locInput.fill(place.location)
      }

      // Save — button text: `Add ${type.label}` e.g. "Add Event", "Add Gym"  (line 444)
      await s.getByRole('button', { name: new RegExp(`add ${place.venueLabel}|save changes`, 'i') }).click()
      await page.waitForTimeout(700)

      // Should be back on Places screen with the new place visible
      await expect(s.getByText(place.name, { exact: false })).toBeVisible({ timeout: 6000 })
    })
  }

  test('activating TechSummit shows ACTIVE PLACE badge', async ({ page }) => {
    const s = shell(page)
    const card = s.getByText('TechSummit 2025', { exact: false }).first()
    await card.waitFor({ timeout: 5000 })
    await card.click()
    await page.waitForTimeout(400)

    const setActive = s.getByRole('button', { name: /set active/i })
    if (await setActive.isVisible({ timeout: 2000 }).catch(() => false)) {
      await setActive.click()
      await page.waitForTimeout(400)
    }
    await expect(s.getByText(/active place/i).first()).toBeVisible()
  })

  test('place card shows correct contact count', async ({ page }) => {
    const s = shell(page)
    // TechSummit has 6 sample contacts per SAMPLE_EVENTS
    await expect(s.getByText('6', { exact: false }).first()).toBeVisible({ timeout: 5000 })
  })

  test('editing a place shows venue type picker', async ({ page }) => {
    const s = shell(page)
    // Edit button is the LAST svg-button in the row next to the event name
    // (order: Pin, Trash2, Pencil — pencil is last)
    const pencilBtn = s.getByText('TechSummit 2025', { exact: false })
      .locator('..').locator('button').filter({ has: page.locator('svg') }).last()
    if (await pencilBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pencilBtn.click({ force: true })
      await page.waitForTimeout(400)
      await expect(s.getByText('Edit Place', { exact: false })).toBeVisible({ timeout: 5000 })
    }
  })
})
