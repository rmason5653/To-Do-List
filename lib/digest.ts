import { linenLabel } from "./constants";
import {
  buildLinenIntegrity,
  buildRestockRun,
  listCentralReserve,
  listConsumables,
  listLinens,
  listUnits,
} from "./inventory";

export interface Digest {
  anyIssues: boolean;
  subject: string;
  html: string;
}

function section(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `
    <h3 style="margin:18px 0 6px;font-size:14px;color:#0B0B0D">${title}</h3>
    <ul style="margin:0;padding-left:18px;color:#3a3a3e;font-size:13px;line-height:1.7">
      ${items.map((i) => `<li>${i}</li>`).join("")}
    </ul>`;
}

// Builds the inventory summary emailed to admins (cron digest + manual send).
export async function buildDigest(origin: string): Promise<Digest> {
  const [units, cons, linens, reserve] = await Promise.all([
    listUnits(),
    listConsumables(),
    listLinens(),
    listCentralReserve(),
  ]);

  const restock = buildRestockRun(units, cons);
  const linenShort = buildLinenIntegrity(units, linens).filter((u) => u.short.length > 0);
  const centralLow = reserve.filter((r) => r.quantity_on_hand <= r.reorder_point);
  const parkingMissing = units.filter((u) => u.parking_status === "missing");

  const anyIssues =
    restock.length > 0 ||
    centralLow.length > 0 ||
    linenShort.length > 0 ||
    parkingMissing.length > 0;

  const subject = anyIssues
    ? `Par — ${restock.length} unit${restock.length === 1 ? "" : "s"} to restock, ${centralLow.length} central item${centralLow.length === 1 ? "" : "s"} low`
    : "Par — all good";

  const centralItems = centralLow.map((r) => {
    const label = r.category === "linen" ? linenLabel(r.item_name) : r.item_name;
    return `${label} — ${r.quantity_on_hand} on hand (reorder ${r.reorder_point})`;
  });

  const body = anyIssues
    ? section(`Closets below reorder (${restock.length})`, restock.map((r) => r.unit.name)) +
      section(`Central reserve low (${centralLow.length})`, centralItems) +
      section(`Units short on linens (${linenShort.length})`, linenShort.map((u) => u.unit.name)) +
      section(`Parking pass missing (${parkingMissing.length})`, parkingMissing.map((u) => u.name))
    : `<p style="color:#3a3a3e;font-size:13px">Everything's at par — nothing to restock and central is stocked.</p>`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0B0B0D;max-width:560px">
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#707176;margin:0">Mason Homes Par</p>
      <h2 style="margin:2px 0 0;font-size:20px">Inventory summary</h2>
      ${body}
      <p style="margin:22px 0 0">
        <a href="${origin}/restock" style="display:inline-block;background:#E20602;color:#F5F2EC;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:700;font-size:13px">Open Par</a>
      </p>
    </div>`;

  return { anyIssues, subject, html };
}
