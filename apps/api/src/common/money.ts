/**
 * Money helpers. Internally all amounts are integer KES cents. The original
 * prototype and the M-PESA APIs deal in whole shillings, so these converters
 * bridge the two representations at the edges.
 */

export const toCents = (kes: number): number => Math.round(kes * 100);

export const toKes = (cents: number): number => Math.round(cents) / 100;

/** Whole shillings, used when calling M-PESA (Daraja amounts are integers). */
export const toWholeKes = (cents: number): number => Math.round(cents / 100);
