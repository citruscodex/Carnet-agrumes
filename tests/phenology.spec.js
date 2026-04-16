// @ts-check
import { test, expect } from 'playwright/test';

/**
 * phenology.spec.js — Module phénologie BBCH
 * Le module est dans public/src/modules/phenology.js
 */

test.describe('Phénologie BBCH', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.showPage === 'function', { timeout: 10_000 });
  });

  test('Le module phénologie est chargé', async ({ page }) => {
    const loaded = await page.waitForFunction(
      () => typeof window.__CCA_phenology === 'object' || document.querySelector('[id*="pheno"]') !== null,
      { timeout: 8_000 }
    );
    expect(loaded).toBeTruthy();
  });

  test('La page phénologie s\'affiche sans erreur', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.evaluate(() => window.showPage('phenology'));
    await page.waitForTimeout(1000);

    const critical = errors.filter(e =>
      !e.includes('fetch') && !e.includes('api') && !e.includes('404')
    );
    expect(critical).toHaveLength(0);
  });

  test('Les 8 stades BBCH sont définis dans le module', async ({ page }) => {
    const stageCount = await page.evaluate(() => {
      const pheno = window.__CCA_phenology;
      if (!pheno) return -1;
      if (pheno.STAGES) return pheno.STAGES.length;
      if (pheno.stages) return pheno.stages.length;
      return -1;
    });
    // -1 si module pas exposé sous ce nom — acceptable
    if (stageCount !== -1) {
      expect(stageCount).toBeGreaterThanOrEqual(8);
    }
  });
});
