-- Create market_data table for global variables (Key-Value Store)
-- Updated to match the new schema requirements
create table if not exists public.market_data (
  key text primary key,
  value jsonb not null, -- Keeping column name 'value' for standard KV store practice. The TS code adapter handles it.
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.market_data enable row level security;

-- Policy: Allow public read access
create policy "Allow public read access"
  on public.market_data
  for select
  using (true);

-- Insert Initial Data (Updated to match Audit V2 User Schema)

-- 1. BT01 Index
insert into public.market_data (key, value)
values (
  'bt01',
  '{
    "currentValue": 133.3,
    "annualChangePercent": 1.37,
    "referenceMonth": "2025-11",
    "source": "INSEE"
  }'::jsonb
)
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- 2. Market Trend (market_trend) - Note key change from 'trends' to 'market_trend'
insert into public.market_data (key, value)
values (
  'market_trend',
  '{
    "national": -0.004,
    "idf": -0.013,
    "province": 0.001,
    "comment": "Notaires de France T4 2025"
  }'::jsonb
)
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- 3. Passoires Energetiques (passoires)
insert into public.market_data (key, value)
values (
  'passoires',
  '{
    "shareOfSales": 0.15,
    "trendVs2023": -0.02,
    "source": "Notaires DP 08.12.2025"
  }'::jsonb
)
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- 4. Regulation Status (regulation)
insert into public.market_data (key, value)
values (
  'regulation',
  '{
    "isLdF2026Voted": false,
    "isMprCoproSuspended": true,
    "suspensionDate": "2026-01-01",
    "comment": "Loi spéciale 26/12/2025 - Attente LdF"
  }'::jsonb
)
on conflict (key) do update
set value = excluded.value, updated_at = now();
