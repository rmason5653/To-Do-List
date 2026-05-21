import Dashboard from "@/app/components/Dashboard";
import { getSyncStatus, listTasks } from "@/lib/tasks";
import { getTeam } from "@/lib/team";
import { getRecurrenceMap } from "@/lib/recurrence";
import { getReminderIds } from "@/lib/notifications";
import type { RecurrenceMap, SyncStatus, Task, TeamMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let tasks: Task[] = [];
  let sync: SyncStatus | null = null;
  let team: TeamMember[] = [];
  let recurrence: RecurrenceMap = {};
  let reminders: string[] = [];
  let loadError: string | null = null;

  try {
    tasks = await listTasks();
    sync = await getSyncStatus();
    team = await getTeam();
    recurrence = await getRecurrenceMap();
    reminders = await getReminderIds();
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Dashboard
      initialTasks={tasks}
      initialSync={sync}
      initialTeam={team}
      initialRecurrence={recurrence}
      initialReminders={reminders}
      loadError={loadError}
    />
  );
}
