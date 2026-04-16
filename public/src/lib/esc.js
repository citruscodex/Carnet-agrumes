/**
 * Échappe les caractères HTML pour prévenir les injections XSS.
 * @param {*} s - Valeur à échapper
 * @returns {string}
 */
export const esc = s =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
