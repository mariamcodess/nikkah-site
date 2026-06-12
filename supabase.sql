create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  attendance text not null check (attendance in ('attending', 'not_attending')),
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- This site writes and reads RSVPs through serverless API routes using
-- SUPABASE_SERVICE_ROLE_KEY, so no public client policy is required.
