import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const A11Y_ROUTES = [
  '/',
  '/unit/beam-sfd-bmd',
  '/unit/cantilever-beam',
  '/unit/open-channel-flow',
  '/unit/specific-energy-jump',
  '/unit/rankine-earth-pressure',
  '/unit/mohr-circle',
  '/unit/geomechanics-continuum',
  '/unit/lp-optimization',
  '/unit/nlp-optimization',
  '/reference',
  '/legal',
];

test.describe('WCAG 2.2 AA automated accessibility audit (axe-core)', () => {
  for (const route of A11Y_ROUTES) {
    test(`${route} has zero WCAG 2.2 AA violations (light mode)`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('h1#main-content')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test('/ has zero WCAG 2.2 AA violations in dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('color-scheme', 'dark');
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
