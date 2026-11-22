create table if not exists public.pcc_private_data (
  id text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pcc_private_data enable row level security;

-- Only the server-side service role can access this table through the Data API.
-- No privileges are granted to anon or authenticated roles.
grant select, insert, update, delete on table public.pcc_private_data to service_role;
