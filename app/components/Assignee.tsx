"use client";

import type { TeamMember } from "@/lib/types";

/** Two-letter initials from a display name, ignoring any "(nickname)" part. */
export function memberInitials(name: string): string {
  const parts = name
    .replace(/\(.*?\)/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ member }: { member: TeamMember }) {
  if (member.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={member.avatar}
        alt=""
        className="h-4 w-4 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mason-red text-[8px] font-bold text-white">
      {memberInitials(member.name)}
    </span>
  );
}

/** Small avatar + name pill shown on a task row. */
export function AssigneeTag({ member }: { member: TeamMember }) {
  return (
    <span
      title={member.email ? `${member.name} · ${member.email}` : member.name}
      className="flex w-fit items-center gap-1.5 rounded-full border border-line bg-panel2 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-ink"
    >
      <Avatar member={member} />
      <span className="max-w-[6.5rem] truncate">{member.name}</span>
    </span>
  );
}

/** A <select> of workspace members for assigning a task. */
export function AssigneePicker({
  team,
  value,
  onChange,
  className = "field",
  unassignedLabel = "Unassigned",
}: {
  team: TeamMember[];
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
  unassignedLabel?: string;
}) {
  // An assignee that isn't in the directory yet (e.g. a deactivated member)
  // is still listed so the control stays controlled.
  const known = !value || team.some((m) => m.id === value);
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={className}
    >
      <option value="">{unassignedLabel}</option>
      {team.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
      {!known && <option value={value as string}>{value}</option>}
    </select>
  );
}
