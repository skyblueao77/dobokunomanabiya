import { expect, test } from '@playwright/test';

const CORE_ROUTES = [
  '/',
  '/subject/structural',
  '/subject/hydraulics',
  '/subject/soil',
  '/subject/math-programming',
  '/unit/geomechanics-continuum',
  '/unit/mohr-circle',
  '/unit/rankine-earth-pressure',
  '/unit/beam-sfd-bmd',
  '/unit/cantilever-beam',
  '/unit/open-channel-flow',
  '/unit/specific-energy-jump',
  '/unit/lp-optimization',
  '/unit/nlp-optimization',
  '/reference',
  '/legal',
];

test.describe('Core routes & interactive simulators E2E', () => {
  test('all 16 routes render cleanly with zero console, page, or CSP errors', async ({ page }) => {
    const errors: string[] = [];
    await page.addInitScript(() => {
      window.addEventListener('securitypolicyviolation', (e) => {
        console.error(`[csp] ${e.effectiveDirective} blocked ${e.blockedURI}`);
      });
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      errors.push(`[pageerror] ${err.message}`);
    });

    for (const route of CORE_ROUTES) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('h1#main-content')).toBeVisible();
    }
    // Verify reload also runs cleanly with zero CSP/runtime errors
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('h1#main-content')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('PortalHome keyboard tab navigation, search filter, and dual progress display work', async ({
    page,
  }) => {
    await page.goto('/');
    const allTab = page.getByRole('tab', { name: /すべて/ });
    await allTab.focus();
    await page.keyboard.press('ArrowRight');
    const structuralTab = page.getByRole('tab', { name: /構造力学/ });
    await expect(structuralTab).toBeFocused();
    // Selection by activation: ArrowRight moves focus without switching selection until Enter
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(structuralTab).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/\/subject\/structural$/);

    // Search filters visible cards
    await page.getByRole('tab', { name: /すべて/ }).click();
    const search = page.getByLabel('単元・キーワード検索');
    await search.fill('ランキン');
    await expect(page.getByText('表示中の単元：1 件')).toBeVisible();
    await expect(page.getByText(/演習問題達成/)).toBeVisible();
  });

  test('BeamDiagramModule supports free numeric typing, presets, URL sync, and auto-graded exercise', async ({
    page,
  }) => {
    await page.goto('/unit/beam-sfd-bmd');
    await expect(page.locator('h1#main-content')).toContainText('単純梁');

    // Verify SliderInput allows typing multi-digit value without mid-keystroke clamping
    const spanInput = page.getByRole('spinbutton', { name: /スパン長/ });
    await spanInput.click();
    await spanInput.fill('10');
    await spanInput.press('Enter');
    await expect(spanInput).toHaveValue('10');
    await expect(page).toHaveURL(/L=10/);

    // Solve Exercise 1 (M_max = 60 kN·m)
    const q1Input = page.locator('#ans-beam-q1');
    await q1Input.fill('60');
    await q1Input.locator('xpath=ancestor::div[1]//button[contains(., "解答を判定")]').click();
    await expect(page.locator('span.font-medium', { hasText: /正解です！ \(M_max = 60/ })).toBeVisible();
  });

  test('CantileverBeamModule computes deflection and auto-grades exercises', async ({ page }) => {
    await page.goto('/unit/cantilever-beam');
    await expect(page.locator('h1#main-content')).toContainText('片持ち梁');
    await expect(page.getByText('5.46 mm').first()).toBeVisible();

    const q1Input = page.locator('#ans-cantilever-q1');
    await q1Input.fill('80');
    await q1Input.locator('xpath=ancestor::div[1]//button[contains(., "解答を判定")]').click();
    await expect(page.locator('span.font-medium', { hasText: /正解です！ \(\|M_A\| = 20/ })).toBeVisible();
  });

  test('OpenChannelModule SVG stays within viewBox even at extreme maximum dimensions', async ({
    page,
  }) => {
    await page.goto('/unit/open-channel-flow?B=6&h=3&m=2.5&I=0.02&n=0.01');
    await expect(page.locator('h1#main-content')).toContainText('開水路等流');

    const bounds = await page.evaluate(() => {
      const svg = document.querySelector('main svg[role="img"]') as SVGSVGElement | null;
      if (!svg) return null;
      const vb = svg.viewBox.baseVal;
      const poly = svg.querySelector('polyline') as SVGPolylineElement | null;
      if (!poly) return null;
      const bbox = poly.getBBox();
      return {
        vbWidth: vb.width,
        vbHeight: vb.height,
        xMin: bbox.x,
        xMax: bbox.x + bbox.width,
        yMin: bbox.y,
        yMax: bbox.y + bbox.height,
      };
    });

    expect(bounds).not.toBeNull();
    expect(bounds!.xMin).toBeGreaterThanOrEqual(0);
    expect(bounds!.xMax).toBeLessThanOrEqual(bounds!.vbWidth);
    expect(bounds!.yMin).toBeGreaterThanOrEqual(0);
    expect(bounds!.yMax).toBeLessThanOrEqual(bounds!.vbHeight);
  });

  test('SpecificEnergyModule computes Belanger hydraulic jump and auto-grades exercises', async ({
    page,
  }) => {
    await page.goto('/unit/specific-energy-jump');
    await expect(page.locator('h1#main-content')).toContainText('比エネルギー');
    await expect(page.getByText('振動跳水 (Oscillating Jump)')).toBeVisible();

    const q2Input = page.locator('#ans-energy-q2');
    await q2Input.fill('1.24');
    await q2Input.locator('xpath=ancestor::div[1]//button[contains(., "解答を判定")]').click();
    await expect(page.locator('span.font-medium', { hasText: /正解です！ \(h_2 = 0\.20/ })).toBeVisible();
  });

  test('ReferencePage converts civil engineering units accurately', async ({ page }) => {
    await page.goto('/reference');
    await expect(page.locator('h1#main-content')).toContainText('公式チートシート');
    const valInput = page.getByLabel('換算元の数値');
    await valInput.fill('250');
    await expect(page.getByText('0.25', { exact: true })).toBeVisible();
  });

  test('RankineEarthModule switches active/passive modes and auto-grades exercises', async ({
    page,
  }) => {
    await page.goto('/unit/rankine-earth-pressure');
    await page.getByRole('button', { name: /受働土圧/ }).click();
    await expect(page.getByRole('heading', { name: /受働土圧分布図/ })).toBeVisible();
    await expect(page).toHaveURL(/mode=passive/);

    const q1Input = page.locator('#ans-rankine-q1');
    await q1Input.fill('48');
    await q1Input.locator('xpath=ancestor::div[1]//button[contains(., "解答を判定")]').click();
    await expect(page.locator('span.font-medium', { hasText: /正解です！ \(P_a = 48/ })).toBeVisible();
  });

  test('PortalHeader dark mode toggle and native modal <dialog> reset flow work', async ({
    page,
  }) => {
    await page.goto('/unit/mohr-circle');
    // Solve Q1 so progress is non-empty
    const q1Input = page.locator('#ans-mohr-q1');
    await q1Input.fill('190');
    await q1Input.locator('xpath=ancestor::div[1]//button[contains(., "解答を判定")]').click();
    await expect(page.locator('span.font-medium', { hasText: /正解です！/ })).toBeVisible();

    // Open display settings popover
    await page.getByRole('button', { name: '表示設定を開く' }).click();
    await page.getByText('ダークモード').click();
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');

    // Open reset confirmation native <dialog> and cancel first, then confirm
    await page.getByRole('button', { name: '学習進捗をリセット' }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'キャンセル' })).toBeFocused();
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).toBeHidden();

    // Confirm reset
    await page.getByRole('button', { name: '表示設定を開く' }).click();
    await page.getByRole('button', { name: '学習進捗をリセット' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '進捗をリセットする' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('演習達成: 0 / 3')).toBeVisible();
  });
});
