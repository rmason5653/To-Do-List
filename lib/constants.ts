// Display labels and ordering. Linens are keyed internally by a stable key;
// central reserve uses the same key for the linen category so a pull can find
// the right reserve row.

import type { Category, PullReason } from "./types";

export const LINEN_TYPES: { key: string; label: string }[] = [
  { key: "bath_towel", label: "Bath towels" },
  { key: "washcloth", label: "Washcloths" },
  { key: "hand_towel", label: "Hand towels" },
  { key: "makeup_towel", label: "Makeup towels" },
  { key: "kitchen_towel", label: "Kitchen towels" },
];

const LINEN_LABEL = new Map(LINEN_TYPES.map((l) => [l.key, l.label]));

/** Human label for a linen type key; falls back to the raw key. */
export function linenLabel(key: string): string {
  return LINEN_LABEL.get(key) ?? key;
}

export const REASON_LABELS: Record<PullReason, string> = {
  weekly_restock: "Weekly restock",
  damage_replacement: "Damage replacement",
  stain_out: "Stain out",
};

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason as PullReason] ?? reason;
}

/** Reasons valid for each category — consumables restock, linens are exceptions. */
export const REASONS_BY_CATEGORY: Record<Category, PullReason[]> = {
  consumable: ["weekly_restock"],
  linen: ["damage_replacement", "stain_out"],
};
