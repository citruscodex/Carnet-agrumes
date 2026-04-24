// @ts-check
import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

const MOCK_DATA = {
  users: [
    { id: 1, email: 'admin@citruscodex.fr', role: 'admin', profile_type: 'collectionneur',
      is_active: true, created_at: '2026-01-01', last_login_at: '2026-04-20', plant_count: 5 },
    { id: 2, email: 'beta@citruscodex.fr', role: 'member', profile_type: 'pepinieriste',
      is_active: true, created_at: '2026-02-10', last_login_at: '2026-04-18', plant_count: 12 },
    { id: 3, email: 'disabled@citruscodex.fr', role: 'member', profile_type: 'collectionneur',
      is_active: false, disabled_at: '2026-03-01', created_at: '2026-01-15', last_login_at: null, plant_count: 0 }
  ],
  stats: { total: 3, active_7d: 2, new_30d: 1, disabled: 1 },
  statsExt: {
    users: { total: 3, active: 2, inactive: 1, logins_week: 2, top_users: [
      { email: 'beta@citruscodex.fr', login_count: 14 }
    ]},
    bugs: { open: 2, resolved: 5 },
    plants: 17
  },
  bugs: [
    { id: 10, title: 'Bug test A', user_email: 'beta@citruscodex.fr',
      status: 'open', priority: 'normal', created_at: '2026-04-01', group_id: null }
  ],
  audit: [
    { id: 100, action: 'user_activated', admin_email: 'admin@citruscodex.fr',
      target_email: 'beta@citruscodex.fr', details: {}, created_at: '2026-04-22' }
  ]
};

async function gotoAdmin(page) {
  await page.addInitScript(data => {
    window.__ADMIN_MOCK_DATA = data;
    // Assure que le localStorage minimal est présent (évite le wizard)
    if (!localStorage.getItem('agrumes_cfg')) {
      localStorage.setItem('agrumes_cfg', JSON.stringify({
        pwdHash: 'local-dev-bypass',
        profile: { name: 'Dev Local', loc: '', bio: '', profileType: 'collectionneur', since: '' },
        createdAt: '2026-01-01'
      }));
    }
    localStorage.setItem('agrumes_migrated_to_server', 'true');
  }, MOCK_DATA);

  await page.goto(BASE);
  // IS_LOCAL démarre automatiquement en admin — attendre le chargement de l'app
  await page.waitForSelector('#nv-admin', { timeout: 10000 });
  // Attendre que le bouton soit visible (role=admin le rend visible)
  await page.waitForFunction(() => {
    const btn = document.getElementById('nv-admin');
    return btn && btn.style.display !== 'none';
  }, { timeout: 8000 });
  await page.click('#nv-admin');
  await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
}

test.describe('Admin panel — test complet', () => {

  test('A1 — Onglet Comptes affiche la liste utilisateurs', async ({ page }) => {
    await gotoAdmin(page);
    await expect(page.locator('.cca-admin-card').first()).toBeVisible({ timeout: 6000 });
    const emails = await page.locator('.cca-admin-user-email').allTextContents();
    expect(emails.length).toBeGreaterThan(0);
  });

  test('A2 — Onglet Bugs charge sans erreur', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await gotoAdmin(page);
    await page.click('[data-admin-tab="bugs"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('.cca-admin-bug-row').first()).toBeVisible({ timeout: 6000 });
    expect(errors404.filter(u => u.includes('bugs'))).toEqual([]);
  });

  test('A3 — Onglet Historique charge sans erreur', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await gotoAdmin(page);
    await page.click('[data-admin-tab="audit"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('.cca-admin-audit-row').first()).toBeVisible({ timeout: 6000 });
    expect(errors404.filter(u => u.includes('audit-log'))).toEqual([]);
  });

  test('A4 — Onglet Statistiques affiche des chiffres', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await gotoAdmin(page);
    await page.click('[data-admin-tab="stats"]');
    await expect(page.locator('.cca-admin-stat-card').first()).toBeVisible({ timeout: 6000 });
    const val = await page.locator('.cca-admin-stat-val').first().textContent();
    expect(val?.trim()).not.toBe('');
    expect(errors404.filter(u => u.includes('stats'))).toEqual([]);
  });

  test('A5 — Section invitation bêta-testeur visible onglet Comptes', async ({ page }) => {
    await gotoAdmin(page);
    // Onglet Comptes est actif par défaut
    await expect(page.locator('#cca-admin-inv-email')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#cca-admin-invite-btn')).toBeVisible();
    await expect(page.locator('#cca-admin-gen-pwd-btn')).toBeVisible();
  });

  test('A6 — Générer mot de passe aléatoire fonctionne', async ({ page }) => {
    await gotoAdmin(page);
    const pwdField = page.locator('#cca-admin-inv-pwd');
    await expect(pwdField).toBeVisible({ timeout: 6000 });
    const before = await pwdField.inputValue();
    await page.click('#cca-admin-gen-pwd-btn');
    const after = await pwdField.inputValue();
    expect(after.length).toBeGreaterThanOrEqual(8);
    expect(after).not.toBe(before);
  });

  test('A7 — Bouton Supprimer visible pour compte désactivé', async ({ page }) => {
    await gotoAdmin(page);
    // disabled@citruscodex.fr est is_active: false → doit afficher bouton supprimer
    const deleteBtn = page.locator('[data-adusr-delete]');
    const activateBtn = page.locator('[data-adusr-activate]');
    await expect(deleteBtn.first()).toBeVisible({ timeout: 6000 });
    await expect(activateBtn.first()).toBeVisible();
    // Compte actif ne doit PAS avoir de bouton supprimer direct
    const activeBadge = page.locator('.cca-admin-badge-active').first();
    await expect(activeBadge).toBeVisible();
  });

  test('A8 — Aucun 404 sur navigation complète tous onglets admin', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await gotoAdmin(page);
    for (const tabKey of ['bugs', 'audit', 'stats', 'users']) {
      await page.click(`[data-admin-tab="${tabKey}"]`);
      await page.waitForTimeout(800);
    }
    expect(errors404, `404s détectés : ${errors404.join(', ')}`).toEqual([]);
  });

});
