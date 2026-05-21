import Dashboard from "@/app/components/Dashboard";
import { getSyncStatus, listTasks } from "@/lib/tasks";
import { getTeam } from "@/lib/team";
import type { SyncStatus, Task, TeamMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let tasks: Task[] = [];
  let sync: SyncStatus | null = null;
  let team: TeamMember[] = [];
  let loadError: string | null = null;

  try {
    tasks = await listTasks();
    sync = await getSyncStatus();
    team = await getTeam();
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Dashboard
      initialTasks={tasks}
      initialSync={sync}
      initialTeam={team}
      loadError={loadError}
    />
  );
}
