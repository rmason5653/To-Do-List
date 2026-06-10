"use client";

// Pick who's doing the work from the team roster instead of typing a name
// every time. If the current value isn't in the roster (e.g. the shared-
// password owner, or a removed member), it's still shown as a valid option so
// nobody gets stuck with a blank selection.
export default function StaffSelect({
  value,
  onChange,
  names,
  className = "",
  ariaLabel = "Your name",
}: {
  value: string;
  onChange: (v: string) => void;
  names: string[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={className}
    >
      <option value="" disabled>
        Select your name
      </option>
      {names.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      {value && !names.includes(value) && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
}
