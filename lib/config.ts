// Electronegativity-difference cutoffs for bond type (section A).
// Change these to match your class:
//   ΔEN ≤ NONPOLAR_MAX            → nonpolar covalent
//   NONPOLAR_MAX < ΔEN < IONIC_MIN → polar covalent
//   ΔEN ≥ IONIC_MIN               → ionic
export const NONPOLAR_MAX = 0.4;
export const IONIC_MIN = 1.7;
