import { listUsers } from "@/lib/users-db";
import { Container, PageHeader, SetupNotice } from "@/app/components/ui";
import type { AppUser } from "@/lib/types";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  let users: AppUser[] = [];
  let loadError: string | null = null;
  try {
    users = await listUsers();
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <Container>
      <PageHeader eyebrow="Admin" title="Team" />
      {loadError ? (
        <SetupNotice message={loadError} />
      ) : (
        <TeamClient users={users} />
      )}
    </Container>
  );
}
