# CLAUDE_CODE_PROMPT_PHASE1.md — Backend Auth & Bêta

## Contexte

Tu travailles sur le projet CitrusCodex. Le backend Fastify existe déjà sur le serveur Scaleway (62.210.237.49) avec une API auth basique (login, refresh, sync push/pull, wiki CRUD). Le frontend monolithe `index.html` est déployé dans `/var/www/cca/`.

Référence architecture : `ARCHITECTURE.md`
Schéma PostgreSQL cible : `backend/schema.sql`

## Objectif Phase 1

Renforcer le backend pour permettre l'onboarding de 10-15 bêta-testeurs avec un système d'auth complet, sécurisé et administrable.

## Tâches séquentielles

### T1 — Migration schéma PostgreSQL
1. Se connecter au serveur via SSH
2. Appliquer `backend/schema.sql` en mode additive (ne pas dropper les tables existantes)
3. Vérifier les tables créées
4. Créer un compte admin initial (email de Tristan)

### T2 — Inscription contrôlée par whitelist
Endpoint : `POST /api/auth/register`

Logique :
1. Vérifier que `email` est dans `beta_whitelist` ET `used = false`
2. Si non → rejeter avec message "Inscription non autorisée"
3. Hasher le password avec bcrypt (12 rounds)
4. Créer l'utilisateur avec `email_verified = false`
5. Générer un `verification_token` (crypto.randomBytes, 32 hex)
6. Envoyer un email de vérification via SMTP (Scaleway TEM ou Brevo)
7. Marquer `beta_whitelist.used = true`
8. Répondre 201 avec message "Vérifiez votre email"

### T3 — Validation email
Endpoint : `GET /api/auth/verify?token=xxx`

1. Chercher le token dans `users.verification_token`
2. Vérifier non expiré (`verification_expires > NOW()`)
3. Mettre `email_verified = true`, nullifier le token
4. Rediriger vers `citruscodex.fr` avec paramètre `?verified=1`

Modification frontend : détecter `?verified=1` au chargement et afficher un toast "Email vérifié ✓".

### T4 — Reset password
Endpoints :
- `POST /api/auth/forgot` : email → générer reset_token, envoyer par mail
- `POST /api/auth/reset` : token + nouveau password → mettre à jour

Même pattern que la vérification email (token hex, expiration 1h).

### T5 — Login renforcé
Modifier `POST /api/auth/login` :
1. Vérifier `email_verified = true` sinon rejeter "Email non vérifié"
2. Vérifier `is_active = true` sinon rejeter "Compte désactivé"
3. Mettre à jour `last_login`
4. Inclure `profile_type` et `role` dans le payload JWT
5. Stocker le refresh token hashé dans `refresh_tokens`

### T6 — Admin API
Endpoints (middleware : `role = 'admin'`) :
- `GET /api/admin/users` : liste paginée des utilisateurs
- `PUT /api/admin/users/:id/role` : changer le rôle (existe déjà, enrichir)
- `PUT /api/admin/users/:id/profile-type` : changer le type de profil
- `PUT /api/admin/users/:id/active` : activer/désactiver
- `POST /api/admin/whitelist` : ajouter un email à la whitelist
- `GET /api/admin/whitelist` : lister la whitelist
- `DELETE /api/admin/whitelist/:id` : retirer de la whitelist
- `GET /api/admin/feedback` : liste des feedbacks (filtrable par status)
- `PUT /api/admin/feedback/:id/status` : changer le statut d'un feedback

### T7 — Système de feedback
Endpoint : `POST /api/feedback`

Body : `{ category, title, description, page, screenshot?, user_agent?, app_version? }`

Modification frontend (`index.html`) : ajouter un bouton flottant 🐛 en bas à droite (visible uniquement si `_srvToken`) qui ouvre une modale de feedback avec :
- Select catégorie (bug, feature, ux, performance, autre)
- Input titre
- Textarea description
- Bouton capture d'écran (optionnel, via `canvas.toDataURL`)
- Auto-remplir page courante et user-agent

### T8 — Supprimer le changement de profil dans Réglages
Dans `index.html`, dans la section Réglages > Profil :
- Retirer le `<select>` qui permet de changer `profileType`
- Afficher le type de profil actuel en lecture seule
- Ajouter un texte : "Le type de profil est défini par l'administrateur."

## Contraintes

- **SMTP** : Utiliser `nodemailer` avec un service transactionnel (Brevo, Scaleway TEM, ou SMTP configuré). Les credentials SMTP sont dans des variables d'env sur le serveur.
- **Sécurité** : bcrypt 12 rounds, tokens hex 32 bytes, JWT 15 min exp, refresh 30 jours.
- **Zones protégées** : Ne pas toucher au pipeline phytosanitaire, AES-GCM sync, sumAppliedNPK, Firebase legacy, barcode-scanner, ServiceWorker.
- **i18n** : Tout nouveau texte frontend doit être dans les 5 langues (FR/EN/IT/ES/PT).
- **XSS** : `esc()` sur tout innerHTML dynamique.
- **Tests** : Après chaque endpoint, tester avec `curl` depuis le serveur.

## Validation

Chaque tâche T1-T8 doit être validée individuellement avant de passer à la suivante. Rapport de test attendu pour chaque tâche.

## Fichiers concernés

- `/var/www/cca/index.html` (frontend)
- Backend Fastify (code serveur sur Scaleway, localisation à identifier)
- `backend/schema.sql` (référence schéma)
