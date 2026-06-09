import { listCentralReserve } from "@/lib/inventory";
import { Container, PageHeader, SetupNotice } from "@/app/components/ui";
import type { CentralReserveItem } from "@/lib/types";
import CentralClient from "./CentralClient";

export const dynamic = "force-dynamic";

export default async function CentralPage() {
  let items: CentralReserveItem[] = [];
  let loadError: string | null = null;

  try {
    items = await listCentralReserve();
  } catch (err) {
    loadError = (err as Error).message;
  }

  const low = items.filter((i) => i.quantity_on_hand <= i.reorder_point).length;

  return (
    <Container>
      <PageHeader eyebrow="View 2" title="Central reserve">
        {!loadError && (
          <p className="text-sm text-ink-tertiary">
            {low > 0 ? (
              <span className="text-gold">{low} to buy</span>
            ) : (
              "All bulk stock healthy"
            )}
          </p>
        )}
      </PageHeader>

      {loadError ? (
        <SetupNotice message={loadError} />
      ) : (
        <CentralClient items={items} />
      )}
    </Container>
  );
}
