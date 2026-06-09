import Link from "next/link";
import { Container, PageHeader } from "@/app/components/ui";

export const dynamic = "force-static";

// A standalone, no-login-needed walkthrough for cleaners. Mirrors the real
// in-app labels so the steps match what they see.

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red text-xs font-bold text-bone">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-ink-secondary">{children}</span>
    </li>
  );
}

function Card({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface-2 p-5 shadow-e1">
      {kicker && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          {kicker}
        </p>
      )}
      <h2 className="mt-0.5 font-display text-lg font-bold text-bone">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Inline reference to a button/label in the app. */
function B({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[4px] border border-line-strong bg-surface-3 px-1.5 py-0.5 text-xs font-semibold text-ink-primary">
      {children}
    </span>
  );
}

export default function GuidePage() {
  return (
    <Container>
      <PageHeader eyebrow="How to use Par" title="Cleaner guide">
        <Link
          href="/"
          className="rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm font-semibold text-ink-secondary transition hover:border-red hover:text-bone"
        >
          ← Back to units
        </Link>
      </PageHeader>

      <div className="space-y-4">
        {/* The big idea */}
        <Card kicker="Start here" title="Two kinds of inventory, two rules">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control bg-surface-1 p-4">
              <p className="font-display text-sm font-bold text-gold">Consumables</p>
              <p className="mt-1 text-xs text-ink-muted">
                Toilet paper, paper towels, trash bags, pods, coffee, creamer.
              </p>
              <p className="mt-2 text-sm text-ink-secondary">
                Live in the unit&apos;s owner closet. They run <b>down</b> every
                turnover. You <b>flag</b> the low ones — they get refilled from
                central on the <b>weekly restock run</b>, not every clean.
              </p>
            </div>
            <div className="rounded-control bg-surface-1 p-4">
              <p className="font-display text-sm font-bold text-[#5FCB8A]">Linens</p>
              <p className="mt-1 text-xs text-ink-muted">
                Bath towels, washcloths, hand / makeup / kitchen towels.
              </p>
              <p className="mt-2 text-sm text-ink-secondary">
                Stay <b>at the unit</b>, washed on site. They should never run
                low. Only pull from central when one is <b>damaged, stained, or
                missing</b>.
              </p>
            </div>
          </div>
          <p className="mt-3 rounded-control border border-[rgba(245,184,0,.3)] bg-gold-subtle px-3 py-2 text-sm text-gold">
            Golden rule: anything you take out of central, log it in the app.
            That keeps every count honest.
          </p>
        </Card>

        {/* Every clean */}
        <Card kicker="Do this at every unit" title="The 30-second clean routine">
          <ol className="space-y-3">
            <Step n={1}>
              On <B>Home</B>, tap the <b>unit</b> you&apos;re cleaning.
            </Step>
            <Step n={2}>
              <b>Parking pass</b> — tap <B>Present</B> (or <B>Missing</B> if
              it&apos;s gone).
            </Step>
            <Step n={3}>
              <b>Consumables</b> — after you set out the leave-behind items, tap
              anything at or below its reorder line so it turns gold:{" "}
              <B>Needs restock</B>. Leave the rest on <B>OK</B>.
            </Step>
            <Step n={4}>
              <b>Linens</b> — if every towel is there and clean, tap{" "}
              <B>All match par</B>. If one&apos;s damaged/stained/missing, tap{" "}
              <B>Flag an issue</B> and set the real count with −/+.
            </Step>
            <Step n={5}>
              Type your <b>name</b> (first time only) → tap{" "}
              <B>Mark clean complete</B>.
            </Step>
          </ol>
          <p className="mt-3 text-xs text-ink-muted">
            You do <b>not</b> drive to central for one low item — flagging is
            enough.
          </p>
        </Card>

        {/* Weekly restock */}
        <Card kicker="Once a week" title="The restock run — refill every closet in one trip">
          <ol className="space-y-3">
            <Step n={1}>
              Tap <B>Restock</B> in the top menu.
            </Step>
            <Step n={2}>
              The <B>Pull from central</B> list totals everything every unit
              needs — one shopping list. A red <B>central short</B> flag means
              buy more of that item first.
            </Step>
            <Step n={3}>
              Go to central <b>once</b>, grab everything on the list, load up.
            </Step>
            <Step n={4}>
              Drive to each unit and refill its closet up to par.
            </Step>
            <Step n={5}>
              In the app, type your name and tap <B>Refill to par</B> on each
              unit — or <B>Refill all to par</B> to clear the whole list.
            </Step>
          </ol>
          <p className="mt-3 text-sm text-ink-secondary">
            That one tap refills the unit, subtracts what you took from central,
            and logs the pull — automatically. You never type numbers.
          </p>
        </Card>

        {/* Damaged linen */}
        <Card kicker="When a towel is bad" title="Replace a damaged or missing linen">
          <ol className="space-y-3">
            <Step n={1}>
              During the clean, under <b>Linens</b>, tap <B>Flag an issue</B> and
              lower the count for the bad towel. Complete the clean.
            </Step>
            <Step n={2}>Go to central and grab a replacement.</Step>
            <Step n={3}>
              Open the unit → tap <B>Pull from central</B> (top of the page).
              It&apos;s pre-filled to that unit. Pick the towel, quantity, reason{" "}
              <B>Damage replacement</B> or <B>Stain out</B> → <B>Log pull</B>.
            </Step>
            <Step n={4}>
              Take it back to the unit. The app sets that unit back to par and
              subtracts 1 from central.
            </Step>
          </ol>
          <p className="mt-3 text-xs text-ink-muted">
            Shortcut: on the <B>Linens</B> screen, a short unit has a{" "}
            <B>Replace</B> button that opens this pre-filled.
          </p>
        </Card>

        {/* Urgent consumable */}
        <Card kicker="When it can't wait" title="Refill a unit from central right now">
          <ol className="space-y-3">
            <Step n={1}>Go to central and grab the item(s).</Step>
            <Step n={2}>
              Open the unit → <B>Pull from central</B> (or <B>Log pull</B> in the
              top bar). Pick the item, quantity, reason <B>Weekly restock</B> →{" "}
              <B>Log pull</B>.
            </Step>
            <Step n={3}>
              Take it back. The app refills the unit to par and draws down
              central.
            </Step>
          </ol>
          <p className="mt-3 rounded-control border border-[rgba(226,6,2,.3)] bg-red-subtle px-3 py-2 text-xs text-[#FF6B68]">
            Don&apos;t double up: on the weekly run use <B>Refill to par</B> (it
            logs the pull for you). Use <B>Log pull</B> only for one-off and
            linen pulls — not both for the same item.
          </p>
        </Card>

        {/* Colors */}
        <Card kicker="Reading the app" title="What the colors mean">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-gold" />
              <span className="text-ink-secondary">
                <b className="text-gold">Gold</b> — needs attention / restock
                soon.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-red" />
              <span className="text-ink-secondary">
                <b className="text-[#FF6B68]">Red</b> — a problem: missing towel,
                missing parking pass, or central can&apos;t cover the run.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-green" />
              <span className="text-ink-secondary">
                <b className="text-[#5FCB8A]">Green</b> — good / at par.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </Container>
  );
}
