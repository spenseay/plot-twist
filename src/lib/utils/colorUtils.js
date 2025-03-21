/**
 * Calculate the contrast value for a given hex color
 * to determine if text should be white or dark
 * @param {string} hexcolor - Hex color code
 * @returns {number} - YIQ contrast value
 */
export function getContrastYIQ(hexcolor) {
  if (hexcolor.charAt(0) === '#') hexcolor = hexcolor.substring(1);
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}