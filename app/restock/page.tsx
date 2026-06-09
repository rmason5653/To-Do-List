import { buildRestockRun, listConsumables, listUnits } from "@/lib/inventory";
import {
  Container,
  EmptyState,
  PageHeader,
  SetupNotice,
} from "@/app/components/ui";
import RestockClient, { type RestockRun } from "./RestockClient";

export const dynamic = "force-dynamic";

export default async function RestockPage() {
  let runs: RestockRun[] = [];
  let loadError: string | null = null;

  try {
    const [units, cons] = await Promise.all([listUnits(), listConsumables()]);
    runs = buildRestockRun(units, cons).map((r) => ({
      unit_id: r.unit.unit_id,
      unit_name: r.unit.name,
      property_name: r.unit.property_name,
      items: r.items.map((i) => ({
        item_name: i.par.item_name,
        needed: i.needed,
        closet_par: i.par.closet_par,
        current_actual: i.par.current_actual,
      })),
    }));
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Container>
      <PageHeader eyebrow="View 1" title="Restock run">
        {runs.length > 0 && (
          <p className="text-sm text-ink-tertiary">
            {runs.length} {runs.length === 1 ? "unit" : "units"} below reorder
          </p>
        )}
      </PageHeader>

      {loadError ? (
        <SetupNotice message={loadError} />
      ) : runs.length === 0 ? (
        <EmptyState punch="All at par" line="No closet is below its reorder point. Nothing to restock." />
      ) : (
        <RestockClient runs={runs} />
      )}
    </Container>
  );
}
