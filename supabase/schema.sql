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

-- Files/images attached to a task. The bytes live in the `task-files` storage
-- bucket; this table is the index. Deleting a task cascades its rows here (the
-- app also clears the storage objects).
create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  name        text not null,
  path        text not null,
  mime        text,
  size        bigint,
  created_at  timestamptz not null default now()
);

create index if not exists attachments_task_idx on attachments (task_id);

-- Private bucket for task files. The app reads/writes it server-side and hands
-- the browser short-lived signed URLs, so it stays non-public.
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', false)
on conflict (id) do nothing;

-- Mirror the app's "either service-role or anon key works" model for storage:
-- service-role bypasses RLS; this grants the anon role the same access, scoped
-- to just this bucket. The bucket is still non-public (no anonymous web URLs).
drop policy if exists "task_files_anon_all" on storage.objects;
create policy "task_files_anon_all" on storage.objects
  for all to anon
  using (bucket_id = 'task-files')
  with check (bucket_id = 'task-files');

-- The app talks to Supabase with a single key used server-side only, behind
-- the app's own password gate. Open the two tables to that key so either a
-- service_role key or a publishable/anon key works.
alter table tasks       disable row level security;
alter table app_meta    disable row level security;
alter table attachments disable row level security;
grant select, insert, update, delete on tasks, app_meta, attachments to anon;
