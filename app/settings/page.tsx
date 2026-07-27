import { getSettings, listConsumableItems, listUnits } from "@/lib/inventory";
import { Container, PageHeader, SetupNotice } from "@/app/components/ui";
import type { ConsumableItem, Settings, Unit } from "@/lib/types";
import SettingsClient from "./SettingsClient";
import PulloutClient from "./PulloutClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: Settings = {
    default_turnover_frequency: 3,
    buffer_turnovers: 1,
    central_buffer: 2,
  };
  let items: ConsumableItem[] = [];
  let units: Unit[] = [];
  let loadError: string | null = null;

  try {
    [settings, items, units] = await Promise.all([
      getSettings(),
      listConsumableItems(),
      listUnits(),
    ]);
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
        <div className="space-y-10">
          <SettingsClient settings={settings} items={items} />

          <section>
            <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-ink-primary">
              Unit properties
            </h2>
            <div className="mt-3">
              <PulloutClient units={units} />
            </div>
          </section>
        </div>
      )}
    </Container>
  );
}
