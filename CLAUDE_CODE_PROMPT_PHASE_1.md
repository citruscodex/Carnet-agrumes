# CLAUDE CODE — PHASE 1 — Admin panel, comptes test, BBCH notifications

## Contexte

Lire `CLAUDE.md` et `SESSION_STATE.md` avant toute action.

Cette phase outille l'administrateur pour gérer la bêta privée : un vrai panel admin avec historique des actions, gestion fine des comptes, bug tracker avancé, et notification BBCH uniquement au changement de stade.

**Prérequis** : Phase 0A/0B/0C + hotfix bêta (10 correctifs) validés et déployés.

## RÈGLE STRANGLER PATTERN — OBLIGATOIRE

- Tout nouveau code JS → module ES dans `public/src/modules/`
- Toute fonction existante dans `index.html` qui doit être modifiée → l'extraire d'abord dans un module puis la modifier dans le module
- Zéro ajout de code inline dans `index.html`
- Les seules modifications autorisées dans `index.html` sont :
  (a) suppression de code extrait vers un module
  (b) ajout d'un `import()` dynamique vers le nouveau module
  (c) colle thin minimale (max 5 lignes)

## Zones protégées — NE PAS TOUCHER

PDF engine, AES-GCM sync (contenu inchangé), `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes

- `addEventListener` exclusivement — zéro `onclick` inline nouveau
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues (FR/EN/IT/ES/PT) pour toute nouvelle chaîne UI
- `node --check` après chaque fichier JS modifié
- `npm run build` après chaque chantier
- Multi-ligne SQL → écrire dans un fichier, appliquer via `psql -f` — jamais coller directement
- Chaque chantier est un commit séparé

---

## CHANTIER 1 — Migration SQL admin

### Fichier à créer

`server/migrations/008_admin_panel.sql`

### Tables

```sql
BEGIN;

-- ─── admin_audit_log (historique de toutes les actions admin) ──────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_date ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);

-- Actions tracées : user_created, user_activated, user_deactivated, 
-- user_deleted, user_role_changed, user_profile_changed,
-- password_reset_sent, password_reset_temp (stocke le mdp temp chiffré),
-- bug_status_changed, bug_merged, bug_deleted, 
-- whitelist_added, whitelist_removed

