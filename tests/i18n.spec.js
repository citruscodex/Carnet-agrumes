// @ts-check
import { test, expect } from 'playwright/test';

/**
 * i18n.spec.js — Vérification que le système de langues est opérationnel
 * LANGS est injecté par le plugin Vite dans <head> depuis public/src/i18n/*.json
 */

test.describe('i18n', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // LANGS est synchrone dans <head> — dispo dès le chargement de la page
    await page.waitForFunction(() => typeof window.LANGS !== 'undefined', { timeout: 15_000 });
  });

  test('LANGS est chargé avec les 5 langues', async ({ page }) => {
    const langs = await page.evaluate(() => Object.keys(window.LANGS));
    expect(langs).toContain('fr');
    expect(langs).toContain('en');
    expect(langs).toContain('it');
    expect(langs).toContain('es');
    expect(langs).toContain('pt');
  });

  test('LANGS.fr contient des clés de traduction', async ({ page }) => {
    const frKeys = await page.evaluate(() => Object.keys(window.LANGS.fr));
    expect(frKeys.length).toBeGreaterThan(10);
  });

  test('Pas de double-wrap (LANGS.fr.fr n\'existe pas)', async ({ page }) => {
    const hasFrFr = await page.evaluate(() => typeof window.LANGS?.fr?.fr !== 'undefined');
    expect(hasFrFr).toBe(false);
  });

  test('LANGS.en et LANGS.fr ont un nombre similaire de clés', async ({ page }) => {
    const counts = await page.evaluate(() => ({
      fr: Object.keys(window.LANGS.fr).length,
      en: Object.keys(window.LANGS.en).length,
    }));
    // Tolérance de 5% + 5 entre les deux langues
    expect(Math.abs(counts.fr - counts.en)).toBeLessThan(counts.fr * 0.05 + 5);
  });

  test('LANGS est de type objet (pas une string)', async ({ page }) => {
    const type = await page.evaluate(() => typeof window.LANGS);
    expect(type).toBe('object');
  });
});
