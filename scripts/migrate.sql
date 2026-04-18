-- Legal Workflow Agent — schema migration
-- Run this in Supabase SQL Editor. Idempotent via DROP IF EXISTS.

drop table if exists research_notes cascade;
drop table if exists hearing_logs cascade;
drop table if exists documents cascade;
drop table if exists deadlines cascade;
drop table if exists cases cascade;
drop table if exists clients cascade;
drop table if exists users cascade;

drop type if exists case_type cascade;
drop type if exists case_phase cascade;
drop type if exists case_status cascade;
drop type if exists court_type cascade;
drop type if exists deadline_type cascade;
drop type if exists urgency cascade;
drop type if exists doc_type cascade;
drop type if exists doc_source cascade;
drop type if exists research_source cascade;

create type case_type as enum ('civil', 'criminal', 'family', 'labour', 'consumer');
create type case_phase as enum ('intake', 'pretrial', 'pleadings', 'charges', 'evidence', 'arguments', 'judgment');
create type case_status as enum ('active', 'stayed', 'disposed', 'appealed');
create type court_type as enum ('district', 'sessions', 'high_court', 'supreme_court', 'tribunal', 'magistrate');
create type deadline_type as enum ('hearing', 'statutory', 'filing', 'compliance', 'limitation');
create type urgency as enum ('critical', 'high', 'medium', 'low');
create type doc_type as enum ('fir', 'bail_app', 'plaint', 'written_statement', 'chargesheet', 'affidavit', 'vakalatnama', 'legal_notice', 'judgment', 'other');
create type doc_source as enum ('uploaded', 'ai_drafted', 'ai_assisted');
create type research_source as enum ('ai_chat', 'indiankanoon', 'manual');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  bar_council_no text,
  phone text,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  aadhar_no text,
  created_at timestamptz not null default now()
);
create index clients_lawyer_idx on clients(lawyer_id);

create table cases (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  case_number text,
  title text not null,
  case_type case_type not null,
  phase case_phase not null default 'intake',
  status case_status not null default 'active',
  court_name text,
  court_type court_type,
  fir_date date,
  fir_number text,
  police_station text,
  sections text,
  offence_max_years int,
  arrest_date date,
  opposing_party text,
  notes text,
  ai_summary text,
  created_at timestamptz not null default now()
);
create index cases_lawyer_idx on cases(lawyer_id);
create index cases_status_idx on cases(status);

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  title text not null,
  deadline_type deadline_type not null,
  due_date date not null,
  urgency urgency,
  is_auto_generated boolean not null default false,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index deadlines_case_idx on deadlines(case_id);
create index deadlines_due_idx on deadlines(due_date) where is_completed = false;

create table documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  doc_type doc_type not null,
  phase case_phase,
  source doc_source not null,
  file_url text,
  content text,
  ai_prompt_used text,
  uploaded_at timestamptz not null default now()
);
create index documents_case_idx on documents(case_id);

create table hearing_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  hearing_date date not null,
  what_happened text not null,
  judge_order text,
  next_date date,
  next_action text,
  created_at timestamptz not null default now()
);
create index hearings_case_idx on hearing_logs(case_id);

create table research_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  query text not null,
  source research_source,
  content text not null,
  citation text,
  tags text[],
  created_at timestamptz not null default now()
);
create index research_case_idx on research_notes(case_id);
