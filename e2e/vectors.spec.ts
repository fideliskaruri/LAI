import { test, expect } from '@playwright/test'

test.describe('Vectors topic — smoke', () => {
  test('hub redirects to /vectors', async ({ page }) => {
    await page.goto('/')
    // Vectors glyph should be on the page and clickable
    await expect(page.getByRole('link', { name: /Vectors — open chapter/ })).toBeVisible()
  })

  test('/vectors renders the topic shell', async ({ page }) => {
    await page.goto('/vectors')
    // Title in the header
    await expect(page.getByText('Vectors', { exact: false }).first()).toBeVisible()
    // Some act prose visible on first paint (cold open)
    await expect(page.getByText(/A quarrel in the pages of/)).toBeVisible()
  })

  test('deep-link /vectors#stevin lands at the Stevin act', async ({ page }) => {
    await page.goto('/vectors#stevin')
    // Wait for hydration + scroll to settle
    await page.waitForTimeout(500)
    // Stevin prose should be in view
    await expect(page.getByText(/wreath of spheres/i).first()).toBeVisible()
  })

  test('ScalarMul slider is keyboard-focusable and responds to arrow keys', async ({ page }) => {
    await page.goto('/vectors#scalar')
    await page.waitForTimeout(800)

    // Focus the slider via Tab — find the role=slider handle
    const slider = page.getByRole('slider').first()
    await slider.focus()

    // Arrow keys should change aria-valuenow
    const before = await slider.getAttribute('aria-valuenow')
    await slider.press('ArrowRight')
    await page.waitForTimeout(50)
    const after = await slider.getAttribute('aria-valuenow')
    expect(after).not.toBe(before)
  })

  test('URL hash updates as user scrolls through acts', async ({ page }) => {
    await page.goto('/vectors')
    await page.waitForTimeout(500)
    // Scroll to the bottom — should land near the closing act
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(800)
    const url = page.url()
    // Should have a hash now
    expect(url).toContain('#')
  })
})
