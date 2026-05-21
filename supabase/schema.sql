-- Ops To-Do schema. Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists tasks (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  status         text not null default 'not_started',  -- not_started | in_progress | done
  priority       int,                                  -- 0..3, null = none
  assignee       text,
  due_date       date,
  completed      boolean not null default false,
  category       text not null default 'ops',          -- ops | personal
  slack_item_id  text unique,                          -- row id in the Slack List
  position       double precision not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_synced_at timestamptz
);

create index if not exists tasks_category_idx on tasks (category);
create index if not exists tasks_status_idx   on tasks (status);
create index if not exists tasks_due_idx      on tasks (due_date);

-- Small key/value store for sync status and other app metadata.
create table if not exists app_meta (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

-- The app talks to Supabase with a single key used server-side only, behind
-- the app's own password gate. Open the two tables to that key so either a
-- service_role key or a publishable/anon key works.
alter table tasks    disable row level security;
alter table app_meta disable row level security;
grant select, insert, update, delete on tasks, app_meta to anon;
