/**
 * Knowledge Base Helper Utilities
 */

/**
 * Strips duplicate leading emojis/icons from a topic name when an icon is rendered alongside it.
 * e.g., '💻 ซอฟต์แวร์และแอปพลิเคชัน' with icon '💻' -> 'ซอฟต์แวร์และแอปพลิเคชัน'
 *
 * @param {string} name - Topic or category name
 * @param {string} [icon] - Associated icon/emoji
 * @returns {string} Sanitized name without duplicate leading emoji
 */
export function getCleanTopicName(name, icon) {
  if (!name) return '';
  let str = String(name).trim();
  if (icon && str.startsWith(String(icon).trim())) {
    str = str.slice(String(icon).trim().length).trim();
  }
  return str.replace(/^(\p{Extended_Pictographic}|\uFE0F|\u200D)+\s*/u, '').trim() || str;
}
