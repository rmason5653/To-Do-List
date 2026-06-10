import { redirect } from "next/navigation";
import { getAuthUserByToken } from "@/lib/users-db";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

// The invite link. First visit lets the user create their password; after that
// it just sends them to the login screen.
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let user: Awaited<ReturnType<typeof getAuthUserByToken>> = null;
  try {
    user = await getAuthUserByToken(token);
  } catch {
    redirect("/login?e=invite");
  }

  if (!user || user.status !== "active") redirect("/login?e=invite");
  if (user.password_hash) redirect("/login?e=set");

  return <SetupForm token={token} name={user.name} />;
}
