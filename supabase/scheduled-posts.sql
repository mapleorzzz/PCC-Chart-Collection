create table if not exists public.pcc_private_data (
  id text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pcc_private_data enable row level security;

-- Intentionally create no anon/authenticated policies.
-- The server-side service_role key bypasses RLS and must never be exposed to browsers.
