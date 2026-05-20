import Dashboard from "@/app/components/Dashboard";
import { getSyncStatus, listTasks } from "@/lib/tasks";
import type { SyncStatus, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let tasks: Task[] = [];
  let sync: SyncStatus | null = null;
  let loadError: string | null = null;

  try {
    tasks = await listTasks();
    sync = await getSyncStatus();
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Dashboard initialTasks={tasks} initialSync={sync} loadError={loadError} />
  );
}
