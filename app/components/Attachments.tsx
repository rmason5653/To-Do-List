"use client";

import type { Attachment } from "@/lib/types";

export function PaperclipIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.49a1.5 1.5 0 0 1-2.12-2.12l7.78-7.78" />
    </svg>
  );
}

function FileGlyph({ className = "h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function formatBytes(n: number | null): string {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** One file tile: an image preview when possible, otherwise a labeled chip.
 *  Works for both saved attachments (signed URL) and pending local files
 *  (object URL). `onRemove` adds a corner delete button. */
export function FileChip({
  name,
  mime,
  size,
  url,
  onRemove,
}: {
  name: string;
  mime: string | null;
  size?: number | null;
  url: string | null;
  onRemove?: () => void;
}) {
  const isImage = !!url && (mime ?? "").startsWith("image/");

  const inner = isImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url!}
      alt={name}
      className="h-16 w-16 rounded-md border border-line object-cover"
    />
  ) : (
    <span className="flex max-w-[12rem] items-center gap-1.5 rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs text-ink">
      <FileGlyph />
      <span className="truncate" title={name}>
        {name}
      </span>
      {size != null && (
        <span className="shrink-0 text-[10px] text-muted">{formatBytes(size)}</span>
      )}
    </span>
  );

  return (
    <div className="relative shrink-0">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${name}`}
          className="block transition hover:opacity-90"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          title="Remove"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-panel text-muted shadow-e1 transition hover:text-mason-red"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** A row of saved attachments with delete controls. */
export function AttachmentGallery({
  items,
  onDelete,
}: {
  items: Attachment[];
  onDelete?: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((a) => (
        <FileChip
          key={a.id}
          name={a.name}
          mime={a.mime}
          size={a.size}
          url={a.url ?? null}
          onRemove={onDelete ? () => onDelete(a.id) : undefined}
        />
      ))}
    </div>
  );
}
