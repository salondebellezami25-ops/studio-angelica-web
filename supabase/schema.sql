-- =========================================================
-- Salón de belleza — esquema Supabase
-- Ejecutar completo en: Supabase > SQL Editor > New query
-- =========================================================

create extension if not exists btree_gist;

-- ---------- Ajustes generales (una sola fila) ----------
create table if not exists settings (
  id            int primary key default 1 check (id = 1),
  salon_name    text not null default 'Studio Angelica',
  tagline       text default 'Belleza con intención. Cuidado con exclusividad.',
  logo_url      text default '/logo-studio-angelica.png',
  hero_url      text,
  about         text,
  address       text,
  maps_query    text,             -- texto o "lat,lng" para el mapa embebido
  phone         text,
  whatsapp      text,             -- solo dígitos con código país, ej. 50760000000
  instagram     text,             -- usuario sin @
  slot_minutes  int  not null default 30,
  min_notice_hours int not null default 2,
  max_days_ahead   int not null default 60,
  policies      jsonb not null default '[]'::jsonb,
  promo_title   text,
  promo_items   jsonb not null default '[]'::jsonb,
  updated_at    timestamptz default now()
);
insert into settings (id) values (1) on conflict do nothing;

-- ---------- Catálogo ----------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order int  not null default 0,
  created_at timestamptz default now()
);

create table if not exists services (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(10,2) not null default 0,
  price_from   boolean not null default false,     -- muestra "desde $"
  duration_min int not null default 60 check (duration_min > 0),
  image_url    text,
  featured     boolean not null default false,     -- etiqueta BESTSELLER
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz default now()
);

create table if not exists gallery (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ---------- Agenda ----------
create table if not exists business_hours (
  weekday    int primary key check (weekday between 0 and 6), -- 0 = domingo
  is_open    boolean not null default true,
  open_time  time not null default '09:00',
  close_time time not null default '18:00'
);
insert into business_hours (weekday, is_open, open_time, close_time) values
  (0,false,'09:00','14:00'),(1,true,'09:00','18:00'),(2,true,'09:00','18:00'),
  (3,true,'09:00','18:00'),(4,true,'09:00','18:00'),(5,true,'09:00','18:00'),
  (6,true,'09:00','15:00')
on conflict do nothing;

create table if not exists blocked_dates (
  day    date primary key,
  reason text
);

create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid references services(id) on delete set null,
  service_name text not null,
  price        numeric(10,2),
  client_name  text not null,
  client_phone text not null,
  client_email text,
  notes        text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       text not null default 'pendiente'
               check (status in ('pendiente','confirmada','completada','cancelada','no_asistio')),
  created_at   timestamptz default now(),
  -- impide dos citas activas que se crucen
  constraint no_overlap exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pendiente','confirmada'))
);
create index if not exists appointments_starts_idx on appointments (starts_at);

-- ---------- RLS ----------
alter table settings       enable row level security;
alter table categories     enable row level security;
alter table services       enable row level security;
alter table gallery        enable row level security;
alter table business_hours enable row level security;
alter table blocked_dates  enable row level security;
alter table appointments   enable row level security;

-- Lectura pública del contenido del sitio
create policy "public read settings"  on settings       for select using (true);
create policy "public read cats"      on categories     for select using (true);
create policy "public read services"  on services       for select using (active or auth.role() = 'authenticated');
create policy "public read gallery"   on gallery        for select using (true);
create policy "public read hours"     on business_hours for select using (true);
create policy "public read blocked"   on blocked_dates  for select using (true);

-- El admin (cualquier usuario autenticado) gestiona todo.
-- Crea el usuario admin en Authentication > Users y desactiva el registro público.
create policy "admin all settings" on settings       for all to authenticated using (true) with check (true);
create policy "admin all cats"     on categories     for all to authenticated using (true) with check (true);
create policy "admin all services" on services       for all to authenticated using (true) with check (true);
create policy "admin all gallery"  on gallery        for all to authenticated using (true) with check (true);
create policy "admin all hours"    on business_hours for all to authenticated using (true) with check (true);
create policy "admin all blocked"  on blocked_dates  for all to authenticated using (true) with check (true);
create policy "admin all appts"    on appointments   for all to authenticated using (true) with check (true);
-- Los clientes NO leen citas: solo ven horas ocupadas vía RPC y reservan vía RPC.

-- ---------- RPC: horas ocupadas de un día (sin datos personales) ----------
create or replace function busy_slots(p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql security definer set search_path = public as $$
  select a.starts_at, a.ends_at from appointments a
  where a.status in ('pendiente','confirmada')
    and a.starts_at < p_to and a.ends_at > p_from;
$$;
grant execute on function busy_slots(timestamptz, timestamptz) to anon, authenticated;

-- ---------- RPC: reservar ----------
create or replace function book_appointment(
  p_service_id uuid, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text, p_notes text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s services; new_id uuid;
begin
  select * into s from services where id = p_service_id and active;
  if not found then raise exception 'Servicio no disponible'; end if;
  if p_starts_at < now() then raise exception 'La hora ya pasó'; end if;
  if length(coalesce(trim(p_name),'')) < 2 or length(coalesce(trim(p_phone),'')) < 7 then
    raise exception 'Nombre y teléfono son obligatorios';
  end if;
  insert into appointments (service_id, service_name, price, client_name, client_phone,
                            client_email, notes, starts_at, ends_at)
  values (s.id, s.name, s.price, trim(p_name), trim(p_phone), nullif(trim(p_email),''),
          nullif(trim(p_notes),''), p_starts_at,
          p_starts_at + make_interval(mins => s.duration_min))
  returning id into new_id;
  return new_id;
exception when exclusion_violation then
  raise exception 'Ese horario acaba de ocuparse, elige otro';
end $$;
grant execute on function book_appointment(uuid, timestamptz, text, text, text, text) to anon, authenticated;

-- ---------- Storage para fotos ----------
insert into storage.buckets (id, name, public) values ('media','media', true)
on conflict do nothing;
create policy "media public read"  on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ---------- Contenido inicial (políticas tomadas de la agenda actual) ----------
update settings set policies = '[
  "No se aceptan acompañantes.",
  "Acude sin maquillaje para no alterar el tiempo de tu cita.",
  "Si existe alguna condición de salud o necesidad específica, infórmala al reservar.",
  "Tolerancia máxima de 15 minutos. Si se excede, la cita podrá reprogramarse.",
  "Para reprogramar, avísanos con al menos 48 horas de anticipación, sujeto a disponibilidad.",
  "Tu cita queda confirmada cuando te escribimos por WhatsApp."
]'::jsonb where id = 1 and policies = '[]'::jsonb;
