'use strict';

// Exhaustive list of known localStorage keys owned by the current user session.
// Dynamic per-collection keys (agrumes_v5_<id>, agrumes_pheno_last_<id>) are
// resolved from the collection index before deletion.
const USER_DATA_KEYS = [
  'agrumes_amendments',
  'agrumes_app_version',
  'agrumes_bug_fab_pos',
  'agrumes_bug_queue',
  'agrumes_certifications',
  'agrumes_cfg',
  'agrumes_clients',
  'agrumes_coll_filters',
  'agrumes_collections',
  'agrumes_devis',
  'agrumes_drip_systems',
  'agrumes_eau',
  'agrumes_eco',
  'agrumes_epandage',
  'agrumes_exchanges',
  'agrumes_fertilizers',
  'agrumes_guide_bookmarks',
  'agrumes_guide_last_read',
  'agrumes_guide_toc_visible',
  'agrumes_iot_v1',
  'agrumes_light',
  'agrumes_lots',
  'agrumes_migrated_to_server',
  'agrumes_nursery',
  'agrumes_profile',
  'agrumes_readonly',
  'agrumes_saisonniers',
  'agrumes_saved_filters',
  'agrumes_shopping',
  'agrumes_sortis',
  'agrumes_srv_id_map',
  'agrumes_srv_last_sync',
  'agrumes_stocks',
  'agrumes_substrats',
  'agrumes_suppliers',
  'agrumes_sync',
  'agrumes_sync_queue',
  'agrumes_v5',
  'agrumes_verger',
  'agrumes_weather_location',
  'agrumes_wikiPages',
  'agrumes_wiki_pages',
  'agrumes_wishlist',
  'agrumes_yield',
];

export function clearUserData() {
  const keys = [...USER_DATA_KEYS];
  // Resolve dynamic per-collection keys before the index is removed
  try {
    const collections = JSON.parse(localStorage.getItem('agrumes_collections') || '[]');
    for (const c of collections) {
      if (c.id) {
        keys.push('agrumes_v5_' + c.id);
        keys.push('agrumes_pheno_last_' + c.id);
      }
    }
  } catch (_) {}
  keys.forEach(k => localStorage.removeItem(k));
}
