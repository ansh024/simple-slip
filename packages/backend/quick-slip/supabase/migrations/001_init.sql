create extension if not exists pg_trgm;

create table products (
  id int primary key,
  name text,
  default_unit text,
  aliases text[]
);

create table slips (
  id uuid primary key default gen_random_uuid(),
  slip_no int generated always as identity,
  slip_date date default current_date,
  shop_id int,
  customer_name text,
  gst_required boolean default false,
  subtotal numeric,
  discount numeric,
  total numeric
);

create table slip_items (
  id serial primary key,
  slip_id uuid references slips(id) on delete cascade,
  product_id int references products(id),
  qty numeric,
  unit text,
  rate numeric,
  line_total numeric
);

create table price_board (
  product_id int references products(id),
  price numeric,
  effective_date date default current_date,
  primary key (product_id, effective_date)
);

create index on products using gin(aliases array_ops);
create index on slips (slip_date);
create index on slips (shop_id, slip_date);
