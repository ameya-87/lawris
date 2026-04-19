-- Lawris: notifications + Google Calendar integration (additive migration).
-- Run in Supabase SQL editor AFTER migrate.sql. Safe to re-run.
-- DOES NOT touch existing tables, RAG tables, or any AI-related schema.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  case_id uuid references cases(id) on delete cascade,
  source_type text,               -- 'deadline' | 'hearing' | 'document' | 'manual'
  source_id uuid,
  type text not null,             -- 'upcoming_hearing' | 'deadline_approaching' | 'document_required' | 'document_missing' | 'reminder_overdue' | 'stage_followup'
  title text not null,
  message text,
  urgency text not null default 'medium',  -- critical | high | medium | low
  due_at timestamptz,
  status text not null default 'unread',   -- unread | read | dismissed
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate notifications for the same source event + type.
create unique index if not exists notifications_source_unique_idx
  on notifications(user_id, coalesce(source_type, ''), coalesce(source_id, '00000000-0000-0000-0000-000000000000'::uuid), type);

create index if not exists notifications_user_status_idx on notifications(user_id, status);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);

create table if not exists calendar_tokens (
  user_id uuid primary key references users(id) on delete cascade,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  token_type text default 'Bearer',
  scope text,
  expiry_date timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deadline_id uuid not null references deadlines(id) on delete cascade,
  provider text not null default 'google',
  google_event_id text,
  status text not null default 'pending',   -- pending | syncing | synced | failed
  last_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, deadline_id, provider)
);
create index if not exists calendar_sync_user_idx on calendar_sync(user_id);
create index if not exists calendar_sync_deadline_idx on calendar_sync(deadline_id);
