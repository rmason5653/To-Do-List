# Par

_Mason Homes inventory tracker._

Tracks inventory across every Mason Homes unit and the central storage reserve,
and logs every movement from central. Two problems, one app: it **prevents
items walking off** (every central pull is logged with a reason) and gives
**total visibility** (par vs actual across every unit and the central reserve
in one place).

## The core model

> Consumables live in owner's closets and draw down every turnover, refilled
> weekly from central. Linens cycle on site at each unit and only move from
> central when damaged. Both have a par per unit and a central backup reserve,
> and every central pull is logged.

Four tracked things:

- **Consumables** — par per closet, placed out each turnover, refilled to par on
  the weekly restock run. Hitting reorder flags the unit for restock.
- **Linens** — a flat set that cycles on site. Actual below par signals a
  damaged/lost/stolen linen and triggers a logged replacement pull.
- **Parking passes** — confirmed present each turnover, flagged when missing.
- **Central pull log** — every item pulled from central: item, qty, unit,
  reason, date, who. The anti-theft and reconciliation backbone.

## The screens

| Screen | What it's for |
| --- | --- |
| **Home** | Every unit at a glance + portfolio KPIs. Tap a unit to clean it. |
| **Unit** (clean flow) | Confirm parking, tap consumables now at/below reorder, confirm or flag linens, mark complete. Two taps, not a form. |
| **Restock** (View 1) | The weekly work list: every unit below reorder and the exact quantity to bring each closet back to par. One tap refills a unit and logs each transfer. |
| **Central** (View 2) | Bulk stock of every consumable and linen; flags anything at/below its reorder point. Receive stock and tune reorder points here. |
| **Linens** (View 3) | Par vs actual linens for every unit. Anything below par lights up — loss detection. Replace a short linen with a logged pull in one tap. |
| **Pull log** (View 4) | Running audit trail of every central pull, filterable by restock vs linen exception. |
| **Parking** (View 5) | Which units have their passes accounted for; flag any missing. |

## Stack

- **Next.js** (App Router) — UI + API route handlers, deploys as one app
- **Supabase Postgres** — source of truth; atomic pulls/restocks via SQL functions
- **Tailwind** — styled to the Mason Design System v4 (midnight, restrained, heavy)
- **Vercel** — hosting

## Setup

### 1. Database (Supabase) — required

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the tables, the `log_pull` / `restock_unit` functions, and seeds
   the portfolio (10 properties, 8 consumables, 5 linen types, parking passes).
3. From **Project Settings → API**, copy the **Project URL** and the
   **`service_role`** key.

> The central reserve quantities in the seed are sensible starting numbers.
> Set them to your real bulk counts on the **Central** screen.

### 2. Deploy (Vercel)

1. Import this repository at [vercel.com](https://vercel.com).
2. Add the environment variables below.
3. Deploy.

### 3. Environment variables

See [`.env.example`](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service role key |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Open <http://localhost:3000>.
