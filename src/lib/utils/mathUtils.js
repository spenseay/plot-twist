// src/lib/utils/mathUtils.js

/**
 * Calculate the distance between two coordinates
 * @param {{ x: number, y: number }} a - First coordinate with x and y properties
 * @param {{ x: number, y: number }} b - Second coordinate with x and y properties
 * @returns {number} - Distance between the two points
 */
export function calculateDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}