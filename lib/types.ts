// Mason Homes Inventory Tracker — data model.
// Mirrors the five tables in the spec: units, consumable par, linen par,
// central reserve, central pull log (plus a lightweight clean log).

export type Category = "consumable" | "linen";

/** 'na' = the unit has no parking pass, so there is nothing to confirm. */
export type ParkingStatus = "ok" | "missing" | "na";

export type PullReason =
  | "weekly_restock"
  | "damage_replacement"
  | "stain_out";

export interface Unit {
  unit_id: string;
  name: string; // full display, e.g. "Riviera 105"
  property_name: string; // group key, e.g. "Riviera"
  sort: number;
  parking_pass_label: string; // "None" | "1 pass" | "2 passes" | "Card"
  has_parking_pass: boolean;
  parking_status: ParkingStatus;
  parking_confirmed_at: string | null;
  last_cleaned_at: string | null;
  turnover_frequency: number | null; // turnovers/week; null = use global default
}

/** Global inputs that drive the calculated par math. */
export interface Settings {
  default_turnover_frequency: number;
  buffer_turnovers: number;
  central_buffer: number;
}

/** A consumable item's global leave-behind (drives its calculated par). */
export interface ConsumableItem {
  item_name: string;
  sort: number;
  leave_behind: number;
}

/** A team member account (admin or cleaner), invited by login link. */
export interface AppUser {
  id: string;
  name: string;
  phone: string | null;
  role: "admin" | "cleaner";
  status: "active" | "disabled";
  invite_token: string;
  onboarded: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface ConsumablePar {
  id: string;
  unit_id: string;
  item_name: string;
  sort: number;
  leave_behind: number;
  closet_par: number;
  reorder_point: number;
  current_actual: number;
}

export interface LinenPar {
  id: string;
  unit_id: string;
  linen_type: string; // bath_towel | washcloth | hand_towel | makeup_towel | kitchen_towel
  sort: number;
  par_count: number;
  current_actual: number;
}

export interface CentralReserveItem {
  id: string;
  item_name: string;
  category: Category;
  sort: number;
  quantity_on_hand: number;
  reorder_point: number;
  par_level: number; // target bulk level; buy up to this
}

export interface PullLogEntry {
  id: string;
  pulled_at: string;
  staff_name: string;
  item_name: string;
  category: Category;
  quantity: number;
  destination_unit_id: string | null;
  destination_name: string | null;
  reason: PullReason;
}
