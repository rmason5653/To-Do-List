"use client";

/** Three stars — click a star to set that priority, click it again to clear it. */
export default function PriorityStars({
  priority,
  onChange,
}: {
  priority: number | null;
  onChange: (p: number | null) => void;
}) {
  return (
    <span className="flex gap-0.5 text-sm">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(priority === n ? null : n)}
          title={`Set priority ${n}`}
          className={`leading-none transition hover:scale-125 ${
            priority != null && n <= priority
              ? "text-mason-yellow"
              : "text-line hover:text-mason-yellow"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
