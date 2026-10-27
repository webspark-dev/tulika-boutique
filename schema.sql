-- Tulika boutique schema. Run in Supabase SQL Editor.
-- তুলিকা ডেটাবেস। প্রথম admin user তৈরি করে তার UUID admins-এ যোগ করুন।
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  name_bn text not null check (length(name_bn) between 1 and 100),
  name_en text not null check (length(name_en) between 1 and 100),
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,100}$'),
  name_bn text not null check (length(name_bn) between 1 and 200),
  name_en text not null check (length(name_en) between 1 and 200),
  description_bn text not null default '',
  description_en text not null default '',
  price numeric(12,2) not null check (price >= 0),
  discount_price numeric(12,2) check (discount_price >= 0 and discount_price < price),
  is_new boolean not null default false,
  featured boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique check (storage_path !~ '^/' and position('..' in storage_path)=0),
  alt_bn text not null default '',
  alt_en text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (length(size) between 1 and 40),
  stock integer not null default 0 check (stock >= 0),
  unique(product_id, size)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null check (length(customer_name) between 1 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  address text not null check (length(address) between 5 and 500),
  city text not null check (length(city) between 1 and 100),
  pin_code text not null check (pin_code ~ '^[0-9]{6}$'),
  notes text not null default '' check (length(notes) <= 1000),
  payment_method text not null check (payment_method in ('cod','upi_manual')),
  status text not null default 'new' check (status in ('new','confirmed','packed','shipped','delivered','cancelled')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_charge numeric(12,2) not null check (shipping_charge >= 0),
  total numeric(12,2) not null check (total = subtotal + shipping_charge),
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_phone_created_idx on public.orders(phone, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total = unit_price * quantity)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(customer_name) between 1 and 100),
  text_bn text not null check (length(text_bn) between 1 and 1000),
  text_en text not null default '',
  rating smallint not null default 5 check (rating between 1 and 5),
  visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id boolean primary key default true check (id),
  boutique_name text not null default 'তুলিকা',
  tagline_bn text not null default 'নিজস্বতা, বুনন আর রঙের গল্প।',
  tagline_en text not null default 'Stories in color and weave.',
  about_bn text not null default '',
  about_en text not null default '',
  address text not null default '১২, গড়িয়াহাট রোড, কলকাতা ৭০০০১৯',
  phone text not null default '+91 98765 43210',
  whatsapp_number text not null default '919876543210',
  hours_bn text not null default 'সোম–শনি · সকাল ১১টা–রাত ৮টা',
  hours_en text not null default 'Mon–Sat · 11 am–8 pm',
  shipping_charge numeric(10,2) not null default 80 check (shipping_charge >= 0),
  free_shipping_threshold numeric(12,2) not null default 2500 check (free_shipping_threshold >= 0),
  hero_bn text not null default 'রঙে বুননে|আপনার গল্প',
  hero_en text not null default 'A story|in every thread',
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Public sees visible categories" on public.categories;
create policy "Public sees visible categories" on public.categories for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public sees visible products" on public.products;
create policy "Public sees visible products" on public.products for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public sees images of visible products" on public.product_images;
create policy "Public sees images of visible products" on public.product_images for select to anon, authenticated
using (exists (select 1 from public.products p where p.id=product_id and (p.visible or public.is_admin())));
drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public sees sizes of visible products" on public.product_sizes;
create policy "Public sees sizes of visible products" on public.product_sizes for select to anon, authenticated
using (exists (select 1 from public.products p where p.id=product_id and (p.visible or public.is_admin())));
drop policy if exists "Admins manage sizes" on public.product_sizes;
create policy "Admins manage sizes" on public.product_sizes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public sees visible reviews" on public.reviews;
create policy "Public sees visible reviews" on public.reviews for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads settings" on public.settings;
create policy "Public reads settings" on public.settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage settings" on public.settings;
create policy "Admins manage settings" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read admin list" on public.admins;
create policy "Admins read admin list" on public.admins for select to authenticated using (public.is_admin());
drop policy if exists "Admins manage admin list" on public.admins;
create policy "Admins manage admin list" on public.admins for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders are never directly readable/writable by customers. Tracking uses a phone-verified RPC.
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_pin_code text,
  p_notes text,
  p_payment_method text,
  p_items jsonb,
  p_honeypot text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  size_row public.product_sizes%rowtype;
  new_order public.orders%rowtype;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_total numeric(12,2);
  v_qty integer;
  v_size text;
  v_product_id uuid;
  v_line_key text;
  v_seen_lines text[] := array[]::text[];
  v_order_number text;
begin
  if coalesce(p_honeypot,'') <> '' then raise exception 'Invalid order request'; end if;
  if length(trim(coalesce(p_customer_name,''))) not between 1 and 120 then raise exception 'Invalid customer name'; end if;
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a valid Indian phone number'; end if;
  if length(trim(coalesce(p_address,''))) not between 5 and 500 then raise exception 'Enter a valid address'; end if;
  if length(trim(coalesce(p_city,''))) not between 1 and 100 then raise exception 'Enter a valid city'; end if;
  if p_pin_code !~ '^[0-9]{6}$' then raise exception 'Enter a valid PIN code'; end if;
  if p_payment_method not in ('cod','upi_manual') then raise exception 'Invalid payment method'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order items'; end if;
  if (select count(*) from public.orders where phone=p_phone and created_at > now()-interval '1 hour') >= 5 then
    raise exception 'Too many orders. Please try again later.';
  end if;

  for item in select value from jsonb_array_elements(p_items) order by value->>'product_id',value->>'size' loop
    begin
      v_product_id := (item->>'product_id')::uuid;
      v_qty := (item->>'quantity')::integer;
      v_size := trim(item->>'size');
    exception when others then raise exception 'Invalid order item'; end;
    if v_qty not between 1 and 20 or length(v_size) not between 1 and 40 then raise exception 'Invalid size or quantity'; end if;
    v_line_key := v_product_id::text || chr(31) || v_size;
    if v_line_key=any(v_seen_lines) then raise exception 'Duplicate product size line'; end if;
    v_seen_lines := array_append(v_seen_lines,v_line_key);
    select * into product_row from public.products where id=v_product_id and visible for update;
    if not found then raise exception 'A product is no longer available'; end if;
    select * into size_row from public.product_sizes where product_id=v_product_id and size=v_size for update;
    if not found or size_row.stock < v_qty then raise exception 'A selected size is out of stock'; end if;
    v_subtotal := v_subtotal + coalesce(product_row.discount_price,product_row.price)*v_qty;
  end loop;

  select case when v_subtotal >= free_shipping_threshold then 0 else shipping_charge end
  into v_shipping from public.settings where id=true;
  v_shipping := coalesce(v_shipping,0);
  v_total := v_subtotal + v_shipping;
  v_order_number := 'TUL-' || to_char(now() at time zone 'Asia/Kolkata','YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders(order_number,customer_name,phone,address,city,pin_code,notes,payment_method,subtotal,shipping_charge,total)
  values(v_order_number,trim(p_customer_name),p_phone,trim(p_address),trim(p_city),p_pin_code,coalesce(trim(p_notes),''),p_payment_method,v_subtotal,v_shipping,v_total)
  returning * into new_order;

  for item in select value from jsonb_array_elements(p_items) order by value->>'product_id',value->>'size' loop
    v_product_id := (item->>'product_id')::uuid;
    v_qty := (item->>'quantity')::integer;
    v_size := trim(item->>'size');
    select * into product_row from public.products where id=v_product_id;
    select * into size_row from public.product_sizes where product_id=v_product_id and size=v_size for update;
    update public.product_sizes set stock=stock-v_qty where id=size_row.id;
    insert into public.order_items(order_id,product_id,product_name,size,quantity,unit_price,line_total)
    values(new_order.id,product_row.id,product_row.name_bn,v_size,v_qty,coalesce(product_row.discount_price,product_row.price),coalesce(product_row.discount_price,product_row.price)*v_qty);
  end loop;
  return jsonb_build_object('order_number',new_order.order_number,'total',new_order.total,'shipping_charge',new_order.shipping_charge);
end;
$$;
revoke all on function public.create_order(text,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.create_order(text,text,text,text,text,text,text,jsonb,text) to anon, authenticated;

create or replace function public.track_order(p_order_number text,p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Order not found'; end if;
  select jsonb_build_object(
    'order_number',o.order_number,'status',o.status,'created_at',o.created_at,'total',o.total,
    'items',coalesce((select jsonb_agg(jsonb_build_object('name',oi.product_name,'size',oi.size,'quantity',oi.quantity,'line_total',oi.line_total)) from public.order_items oi where oi.order_id=o.id),'[]'::jsonb)
  ) into result
  from public.orders o where upper(o.order_number)=upper(trim(p_order_number)) and o.phone=p_phone;
  if result is null then raise exception 'Order not found'; end if;
  return result;
end;
$$;
revoke all on function public.track_order(text,text) from public;
grant execute on function public.track_order(text,text) to anon, authenticated;

-- Create a public bucket. Its objects are readable publicly, but writes are admin-only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,6291456,array['image/jpeg'])
on conflict(id) do update set public=true,file_size_limit=6291456,allowed_mime_types=array['image/jpeg'];
drop policy if exists "Public reads product photos" on storage.objects;
create policy "Public reads product photos" on storage.objects for select to anon,authenticated using (bucket_id='product-images');
drop policy if exists "Admins upload product photos" on storage.objects;
create policy "Admins upload product photos" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_admin());
drop policy if exists "Admins update product photos" on storage.objects;
create policy "Admins update product photos" on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_admin()) with check (bucket_id='product-images' and public.is_admin());
drop policy if exists "Admins delete product photos" on storage.objects;
create policy "Admins delete product photos" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_admin());

revoke all on public.categories,public.products,public.product_images,public.product_sizes,public.orders,public.order_items,public.reviews,public.settings,public.admins from anon,authenticated;
grant select on public.categories,public.products,public.product_images,public.product_sizes,public.reviews,public.settings to anon,authenticated;
grant select,insert,update,delete on public.categories,public.products,public.product_images,public.product_sizes,public.reviews,public.settings to authenticated;
grant select on public.orders,public.order_items,public.admins to authenticated;
grant insert,update,delete on public.orders,public.order_items,public.admins to authenticated;
