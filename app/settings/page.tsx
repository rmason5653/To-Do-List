import { getSettings, listConsumableItems } from "@/lib/inventory";
import { Container, PageHeader, SetupNotice } from "@/app/components/ui";
import type { ConsumableItem, Settings } from "@/lib/types";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: Settings = {
    default_turnover_frequency: 3,
    buffer_turnovers: 1,
    central_buffer: 2,
  };
  let items: ConsumableItem[] = [];
  let loadError: string | null = null;

  try {
    [settings, items] = await Promise.all([getSettings(), listConsumableItems()]);
    // Bulk supplies (fixed par, e.g. a gallon of soap) aren't driven by the
    // leave-behind math — they're edited on the Stockroom, not here.
    items = items.filter((i) => !i.fixed_par);
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Container>
      <PageHeader eyebrow="Admin" title="Par settings" />
      {loadError ? (
        <SetupNotice message={loadError} />
      ) : (
        <SettingsClient settings={settings} items={items} />
      )}
    </Container>
  );
}
