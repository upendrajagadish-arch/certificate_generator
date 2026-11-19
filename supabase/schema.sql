-- Run this once in Supabase → SQL Editor

create table if not exists public.approved_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.issued_certificates (
  email text primary key references public.approved_emails (email) on delete cascade,
  full_name text not null,
  issued_at timestamptz not null default now()
);

alter table public.approved_emails enable row level security;
alter table public.issued_certificates enable row level security;

-- Server uses the service role key (bypasses RLS).
-- No public policies needed for student/admin API routes.
