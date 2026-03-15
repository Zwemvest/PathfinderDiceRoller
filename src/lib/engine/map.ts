// ─── Multiple Attack Penalty calculator — Phase 3 Plan 02 ─────────────────────
// Source: PF2e CRB — Multiple Attack Penalty
//
// Standard: 0 / -5 / -10 for 1st / 2nd / 3rd attack
// Agile:    0 / -4 / -8  for 1st / 2nd / 3rd attack

/**
 * Compute the Multiple Attack Penalty for a given attack number.
 *
 * @param attackNumber - Which attack this is (1 = first, 2 = second, 3 = third or beyond)
 * @param isAgile      - Whether the weapon has the agile trait
 * @returns The MAP penalty (0 or negative integer)
 */
export function computeMAP(attackNumber: 1 | 2 | 3, isAgile: boolean): number {
  if (attackNumber === 1) return 0;
  if (isAgile) return attackNumber === 2 ? -4 : -8;
  return attackNumber === 2 ? -5 : -10;
}
