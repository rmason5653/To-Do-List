"use client";

// Filled stars are colored by urgency level (3 = red, 2 = gold, 1 = bone),
// mirroring the Slack 1–3 star rating. SVG, not a glyph, so it stays crisp
// and themeable.
function starColor(level: number): string {
  return level >= 3 ? "text-mason-red" : level === 2 ? "text-mason-gold" : "text-ink";
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 1.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.88l-5.2 2.73.99-5.79L1.58 7.72l5.82-.85L10 1.6z" />
    </svg>
  );
}

/** Three stars — click a star to set that priority, click it again to clear it. */
export default function PriorityStars({
  priority,
  onChange,
}: {
  priority: number | null;
  onChange: (p: number | null) => void;
}) {
  const level = priority ?? 0;
  return (
    <span
      className="flex items-center gap-1.5 sm:gap-0.5"
      role="group"
      aria-label="Priority"
    >
      {[1, 2, 3].map((n) => {
        const on = priority != null && n <= priority;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Set priority ${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={priority === n}
            onClick={() => onChange(priority === n ? null : n)}
            title={`Set priority ${n}`}
            className="rounded-sm p-1.5 leading-none transition hover:scale-125 sm:p-0.5"
          >
            <StarIcon
              className={`h-5 w-5 sm:h-4 sm:w-4 ${on ? starColor(level) : "text-line hover:text-mason-gold"}`}
            />
          </button>
        );
      })}
    </span>
  );
}
