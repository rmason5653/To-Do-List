-- Mason Homes Inventory Tracker — schema + seed.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent tables);
-- the seed block only runs when the units table is empty.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- UNITS: one row per property line in the spec's reference tables. A property
-- with a shared par is a single row (name "... (all units)"); specific units
-- (Riviera 105/203/208, the 616 house) are their own rows.
create table if not exists units (
  unit_id              uuid primary key default gen_random_uuid(),
  name                 text not null,                  -- "Riviera 105"
  property_name        text not null,                  -- "Riviera" (grouping)
  sort                 int  not null default 0,
  parking_pass_label   text not null default 'None',   -- None | 1 pass | 2 passes | Card
  has_parking_pass     boolean not null default false, -- false when label is None
  parking_status       text not null default 'na',     -- ok | missing | na
  parking_confirmed_at timestamptz,
  last_cleaned_at      timestamptz,
  created_at           timestamptz not null default now()
);

-- CONSUMABLE PAR: per unit, per item. current_actual is the cleaner's signal.
-- par = leave_behind * 4; reorder_point = one leave_behind.
create table if not exists consumable_par (
  id             uuid primary key default gen_random_uuid(),
  unit_id        uuid not null references units(unit_id) on delete cascade,
  item_name      text not null,
  sort           int  not null default 0,
  leave_behind   int  not null,
  closet_par     int  not null,
  reorder_point  int  not null,
  current_actual int  not null,
  updated_at     timestamptz not null default now(),
  unique (unit_id, item_name)
);

-- LINEN PAR: per unit, per type. Should stay flat; actual < par signals loss.
create table if not exists linen_par (
  id             uuid primary key default gen_random_uuid(),
  unit_id        uuid not null references units(unit_id) on delete cascade,
  linen_type     text not null,  -- bath_towel | washcloth | hand_towel | makeup_towel | kitchen_towel
  sort           int  not null default 0,
  par_count      int  not null,
  current_actual int  not null,
  updated_at     timestamptz not null default now(),
  unique (unit_id, linen_type)
);

-- CENTRAL RESERVE: bulk backup for consumables and linens. For consumables,
-- item_name matches consumable_par.item_name. For linens, item_name is the
-- linen_type key.
create table if not exists central_reserve (
  id               uuid primary key default gen_random_uuid(),
  item_name        text not null,
  category         text not null,            -- consumable | linen
  sort             int  not null default 0,
  quantity_on_hand int  not null default 0,
  reorder_point    int  not null default 0,  -- when to buy more bulk
  updated_at       timestamptz not null default now(),
  unique (item_name, category)
);

-- CENTRAL PULL LOG: every movement from central. The anti-theft backbone.
create table if not exists central_pull_log (
  id                  uuid primary key default gen_random_uuid(),
  pulled_at           timestamptz not null default now(),
  staff_name          text not null,
  item_name           text not null,
  category            text not null,           -- consumable | linen
  quantity            int  not null,
  destination_unit_id uuid references units(unit_id) on delete set null,
  destination_name    text,                    -- snapshot so the audit trail survives unit edits
  reason              text not null            -- weekly_restock | damage_replacement | stain_out
);

-- CLEAN LOG: a record of each completed clean (who, when, parking + linens ok).
create table if not exists clean_log (
  id           uuid primary key default gen_random_uuid(),
  completed_at timestamptz not null default now(),
  unit_id      uuid references units(unit_id) on delete cascade,
  staff_name   text,
  parking_ok   boolean,
  linens_ok    boolean
);

create index if not exists consumable_par_unit_idx on consumable_par (unit_id);
create index if not exists linen_par_unit_idx       on linen_par (unit_id);
create index if not exists pull_log_pulled_idx      on central_pull_log (pulled_at desc);
create index if not exists clean_log_unit_idx       on clean_log (unit_id, completed_at desc);

-- Lock the tables down. The app uses the service-role key (which bypasses RLS),
-- so enabling RLS with no policies keeps anon/auth clients out entirely.
alter table units             enable row level security;
alter table consumable_par    enable row level security;
alter table linen_par         enable row level security;
alter table central_reserve   enable row level security;
alter table central_pull_log  enable row level security;
alter table clean_log         enable row level security;

-- ---------------------------------------------------------------------------
-- FUNCTIONS (atomic inventory movements)
-- ---------------------------------------------------------------------------

-- Log a single pull from central: write the log row, draw down the reserve,
-- and restore the destination unit's item to par.
create or replace function log_pull(
  p_staff    text,
  p_item     text,
  p_category text,
  p_qty      int,
  p_unit     uuid,
  p_reason   text
) returns void
language plpgsql
as $$
declare
  v_unit_name text;
begin
  select name into v_unit_name from units where unit_id = p_unit;

  update central_reserve
     set quantity_on_hand = greatest(0, quantity_on_hand - p_qty),
         updated_at = now()
   where item_name = p_item and category = p_category;

  if p_category = 'consumable' then
    update consumable_par
       set current_actual = closet_par, updated_at = now()
     where unit_id = p_unit and item_name = p_item;
  elsif p_category = 'linen' then
    update linen_par
       set current_actual = par_count, updated_at = now()
     where unit_id = p_unit and linen_type = p_item;
  end if;

  insert into central_pull_log
    (staff_name, item_name, category, quantity, destination_unit_id, destination_name, reason)
  values
    (p_staff, p_item, p_category, p_qty, p_unit, v_unit_name, p_reason);
end;
$$;

-- Run the weekly restock for one unit: refill every below-reorder consumable to
-- par, drawing down central and logging each transfer. Returns the item count.
create or replace function restock_unit(
  p_staff text,
  p_unit  uuid
) returns int
language plpgsql
as $$
declare
  r           record;
  v_needed    int;
  v_count     int := 0;
  v_unit_name text;
