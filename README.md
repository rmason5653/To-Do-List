# Punch List

A daily task hub that keeps your **Slack Ops List** and your **personal
to-dos** in one clean dashboard. Ops tasks sync two-way with the native Slack
List; personal tasks stay private to this app.

The dashboard sorts everything into **Overdue / Today / This week / Later /
Anytime** so nothing slips, and shows live counts for what's overdue, due
today, and completed today.

## Stack

- **Next.js** (App Router) — UI + API routes, deploys as one app
- **Supabase Postgres** — source of truth for all tasks
- **Slack Lists API** — two-way sync with the Ops List
- **Vercel** — hosting

## How sync works

- **App → Slack:** every edit pushes to the Slack List immediately.
- **Slack → App:** the open dashboard polls every 60s; a daily Vercel cron
  catches anything missed; an optional Slack webhook makes it instant.
- **Conflicts:** an unsynced local edit wins and is pushed; otherwise Slack's
  value is accepted. Failed pushes retry automatically on the next sync.
- **Deletes:** deleting an ops task in the app removes its Slack row; deleting
  a row in Slack removes the matching task on the next sync. A failed delete is
  tombstoned and retried, so a deleted row is never silently re-imported.
- The app runs fully as a standalone to-do app even with Slack disconnected.

## Setup

### 1. Database (Supabase) — required

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. From **Project Settings → API**, copy the **Project URL** and the
   **`service_role`** key.

### 2. Deploy (Vercel)

1. Import this repository at [vercel.com](https://vercel.com).
2. Add the environment variables below.
3. Deploy. The cron in `vercel.json` is registered automatically.

### 3. Environment variables

See [`.env.example`](.env.example). Minimum to run:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service role key |
| `APP_PASSWORD` | strongly advised | Password gate for the public URL |
| `SLACK_TOKEN` | for sync | Slack user token (`xoxp-…`) |
| `SLACK_LIST_ID` | for sync | Ops List file id (default `F09FSF0BD89`) |
| `SLACK_SIGNING_SECRET` | optional | Enables the instant Slack webhook |
| `CRON_SECRET` | optional | Locks the daily cron endpoint |

### 4. Slack two-way sync (optional but recommended)

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
   → **From scratch** → choose your workspace.
2. Under **OAuth & Permissions**, add these **User Token Scopes**:
   `lists:read`, `lists:write`, `files:read`, `users:read`, `users:read.email`.
3. **Install to Workspace** and copy the **User OAuth Token** (`xoxp-…`) into
   `SLACK_TOKEN`.
4. Make sure the Ops List is `F09FSF0BD89` (or set `SLACK_LIST_ID`).
5. Open the dashboard and click **Sync now** — your Ops List imports on the
   first run.

**Instant inbound (optional):** under **Event Subscriptions**, set the Request
URL to `https://YOUR-APP.vercel.app/api/slack/events`, then copy the app's
**Signing Secret** into `SLACK_SIGNING_SECRET`.

> The Slack Lists API is newer than the rest of the Slack API. Column mapping
> is discovered automatically by name (Task, Status, Priority, Description,
> Assignee, Due date, Completed). If a sync error shows in the dashboard's
> sync bar, it names the failing call so the mapping can be adjusted.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Open <http://localhost:3000>.
