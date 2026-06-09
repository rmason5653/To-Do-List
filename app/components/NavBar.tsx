"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PullDialog from "./PullDialog";
import ThemeToggle from "./ThemeToggle";

// admin: only managers/owner see it; cleaners get the focused set.
const LINKS = [
  { href: "/", label: "Home", admin: false },
  { href: "/restock", label: "Restock", admin: false },
  { href: "/central", label: "Central", admin: true },
  { href: "/linens", label: "Linens", admin: true },
  { href: "/log", label: "Pull log", admin: true },
  { href: "/parking", label: "Parking", admin: true },
  { href: "/team", label: "Team", admin: true },
  { href: "/settings", label: "Settings", admin: true },
  { href: "/guide", label: "Guide", admin: false },
];

export default function NavBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  // The login screen is its own full-bleed splash.
  if (pathname === "/login") return null;

  const links = LINKS.filter((l) => !l.admin || isAdmin);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/unit");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-4/85 backdrop-blur-[8px]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5">
          <span className="font-display text-base font-extrabold tracking-[-0.01em] text-ink-primary">
            Par
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Mason Homes
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-control px-3 py-1.5 text-sm font-medium transition duration-150 ease-out ${
                isActive(l.href)
                  ? "bg-surface-2 text-ink-primary"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <PullDialog label="Log pull" />
          <a
            href="/api/logout"
            className="shrink-0 rounded-control px-2 py-1.5 text-xs font-medium text-ink-tertiary transition hover:text-ink-primary"
            title="Log out"
          >
            Log out
          </a>
        </div>
      </div>
    </header>
  );
}
