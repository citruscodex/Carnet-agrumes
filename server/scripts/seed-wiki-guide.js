/**
 * server/scripts/seed-wiki-guide.js
 * Seed wiki v2 avec les chapitres du guide débutant fertilisation.
 *
 * Usage (sur le serveur) :
 *   cd /opt/cca && node server/scripts/seed-wiki-guide.js
 *
 * Idempotent : skip si le slug existe déjà.
 */

'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://cca:CcaBeta2026@localhost:5432/ccadb'
});

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function upsertPage(slug, title, content, adminId) {
  const existing = await pool.query(
    'SELECT id FROM wiki_pages WHERE slug=$1',
    [slug]
  );
  if (existing.rows.length) {
    console.log(`  SKIP: ${slug}`);
    return existing.rows[0].id;
  }
  const pageRes = await pool.query(
    'INSERT INTO wiki_pages (slug, title, category_slug, created_by) VALUES ($1,$2,$3,$4) RETURNING id',
    [slug, title, 'guide-fertilisation', adminId]
  );
  const pageId = pageRes.rows[0].id;
  await pool.query(
    'INSERT INTO wiki_revisions (page_id, content, language, author_id, summary) VALUES ($1,$2,$3,$4,$5)',
    [pageId, content, 'fr', adminId, 'Seed initial depuis guide-debutant-citruscodex.md']
  );
  console.log(`  Created: ${slug}`);
  return pageId;
}

async function main() {
  // Admin user
  const adminRes = await pool.query(
    "SELECT id FROM users WHERE email='admin@citruscodex.fr' LIMIT 1"
  );
  if (!adminRes.rows.length) {
    console.error('Admin user not found (admin@citruscodex.fr)');
    process.exit(1);
  }
  const adminId = adminRes.rows[0].id;
  console.log('Admin ID:', adminId);

  // Ensure category exists
  await pool.query(
    `INSERT INTO wiki_categories (slug, label, icon, sort_order)
     VALUES ('guide-fertilisation', 'Guide fertilisation', '📚', 10)
     ON CONFLICT (slug) DO NOTHING`
  );
  console.log('Category guide-fertilisation OK');

  // Read guide
  const guidePath = path.join(__dirname, '../../public/guide/guide-debutant-citruscodex.md');
  const raw = fs.readFileSync(guidePath, 'utf8');

  // Split on ## headings — parts[0] is content before first ##
  const parts = raw.split(/^## /m);

  // Parse each ## section, skip the subtitle-only "Nutrition et conduite des agrumes"
  const SKIP_TITLES = new Set(['Nutrition et conduite des agrumes']);
  const chapters = [];
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    const title = nl === -1 ? part.trim() : part.slice(0, nl).trim();
    const body = nl === -1 ? '' : part.slice(nl + 1).trim();
    if (SKIP_TITLES.has(title)) continue;
    chapters.push({ title, body, slug: slugify(title) });
  }

  console.log(`\nChapitres à seeder : ${chapters.length}`);

  // Upsert each chapter with prev/next nav
  const slugList = chapters.map(c => ({ slug: c.slug, title: c.title }));
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const prev = i > 0 ? slugList[i - 1] : null;
    const next = i < chapters.length - 1 ? slugList[i + 1] : null;

    const navLines = ['\n\n---'];
    if (prev) navLines.push(`← [[${prev.slug}|${prev.title}]]`);
    navLines.push(`[Sommaire](guide-fertilisation-sommaire)`);
    if (next) navLines.push(`[[${next.slug}|${next.title}]] →`);
    const nav = navLines.join('  \n');

    await upsertPage(ch.slug, ch.title, ch.body + nav, adminId);
  }

  // Index article
  console.log('\nIndex sommaire :');
  const indexSlug = 'guide-fertilisation-sommaire';
  let indexContent = `# Guide fertilisation — Sommaire\n\n`;
  indexContent += `Guide de fertilisation raisonnée pour collectionneurs et arboriculteurs.\n\n`;
  slugList.forEach(({ slug, title }) => {
    indexContent += `- [[${slug}|${title}]]\n`;
  });
  await upsertPage(
    indexSlug,
    'Guide fertilisation — Sommaire',
    indexContent,
    adminId
  );

  await pool.end();
  console.log('\nSeed terminé.');
}

main().catch(e => { console.error(e); process.exit(1); });
