/**
 * Converts a name to a URL-safe slug.
 *
 * Examples:
 *   "The High Line"     → "the-high-line"
 *   "Café du Monde"     → "cafe-du-monde"
 *   "Sacré-Cœur"        → "sacre-coeur"
 *   "V&A Museum"        → "v-and-a-museum"
 *   "Katz's Delicatessen" → "katzs-delicatessen"
 *
 * Limitations: non-Latin scripts (Arabic, Chinese, Cyrillic, etc.) are stripped
 * and will produce empty or degraded slugs — place names must be in Latin script.
 *
 * @param {string} name
 * @returns {string}
 */
export function toSlug(name) {
  return name
    .toLowerCase()
    // Expand symbols before stripping (spaces ensure word boundaries)
    .replace(/&/g, ' and ')
    // Strip apostrophes/single quotes so contractions stay joined (katz's → katzs)
    .replace(/['’]/g, '')
    // Common ligatures and special character substitutions
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/ß/g, 'ss')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
    // Decompose accented characters, then strip combining marks
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Replace any non-alphanumeric runs with a single hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');
}
