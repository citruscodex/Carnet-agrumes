/**
 * Seed 004 — Comptes test multi-profils (Phase 1)
 *
 * Usage (sur le serveur) :
 *   cd /opt/cca && node server/seeds/004_test_accounts.js
 *
 * Prérequis : DATABASE_URL défini dans l'environnement, bcrypt disponible.
 * Idempotent : utilise INSERT ... ON CONFLICT DO NOTHING.
 */

'use strict';

const { Pool } = require('pg');
const bcrypt   = require('bcrypt');
const { randomUUID } = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PASSWORD = 'TestBeta2026!';
const ACCOUNTS = [
  { email: 'collectionneur@citruscodex.fr', profile_type: 'collectionneur' },
  { email: 'pepinieriste@citruscodex.fr',   profile_type: 'pepinieriste'   },
  { email: 'arboriculteur@citruscodex.fr',  profile_type: 'arboriculteur'  },
  { email: 'conservatoire@citruscodex.fr',  profile_type: 'conservatoire'  },
];

// Données de test par profil
const SEED_PLANTS = {
  collectionneur: [
    { sn: 'Citrus limon',         cn: 'Citronnier',         variety: 'Eureka',       notes: 'En pot, exposition plein sud' },
    { sn: 'Citrus sinensis',      cn: 'Oranger doux',       variety: 'Navel',        notes: 'Hivernage en véranda' },
    { sn: 'Citrus reticulata',    cn: 'Mandarinier',        variety: 'Satsuma',      notes: 'Rustique jusqu\'à -8°C' },
    { sn: 'Fortunella margarita', cn: 'Kumquat',            variety: 'Nagami',       notes: 'Fruits comestibles entiers' },
    { sn: 'Citrus medica',        cn: 'Cédratier main de Bouddha', variety: null,   notes: 'Plante rare, fruit décoratif' },
  ],
  pepinieriste: [
    { sn: 'Citrus limon',         cn: 'Citronnier',         variety: 'Villafranca',  notes: 'Stock pépinière — lot 2025' },
    { sn: 'Citrus sinensis',      cn: 'Oranger doux',       variety: 'Valencia',     notes: 'Production commerciale' },
    { sn: 'Poncirus trifoliata',  cn: 'Poncire',            variety: null,           notes: 'Porte-greffe résistant au gel' },
  ],
  arboriculteur: [
    { sn: 'Citrus limon',         cn: 'Citronnier',         variety: 'Femminello',   notes: 'Parcelle A1 — 12 arbres' },
    { sn: 'Citrus sinensis',      cn: 'Oranger doux',       variety: 'Pineapple',    notes: 'Parcelle B2 — irrigation goutte-à-goutte' },
    { sn: 'Citrus paradisi',      cn: 'Pamplemoussier',     variety: 'Marsh',        notes: 'Parcelle C3 — récolte octobre' },
  ],
  conservatoire: [
    { sn: 'Citrus aurantium',     cn: 'Bigaradier',         variety: 'Séville',      notes: 'Provenance : Espagne, 1987. Collection patrimoine.' },
    { sn: 'Citrus bergamia',      cn: 'Bergamotier',        variety: null,           notes: 'Espèce rare — Calabre, Italie' },
    { sn: 'Citrus hystrix',       cn: 'Combava',            variety: null,           notes: 'Provenance : Madagascar, 2003' },
    { sn: 'Microcitrus australasica', cn: 'Citron caviar', variety: 'Red Centre',   notes: 'Australie — très rare' },
  ],
};

const EVENT_TEMPLATES = [
  { type: 'Arrosage',      notes: 'Arrosage régulier',           days_ago: 3  },
  { type: 'Fertilisation', notes: 'Engrais NPK 10-5-10',         days_ago: 14 },
  { type: 'Observation',   notes: 'Bonne vigueur foliaire',      days_ago: 7  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash(PASSWORD, 12);
    console.log('[seed] Hashing password done');

    for (const account of ACCOUNTS) {
      // Créer ou récupérer le compte
      const existing = await client.query(
        'SELECT id FROM users WHERE email=$1', [account.email]
      );

      let userId;
      if (existing.rows.length) {
        userId = existing.rows[0].id;
        console.log(`[seed] Account already exists: ${account.email} (id=${userId})`);
      } else {
        const { rows } = await client.query(
          `INSERT INTO users (email, password_hash, role, profile_type, is_active, email_verified)
           VALUES ($1, $2, 'member', $3, true, true)
           RETURNING id`,
          [account.email, hash, account.profile_type]
        );
        userId = rows[0].id;
        console.log(`[seed] Created account: ${account.email} (id=${userId})`);
      }

      // Ajouter les plantes de test (idempotent via email+scientific_name)
      const plants = SEED_PLANTS[account.profile_type] || [];
      for (const p of plants) {
        const plantExists = await client.query(
          `SELECT id FROM user_plants WHERE user_id=$1 AND scientific_name=$2 AND deleted_at IS NULL`,
          [userId, p.sn]
        );
        if (plantExists.rows.length) continue;

        const { rows: plantRows } = await client.query(
          `INSERT INTO user_plants (user_id, scientific_name, common_name, variety, notes, acquisition_date)
           VALUES ($1,$2,$3,$4,$5,NOW()-INTERVAL '${Math.floor(Math.random()*365)+30} days')
           RETURNING id`,
          [userId, p.sn, p.cn, p.variety, p.notes]
        );
        const plantId = plantRows[0].id;
        console.log(`  [seed]   Plant: ${p.sn} (id=${plantId})`);

        // Ajouter 2-3 événements par plante
        for (const ev of EVENT_TEMPLATES.slice(0, 2 + Math.floor(Math.random() * 2))) {
          const evDate = new Date();
          evDate.setDate(evDate.getDate() - ev.days_ago);
          await client.query('SAVEPOINT ev_insert');
          try {
            await client.query(
              `INSERT INTO user_events (user_id, plant_id, event_type, event_date, notes)
               VALUES ($1,$2,$3,$4,$5)`,
              [userId, plantId, ev.type, evDate.toISOString().split('T')[0], ev.notes]
            );
            await client.query('RELEASE SAVEPOINT ev_insert');
          } catch { await client.query('ROLLBACK TO SAVEPOINT ev_insert'); }
        }
      }

      // Logger dans admin_audit_log si possible (droits optionnels)
      await client.query('SAVEPOINT audit_insert');
      try {
        const adminRow = await client.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
        if (adminRow.rows.length) {
          await client.query(
            `INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
             VALUES ($1,$2,'user_created',$3) ON CONFLICT DO NOTHING`,
            [adminRow.rows[0].id, userId, JSON.stringify({
              email: account.email, profile_type: account.profile_type, purpose: 'test_account_beta'
            })]
          );
        }
        await client.query('RELEASE SAVEPOINT audit_insert');
      } catch { await client.query('ROLLBACK TO SAVEPOINT audit_insert'); }
    }

    await client.query('COMMIT');
    console.log('[seed] Done ✅');
    console.log('[seed] Credentials: TestBeta2026!');
    console.log('[seed] Accounts:');
    ACCOUNTS.forEach(a => console.log(`  ${a.email}`));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] ROLLBACK:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
