/**
 * server/crons/bbch-notifications.js — Cron BBCH : notification uniquement au changement de stade
 *
 * Logique clé : on ne notifie que quand le stade BBCH calculé diffère
 * du dernier stade enregistré dans user_bbch_tracking.
 *
 * Intégration dans app.js :
 *   const { scheduleBBCHCron } = require('./crons/bbch-notifications')
 *   scheduleBBCHCron(app)   // à appeler après que fastify.pg est prêt
 */

'use strict';

// ── Seuils BBCH (en GJC — Growing Degree Days) ──────────────────────────────
const BBCH_STAGES = [
  { id: 'debourrement',   gjc:   80, bbch: '07-09', label: 'Débourrement'         },
  { id: 'floraison',      gjc:  200, bbch: '60-65', label: 'Floraison'            },
  { id: 'nouaison',       gjc:  380, bbch: '71',    label: 'Nouaison'             },
  { id: 'grossissement',  gjc:  600, bbch: '79',    label: 'Grossissement fruits' },
  { id: 'veraison',       gjc:  900, bbch: '81-85', label: 'Véraison / coloration'},
  { id: 'maturite',       gjc: 1150, bbch: '87-89', label: 'Maturité commerciale' },
];

function calculateBBCHStage(gjcCumul) {
  let current = null;
  for (const s of BBCH_STAGES) {
    if (gjcCumul >= s.gjc) current = s;
    else break;
  }
  return current; // null si GJC < premier seuil (repos végétatif)
}

// ── Envoi de notification ─────────────────────────────────────────────────────
// Tente web-push si disponible, sinon email de fallback
async function sendNotification(pg, sendMail, userId, plantName, oldStage, newStage, baseUrl) {
  const label    = newStage.label;
  const oldLabel = oldStage ? oldStage.label : 'repos végétatif';

  // 1. Web push (si les abonnements sont stockés)
  try {
    const subs = await pg.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=$1`,
      [userId]
    );
    if (subs.rows.length) {
      let webpush;
      try { webpush = require('web-push'); } catch { webpush = null; }
      if (webpush && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
        webpush.setVapidDetails(
          `mailto:${process.env.CONTACT_EMAIL || 'citruscodex@gmail.com'}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        const payload = JSON.stringify({
          title: `${plantName} — Nouveau stade BBCH`,
          body:  `Passage au stade ${label} (était : ${oldLabel})`,
          url:   `${baseUrl}/?page=phenology`
        });
        await Promise.allSettled(subs.rows.map(s =>
          webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        ));
        return;
      }
    }
  } catch { /* push_subscriptions table might not exist yet */ }

  // 2. Fallback email
  if (!sendMail) return;
  const { rows: user } = await pg.query(`SELECT email FROM users WHERE id=$1`, [userId]);
  if (!user.length) return;
  await sendMail(
    user[0].email,
    `🍊 CitrusCodex — ${plantName} : nouveau stade BBCH`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#c75b2a">🍊 CitrusCodex</h1>
      <p>Votre plante <strong>${plantName}</strong> a atteint un nouveau stade phénologique.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px;background:#f5f0e8;border-radius:4px"><strong>Ancien stade</strong></td>
          <td style="padding:8px">${oldLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px;background:#f5f0e8;border-radius:4px"><strong>Nouveau stade</strong></td>
          <td style="padding:8px;color:#c75b2a;font-weight:700">${label} (BBCH ${newStage.bbch})</td>
        </tr>
      </table>
      <p><a href="${baseUrl}" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Voir dans CitrusCodex</a></p>
    </div>`
  ).catch(() => {});
}

// ── Logique principale ────────────────────────────────────────────────────────
async function checkBBCHChanges(pg, sendMail, log, baseUrl) {
  log?.info('[bbch-cron] Démarrage vérification changements BBCH');

  try {
    const { rows: users } = await pg.query(
      `SELECT u.id, us.profile_json
       FROM users u
       JOIN user_settings us ON us.user_id = u.id
       WHERE us.notif_bbch = true
         AND (u.is_active = true OR u.is_active IS NULL)
         AND u.disabled_at IS NULL`
    );

    let notifCount = 0;
    let skipCount  = 0;

    for (const user of users) {
      const gjcCumul = user.profile_json?.gjcCumul ?? 0;
      if (!gjcCumul) continue;

      const { rows: plants } = await pg.query(
        `SELECT id, scientific_name, common_name FROM user_plants
         WHERE user_id=$1 AND deleted_at IS NULL`,
        [user.id]
      );

      for (const plant of plants) {
        const currentStage = calculateBBCHStage(gjcCumul);
        const currentId    = currentStage?.id ?? 'repos';

        const { rows: tracking } = await pg.query(
          `SELECT last_stage FROM user_bbch_tracking WHERE user_id=$1 AND plant_id=$2`,
          [user.id, plant.id]
        );
        const lastStageId = tracking[0]?.last_stage ?? null;

        if (currentId === lastStageId) {
          skipCount++;
          continue; // stade inchangé → pas de notification
        }

        // Stade a changé → notifier
        const oldStage = BBCH_STAGES.find(s => s.id === lastStageId) ?? null;
        const plantName = plant.common_name || plant.scientific_name;

        if (currentStage) {
          await sendNotification(pg, sendMail, user.id, plantName, oldStage, currentStage, baseUrl);
          notifCount++;
        }

        // Mettre à jour le tracking
        await pg.query(
          `INSERT INTO user_bbch_tracking (user_id, plant_id, last_stage, last_notified_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, plant_id)
           DO UPDATE SET last_stage=$3, last_notified_at=NOW()`,
          [user.id, plant.id, currentId]
        );
      }
    }

    log?.info(`[bbch-cron] Terminé — ${notifCount} notification(s) envoyée(s), ${skipCount} stade(s) inchangé(s)`);
  } catch (err) {
    log?.error('[bbch-cron] Erreur :', err.message);
  }
}

// ── Planification quotidienne à 7h30 ─────────────────────────────────────────
function scheduleBBCHCron(fastify) {
  const baseUrl = fastify.baseUrl || 'https://citruscodex.fr';
  const pg      = fastify.pg;
  const sendMail = fastify.sendMail;
  const log     = fastify.log;

  function msUntil730() {
    const now  = new Date();
    const next = new Date(now);
    next.setHours(7, 30, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  }

  function scheduleDailyRun() {
    const delay = msUntil730();
    log?.info(`[bbch-cron] Prochain run dans ${Math.round(delay / 60000)} min`);
    setTimeout(() => {
      checkBBCHChanges(pg, sendMail, log, baseUrl);
      setInterval(
        () => checkBBCHChanges(pg, sendMail, log, baseUrl),
        24 * 60 * 60 * 1000
      );
    }, delay);
  }

  scheduleDailyRun();
}

module.exports = { scheduleBBCHCron, checkBBCHChanges, calculateBBCHStage };