-- ─── bug_report_groups (regroupement bugs similaires) ─────────────
CREATE TABLE IF NOT EXISTS bug_report_groups (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed','wontfix')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_bug_groups_updated_at BEFORE UPDATE ON bug_report_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Ajouter group_id aux bug_reports existants ───────────────────
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES bug_report_groups(id) ON DELETE SET NULL;
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'normal';
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_bug_reports_group ON bug_reports(group_id) WHERE group_id IS NOT NULL;

-- ─── Ajouter colonnes manquantes à users si absentes ──────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

COMMIT;
```

### Application

```bash
scp server/migrations/008_admin_panel.sql root@62.210.237.49:/tmp/
ssh root@62.210.237.49 "sudo -u postgres psql -d ccadb -f /tmp/008_admin_panel.sql"
```

### Validation

```bash
ssh root@62.210.237.49 "sudo -u postgres psql -d ccadb -c '\dt admin_*'"
ssh root@62.210.237.49 "sudo -u postgres psql -d ccadb -c '\dt bug_report_*'"
ssh root@62.210.237.49 "sudo -u postgres psql -d ccadb -c '\d users'" 
# Vérifier colonnes is_active, deactivated_at, last_login_at, login_count
```

---

## CHANTIER 2 — Routes admin backend

### Fichier à créer

`server/routes/admin-panel.js`

### Guard middleware

```javascript
const requireAdmin = {
  preHandler: [fastify.authenticate, async (req, reply) => {
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  }]
}
```

### Endpoints gestion des comptes

```
GET    /api/admin/users              — Liste tous les users (email, role, profile_type, is_active, last_login_at, login_count, created_at)
GET    /api/admin/users/:id          — Détail user + nombre plants/events + derniers bugs signalés
PUT    /api/admin/users/:id/role     — Changer role (admin/moderator/user) — log dans admin_audit_log
PUT    /api/admin/users/:id/profile  — Changer profile_type (collectionneur/pepinieriste/arboriculteur/conservatoire) — log
PUT    /api/admin/users/:id/activate — Réactiver un compte désactivé — log
PUT    /api/admin/users/:id/deactivate — Désactiver un compte (avec raison) — log
DELETE /api/admin/users/:id          — Suppression définitive (cascade FK) — log + confirmation body { confirm: 'DELETE_USER_<email>' }
POST   /api/admin/users/:id/reset-password — Générer mot de passe temporaire, le stocker chiffré dans audit_log, retourner au client
```

### Endpoints bug tracker avancé

```
GET    /api/admin/bugs                — Liste bugs avec filtres (?status=&priority=&group_id=&assigned_to=)
PUT    /api/admin/bugs/:id            — Modifier statut, priorité, assignation — log
POST   /api/admin/bugs/groups         — Créer un groupe de bugs
PUT    /api/admin/bugs/groups/:id     — Modifier groupe (titre, description, statut)
POST   /api/admin/bugs/:id/merge/:groupId — Rattacher un bug à un groupe — log
GET    /api/admin/bugs/groups         — Liste des groupes avec count de bugs rattachés
DELETE /api/admin/bugs/:id            — Supprimer un bug — log
```

### Endpoint audit log

```
GET    /api/admin/audit-log           — Liste paginée des actions admin (?page=&limit=&action=&target_user_id=)
GET    /api/admin/audit-log/user/:id  — Historique des actions sur un user spécifique
```

### Logique audit systématique

Chaque endpoint admin doit loguer dans `admin_audit_log` AVANT de retourner la réponse :

```javascript
async function logAdminAction(pool, adminId, targetUserId, action, details = {}) {
  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, target_user_id, action, details) VALUES ($1, $2, $3, $4)`,
    [adminId, targetUserId, action, JSON.stringify(details)]
  )
}
```

### Reset password avec trace

```javascript
fastify.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, reply) => {
  const targetUser = await pool.query(`SELECT id, email FROM users WHERE id=$1`, [req.params.id])
  if (!targetUser.rowCount) return reply.code(404).send({ error: 'User not found' })
  
  // Générer mot de passe temporaire (12 chars, alphanumériques)
  const crypto = require('crypto')
  const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12)
  
  // Hasher et stocker
  const bcrypt = require('bcrypt')
  const hash = await bcrypt.hash(tempPassword, 12)
  await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, req.params.id])
  
  // Logger dans audit (mot de passe en clair stocké dans details, visible uniquement dans l'audit log admin)
  await logAdminAction(pool, req.user.id, req.params.id, 'password_reset_temp', {
    email: targetUser.rows[0].email,
    temp_password: tempPassword,
    generated_at: new Date().toISOString()
  })
  
  return { 
    ok: true, 
    temp_password: tempPassword,
    message: 'Ce mot de passe temporaire est consultable dans l\'historique des actions admin.'
  }
})
```

### Enregistrement dans `server/app.js`

```javascript
const adminPanelRoutes = require('./routes/admin-panel')
app.register(adminPanelRoutes)
```

### Validation

```bash
node --check server/routes/admin-panel.js
# Test routes après deploy
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://citruscodex.fr/api/admin/users
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://citruscodex.fr/api/admin/audit-log
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://citruscodex.fr/api/admin/bugs/groups
```

---

## CHANTIER 3 — Module frontend admin panel

### Fichier à créer

`public/src/modules/admin-panel.js`

### Architecture

Ce module remplace le code admin inline existant dans `index.html`. Avant d'écrire le module :
1. Localiser tout le code admin existant dans `index.html` (chercher `renderAdmin`, `_adminTab`, `admin-panel`, `/api/admin/`)
2. Inventorier les fonctions à extraire
3. Les supprimer de `index.html` et les recréer dans le module

### Fonctionnalités du panel admin

**Onglet 1 — Gestion des comptes**

```
┌──────────────────────────────────────────────────────────────┐
│ Gestion des comptes                              [+ Inviter] │
├──────────────────────────────────────────────────────────────┤
│ 🔍 Rechercher par email...                                   │
├──────────────────────────────────────────────────────────────┤
│ Email          │ Profil      │ Rôle  │ Statut │ Dernier │ ⚙ │
│ alice@test.fr  │ collection. │ user  │ ✅     │ 2h      │ ⋮ │
│ bob@test.fr    │ pépiniér.   │ user  │ ❌     │ 7j      │ ⋮ │
└──────────────────────────────────────────────────────────────┘
```

Menu contextuel (⋮) par user :
- Modifier le rôle (admin / moderator / user)
- Modifier le profil (collectionneur / pépiniériste / arboriculteur / conservatoire)
- Réinitialiser le mot de passe → affiche le mdp temporaire + le stocke dans l'audit
- Activer / Désactiver le compte (avec champ raison si désactivation)
- Supprimer le compte (confirmation dialog)
- Voir l'historique des actions sur ce compte

**Onglet 2 — Bug tracker**

```
┌──────────────────────────────────────────────────────────────┐
│ Bugs signalés                    Filtres: [Status ▾] [Prio ▾]│
├──────────────────────────────────────────────────────────────┤
│ ⬜ #42 │ Login impossible  │ alice │ 🔴 critical │ open     │
│ ⬜ #41 │ Erreur sync       │ bob   │ 🟡 normal   │ open     │
│ ⬜ #38 │ Page blanche      │ carol │ 🟡 normal   │ resolved │
├──────────────────────────────────────────────────────────────┤
│ [Grouper sélection] [Changer statut ▾] [Assigner ▾]         │
└──────────────────────────────────────────────────────────────┘
```

Actions sur les bugs :
- Cliquer un bug → détail complet (description, browser, URL, date, screenshots si implémenté)
- Sélection multiple (checkboxes) → grouper en un bug group
- Changer statut en batch (open → in_progress → resolved → closed / wontfix)
- Assigner un bug à un admin/moderator
- Filtrer par statut, priorité, groupe, assigné, date

**Onglet 2b — Groupes de bugs**

Liste des groupes avec :
- Titre, description, statut du groupe, nombre de bugs rattachés
- Clic → liste des bugs du groupe
- Bouton "Dissocier" pour retirer un bug d'un groupe

**Onglet 3 — Historique des actions**

```
┌──────────────────────────────────────────────────────────────┐
│ Historique admin                  Filtres: [Action ▾] [User ▾]│
├──────────────────────────────────────────────────────────────┤
│ 23/04 10:15 │ admin │ password_reset_temp │ alice@test.fr    │
│ 23/04 09:30 │ admin │ user_deactivated    │ bob@test.fr      │
│ 22/04 18:00 │ admin │ bug_merged           │ Bug #41 → G#3   │
└──────────────────────────────────────────────────────────────┘
```

Chaque ligne est expandable → affiche le `details` JSONB complet (dont le mot de passe temporaire si action `password_reset_temp`).

Filtres :
- Par type d'action
- Par user cible
- Par date (cette semaine / ce mois / tout)

**Onglet 4 — Statistiques bêta**

Tableau de bord rapide :
- Nombre total d'utilisateurs (actifs / inactifs)
- Nombre de connexions cette semaine
- Nombre de bugs ouverts / résolus
- Nombre de plantes créées au total
- Top 5 utilisateurs les plus actifs (par login_count)

### CSS

Styles propres, préfixés `.cca-admin-*` pour éviter collisions. Utiliser les CSS custom properties existantes du projet.

### i18n 5 langues

```javascript
admin: {
  title: 'Administration',
  users: {
    title: 'Gestion des comptes',
    search: 'Rechercher par email...',
    invite: 'Inviter un testeur',
    role: 'Rôle',
    profile: 'Profil',
    status: 'Statut',
    lastLogin: 'Dernière connexion',
    active: 'Actif',
    inactive: 'Désactivé',
    activate: 'Réactiver',
    deactivate: 'Désactiver',
    deactivateReason: 'Raison de la désactivation',
    delete: 'Supprimer le compte',
    deleteConfirm: 'Cette action est irréversible. Tapez DELETE pour confirmer.',
    resetPassword: 'Réinitialiser le mot de passe',
    tempPassword: 'Mot de passe temporaire',
    tempPasswordCopied: 'Mot de passe copié — consultable dans l\'historique admin',
    changeRole: 'Modifier le rôle',
    changeProfile: 'Modifier le profil',
    history: 'Historique de ce compte'
  },
  bugs: {
    title: 'Bugs signalés',
    groups: 'Groupes de bugs',
    groupCreate: 'Créer un groupe',
    groupMerge: 'Grouper la sélection',
    filter: 'Filtrer',
    assign: 'Assigner',
    priority: 'Priorité',
    status: 'Statut',
    ungroup: 'Dissocier du groupe'
  },
  audit: {
    title: 'Historique des actions',
    action: 'Action',
    target: 'Cible',
    date: 'Date',
    details: 'Détails',
    filterAction: 'Par action',
    filterUser: 'Par utilisateur',
    filterDate: 'Par période',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    all: 'Tout'
  },
  stats: {
    title: 'Statistiques bêta',
    totalUsers: 'Utilisateurs total',
    activeUsers: 'Actifs',
    inactiveUsers: 'Inactifs',
    loginsThisWeek: 'Connexions cette semaine',
    bugsOpen: 'Bugs ouverts',
    bugsResolved: 'Bugs résolus',
    plantsCreated: 'Plantes créées',
    topUsers: 'Top 5 utilisateurs actifs'
  }
}
```

Traduire en EN/IT/ES/PT.

---

## CHANTIER 4 — Comptes test multi-profils

### Créer 4 comptes test en DB

```sql
-- Mot de passe : TestBeta2026! (hash bcrypt à générer)
-- Utiliser la route d'inscription existante ou insertion directe

INSERT INTO users (email, password_hash, role, profile_type, is_active, email_verified) VALUES
  ('collectionneur@citruscodex.fr', '<bcrypt_hash>', 'user', 'collectionneur', true, true),
  ('pepinieriste@citruscodex.fr', '<bcrypt_hash>', 'user', 'pepinieriste', true, true),
  ('arboriculteur@citruscodex.fr', '<bcrypt_hash>', 'user', 'arboriculteur', true, true),
  ('conservatoire@citruscodex.fr', '<bcrypt_hash>', 'user', 'conservatoire', true, true);
```

Générer les hash bcrypt côté serveur :

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('TestBeta2026!',12).then(h=>console.log(h))"
```

### Seeder des données de test

Pour chaque profil, ajouter 3-5 plantes avec des événements variés pour que les testeurs aient du contenu à explorer :

- Collectionneur : 5 agrumes variés (Citrus limon, Citrus sinensis, Citrus reticulata, Fortunella margarita, Citrus medica)
- Pépiniériste : 3 plants + 2 boutures + 1 devis brouillon
- Arboriculteur : 3 plants + 2 parcelles + événements fertilisation/récolte
- Conservatoire : 4 plants rares avec provenance structurée + notes détaillées

### Logger dans l'audit

```javascript
await logAdminAction(pool, adminUserId, newUserId, 'user_created', {
  email: 'collectionneur@citruscodex.fr',
  profile_type: 'collectionneur',
  purpose: 'test_account_beta'
})
```

---

## CHANTIER 5 — Notification BBCH changement de stade uniquement

### Diagnostic

1. Localiser le cron job BBCH (dans `server/` — probablement `server/crons/bbch.js` ou similaire, déclenché à 7h30)
2. Comprendre la logique actuelle : envoie-t-il une notification quotidienne à tous les users, ou seulement quand un stade change ?

### Correction attendue

Le cron BBCH doit :
1. Pour chaque user avec `notif_bbch = true` dans `user_settings` :
2. Calculer le stade BBCH actuel pour chaque plante (basé sur GJC accumulés)
3. Comparer avec le dernier stade notifié (stocker `last_notified_bbch_stage` dans `user_settings.profile_json` ou une table dédiée)
4. Si le stade a changé → envoyer une notification push
5. Si le stade est identique → ne rien envoyer

### Table de suivi (optionnel, si pas déjà dans profile_json)

```sql
CREATE TABLE IF NOT EXISTS user_bbch_tracking (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  last_stage VARCHAR(10),
  last_notified_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, plant_id)
);
```

### Logique du cron corrigé

```javascript
async function checkBBCHChanges() {
  const users = await pool.query(
    `SELECT u.id, us.profile_json FROM users u 
     JOIN user_settings us ON us.user_id = u.id 
     WHERE us.notif_bbch = true AND u.is_active = true`
  )
  
  for (const user of users.rows) {
    const plants = await pool.query(
      `SELECT id, scientific_name FROM user_plants WHERE user_id=$1 AND deleted_at IS NULL`,
      [user.id]
    )
    
    for (const plant of plants.rows) {
      const currentStage = calculateBBCHStage(plant, /* weather data */)
      const tracking = await pool.query(
        `SELECT last_stage FROM user_bbch_tracking WHERE user_id=$1 AND plant_id=$2`,
        [user.id, plant.id]
      )
      
      const lastStage = tracking.rows[0]?.last_stage
      
      if (currentStage !== lastStage) {
        // Envoyer notification push
        await sendPushNotification(user.id, {
          title: `${plant.scientific_name} — Nouveau stade BBCH`,
          body: `Passage au stade ${currentStage} (était ${lastStage || 'non suivi'})`,
          url: `/plant/${plant.id}/phenology`
        })
        
        // Mettre à jour le tracking
        await pool.query(
          `INSERT INTO user_bbch_tracking (user_id, plant_id, last_stage, last_notified_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, plant_id) DO UPDATE SET last_stage=$3, last_notified_at=NOW()`,
          [user.id, plant.id, currentStage]
        )
      }
    }
  }
}
```

### Strangler pattern

Si le code du cron BBCH est inline dans un fichier monolithique :
- Extraire vers `server/crons/bbch-notifications.js`
- Importer dans le fichier cron principal

---

## CHANTIER 6 — Remplacement admin inline → module

### Action d'extraction

Après avoir créé `public/src/modules/admin-panel.js`, retourner dans `index.html` et :

1. Localiser TOUT le code admin existant (fonctions `renderAdmin*`, `_admin*`, handlers admin)
2. Le supprimer de `index.html`
3. Le remplacer par un import dynamique :

```javascript
// Dans index.html, à l'endroit où renderAdmin est appelé
const { initAdminPanel } = await import('./src/modules/admin-panel.js')
initAdminPanel(document.getElementById('admin-container'))
```

4. Exposer sur window si nécessaire pour le routeur existant :

```javascript
window.showAdminPanel = async () => {
  const { initAdminPanel } = await import('./src/modules/admin-panel.js')
  initAdminPanel(document.getElementById('main-content'))
}
```

### Validation

Mesurer la réduction de `index.html` :
```bash
wc -l public/index.html
# Doit avoir diminué par rapport au dernier commit
```

---

## TESTS

### Tests Playwright

`tests/phase1-admin.spec.js`

```javascript
test.describe('Phase 1 — Admin panel', () => {
  
  test('T1 admin voit la liste des utilisateurs', async ({ page }) => {
    await _loginAsAdmin(page)
    await page.click('text=Admin')
    await expect(page.locator('text=Gestion des comptes')).toBeVisible()
    const rows = await page.locator('tr, .cca-admin-user-row').count()
    expect(rows).toBeGreaterThan(1)
  })
  
  test('T2 admin peut désactiver et réactiver un compte', async ({ page }) => {
    await _loginAsAdmin(page)
    await page.click('text=Admin')
    // Cliquer menu contextuel d'un user test
    await page.click('[data-user-email="collectionneur@citruscodex.fr"] .cca-admin-actions')
    await page.click('text=Désactiver')
    await page.fill('[name="deactivate_reason"]', 'Test automatisé')
    await page.click('text=Confirmer')
    await expect(page.locator('text=Désactivé')).toBeVisible()
    
    // Réactiver
    await page.click('[data-user-email="collectionneur@citruscodex.fr"] .cca-admin-actions')
    await page.click('text=Réactiver')
    await expect(page.locator('[data-user-email="collectionneur@citruscodex.fr"] .cca-status-active')).toBeVisible()
  })
  
  test('T3 admin peut réinitialiser un mot de passe et le retrouver dans l\'audit', async ({ page }) => {
    await _loginAsAdmin(page)
    await page.click('text=Admin')
    await page.click('[data-user-email="collectionneur@citruscodex.fr"] .cca-admin-actions')
    await page.click('text=Réinitialiser le mot de passe')
    
    // Mot de passe temporaire affiché
    const tempPwd = await page.locator('.cca-admin-temp-password').textContent()
    expect(tempPwd.length).toBeGreaterThanOrEqual(8)
    
    // Vérifier dans l'audit
    await page.click('text=Historique des actions')
    await expect(page.locator('text=password_reset_temp')).toBeVisible()
  })
  
  test('T4 admin peut grouper des bugs', async ({ page }) => {
    await _loginAsAdmin(page)
    await page.click('text=Admin')
    await page.click('text=Bugs signalés')
    
    // Sélectionner 2 bugs
    const checkboxes = page.locator('.cca-admin-bug-checkbox')
    if (await checkboxes.count() >= 2) {
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()
      await page.click('text=Grouper la sélection')
      await page.fill('[name="group_title"]', 'Bug groupé test')
      await page.click('text=Créer le groupe')
      await expect(page.locator('text=Bug groupé test')).toBeVisible()
    }
  })
  
  test('T5 comptes test multi-profils accessibles', async ({ browser }) => {
    for (const profile of ['collectionneur', 'pepinieriste', 'arboriculteur', 'conservatoire']) {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.goto('http://localhost:5173')
      await page.fill('[name="email"]', `${profile}@citruscodex.fr`)
      await page.fill('[name="password"]', 'TestBeta2026!')
      await page.click('button[type="submit"]')
      await page.waitForSelector('[data-view="dashboard"], .dashboard', { timeout: 15000 })
      
      // Vérifier que le profil est correct
      const profileIndicator = await page.locator(`[data-profile="${profile}"], text=${profile}`).count()
      expect(profileIndicator).toBeGreaterThan(0)
      
      await ctx.close()
    }
  })
  
  test('T6 notification BBCH ne s\'envoie qu\'au changement de stade', async ({ page }) => {
    // Ce test vérifie la logique côté serveur via API
    // Appel au cron manuellement ou test de la fonction
    await _loginAsAdmin(page)
    // Vérifier que la config BBCH est "changement uniquement" dans les réglages
    await page.click('text=Réglages')
    await page.click('text=Notifications')
    await expect(page.locator('text=Stades BBCH')).toBeVisible()
    // Le toggle doit être présent et fonctionnel
  })
})