begin
  select name into v_unit_name from units where unit_id = p_unit;

  for r in
    select * from consumable_par
     where unit_id = p_unit and current_actual <= reorder_point
  loop
    v_needed := r.closet_par - r.current_actual;
    if v_needed <= 0 then
      continue;
    end if;

    update central_reserve
       set quantity_on_hand = greatest(0, quantity_on_hand - v_needed),
           updated_at = now()
     where item_name = r.item_name and category = 'consumable';

    update consumable_par
       set current_actual = closet_par, updated_at = now()
     where id = r.id;

    insert into central_pull_log
      (staff_name, item_name, category, quantity, destination_unit_id, destination_name, reason)
    values
      (p_staff, r.item_name, 'consumable', v_needed, p_unit, v_unit_name, 'weekly_restock');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- SEED (only when empty)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from units) then
    return;
  end if;

  -- Units (property reference + parking pass tables).
  insert into units (name, property_name, sort, parking_pass_label, has_parking_pass, parking_status) values
    ('616 58th St S (house)', '616 58th St S', 1, 'None',     false, 'na'),
    ('Artisan (all units)',   'Artisan',       2, 'None',     false, 'na'),
    ('Art House (all units)', 'Art House',      3, 'None',     false, 'na'),
    ('Clairview (all units)', 'Clairview',      4, '2 passes', true,  'ok'),
    ('Highland (all units)',  'Highland',       5, '1 pass',   true,  'ok'),
    ('Forest Park (all units)','Forest Park',   6, '1 pass',   true,  'ok'),
    ('Frank (all units)',     'Frank',          7, 'Card',     true,  'ok'),
    ('Riviera 105',           'Riviera',        8, '2 passes', true,  'ok'),
    ('Riviera 203',           'Riviera',        9, '1 pass',   true,  'ok'),
    ('Riviera 208',           'Riviera',       10, '1 pass',   true,  'ok');

  -- Consumable par — same tier for every unit. current_actual starts at par.
  insert into consumable_par (unit_id, item_name, sort, leave_behind, closet_par, reorder_point, current_actual)
  select u.unit_id, c.item_name, c.sort, c.leave_behind, c.closet_par, c.reorder_point, c.closet_par
  from units u
  cross join (values
    ('Kitchen trash bags',   1, 3, 12, 3),
    ('Paper towel',          2, 2,  8, 2),
    ('Dishwasher pods',      3, 3, 12, 3),
    ('Laundry pods',         4, 5, 20, 5),
    ('Bathroom trash bags',  5, 3, 12, 3),
    ('Toilet paper',         6, 3, 12, 3),
    ('Coffee pods',          7, 5, 20, 5),
    ('Creamer',              8, 5, 20, 5)
  ) as c(item_name, sort, leave_behind, closet_par, reorder_point);

  -- Linen par — varies by property. current_actual starts matching par.
  -- Profile A (4/4/1/1/1): Artisan, Highland, Forest Park, Frank, Riviera 203, Riviera 208
  insert into linen_par (unit_id, linen_type, sort, par_count, current_actual)
  select u.unit_id, l.linen_type, l.sort, l.par, l.par
  from units u
  cross join (values
    ('bath_towel',1,4),('washcloth',2,4),('hand_towel',3,1),('makeup_towel',4,1),('kitchen_towel',5,1)
  ) as l(linen_type, sort, par)
  where u.name in ('Artisan (all units)','Highland (all units)','Forest Park (all units)',
                   'Frank (all units)','Riviera 203','Riviera 208');

  -- Profile B (5/5/2/2/1): Art House, Clairview, Riviera 105
  insert into linen_par (unit_id, linen_type, sort, par_count, current_actual)
  select u.unit_id, l.linen_type, l.sort, l.par, l.par
  from units u
  cross join (values
    ('bath_towel',1,5),('washcloth',2,5),('hand_towel',3,2),('makeup_towel',4,2),('kitchen_towel',5,1)
  ) as l(linen_type, sort, par)
  where u.name in ('Art House (all units)','Clairview (all units)','Riviera 105');

  -- 616 house (7/7/1/1/1)
  insert into linen_par (unit_id, linen_type, sort, par_count, current_actual)
  select u.unit_id, l.linen_type, l.sort, l.par, l.par
  from units u
  cross join (values
    ('bath_towel',1,7),('washcloth',2,7),('hand_towel',3,1),('makeup_towel',4,1),('kitchen_towel',5,1)
  ) as l(linen_type, sort, par)
  where u.name = '616 58th St S (house)';

  -- Central reserve. Starting bulk levels — edit these to your real counts.
  -- Consumable reorder ~ one turnover of leave-behind across all 10 units.
  insert into central_reserve (item_name, category, sort, quantity_on_hand, reorder_point) values
    ('Kitchen trash bags',  'consumable', 1, 90,  30),
    ('Paper towel',         'consumable', 2, 60,  20),
    ('Dishwasher pods',     'consumable', 3, 90,  30),
    ('Laundry pods',        'consumable', 4, 150, 50),
    ('Bathroom trash bags', 'consumable', 5, 90,  30),
    ('Toilet paper',        'consumable', 6, 90,  30),
    ('Coffee pods',         'consumable', 7, 150, 50),
    ('Creamer',             'consumable', 8, 150, 50),
    ('bath_towel',          'linen',      9, 12,  4),
    ('washcloth',           'linen',     10, 12,  4),
    ('hand_towel',          'linen',     11,  6,  2),
    ('makeup_towel',        'linen',     12,  6,  2),
    ('kitchen_towel',       'linen',     13,  6,  2);
end $$;
