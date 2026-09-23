// A/B week rotation. Every A/B slot in the program flips together each week.
//
// state.ab = {
//   anchor: "YYYY-MM-DD",   // start (Sunday) of the first week of the program; that week is A
//   flips: ["YYYY-MM-DD"],  // week starts where the user flipped A/B; each flip carries forward
// }

import { weekProgram } from "../data/program.js";
import { daysBetween } from "./dates.js";

export function weekVariant(weekStart, ab) {
  if (!ab || !ab.anchor) return "A";
  const weeks = Math.round(daysBetween(ab.anchor, weekStart) / 7);
  const flips = (ab.flips || []).filter((w) => w <= weekStart).length;
  return (((weeks + flips) % 2) + 2) % 2 === 0 ? "A" : "B";
}

// Flip A/B from `weekStart` onward. Flipping the same week again undoes it.
export function toggleFlip(ab, weekStart) {
  const flips = ab.flips || [];
  return {
    ...ab,
    flips: flips.includes(weekStart) ? flips.filter((w) => w !== weekStart) : [...flips, weekStart].sort(),
  };
}

export const programForWeek = (weekStart, ab) => weekProgram(weekVariant(weekStart, ab));