async function _loginAsAdmin(page) {
  await page.goto('http://localhost:5173')
  await page.fill('[name="email"]', 'tristan.peyrotty@gmail.com')
  await page.fill('[name="password"]', '<admin_password>')
  await page.click('button[type="submit"]')
  await page.waitForSelector('[data-view="dashboard"], .dashboard', { timeout: 15000 })
}
```

---

## LIVRAISON

```bash
npm run build  # OK obligatoire
npx playwright test tests/phase1-admin.spec.js  # 6/6 passent
```

### Commits (un par chantier)

```
feat(admin): migration 008 audit_log + bug_groups + colonnes users
feat(admin): routes backend admin-panel (CRUD users, bugs, audit, stats)
feat(admin): module frontend admin-panel.js (4 onglets, extraction monolithe)
feat(admin): 4 comptes test multi-profils avec données seed
fix(bbch): notification uniquement au changement de stade
refactor(admin): extraction code admin inline → module admin-panel.js
```

### Mise à jour SESSION_STATE.md

```
- Phase 1 ✅ complète
- Admin panel : 4 onglets (comptes, bugs, audit, stats)
- 4 comptes test : collectionneur/pepinieriste/arboriculteur/conservatoire @citruscodex.fr
- BBCH : notification changement de stade uniquement
- Modules extraits du monolithe : admin-panel.js
- Prochaine tâche : Phase 2 (features F1-F10 + modules communautaires)
```

```bash
git add SESSION_STATE.md CLAUDE.md
git commit -m "docs(session): phase 1 complète — admin panel + comptes test + BBCH"
git push origin main
```

## Critères de réussite

- [ ] Migration SQL 008 appliquée (tables admin_audit_log, bug_report_groups, colonnes users)
- [ ] Routes admin fonctionnelles (curl test sur /api/admin/users, /api/admin/bugs, /api/admin/audit-log)
- [ ] Admin panel 4 onglets fonctionnels dans l'interface
- [ ] Reset password → mot de passe temp visible + traçable dans audit
- [ ] Bugs groupables, filtrables, assignables
- [ ] 4 comptes test connectables avec profils corrects
- [ ] BBCH notifie uniquement au changement de stade
- [ ] Code admin extrait de index.html → admin-panel.js (monolithe plus petit)
- [ ] 6/6 tests Playwright
- [ ] `node --check` OK tous fichiers JS
- [ ] `npm run build` OK
