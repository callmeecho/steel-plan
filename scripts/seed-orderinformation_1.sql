-- 追加模拟订单数据（用于前端演示）
-- 执行位置：Supabase SQL Editor
-- 说明：
-- 1) 不删除原数据
-- 2) 主键冲突(oid, number)时自动跳过
-- 3) 如你的表名是 orderinformation，请把下面的 orderinformation_1 改为 orderinformation

with steel_pool as (
  select
    row_number() over () as idx,
    t.*
  from (
    values
      ('Q345R-1-V', 30, 2500, 12680),
      ('Q345R-1-V', 34, 2500, 9200),
      ('Q345B', 12, 2065, 12000),
      ('Q355B', 16, 2200, 9000),
      ('Q390B', 20, 2000, 10600),
      ('A36(ASTM)', 15, 1865, 10600),
      ('LR-A36', 10, 1665, 6000),
      ('AH36', 18, 2065, 8500),
      ('DH36', 22, 2265, 9000),
      ('EH36', 26, 2265, 9500),
      ('20Mn', 25, 2200, 9000),
      ('45#', 32, 2000, 12000),
      ('B10150JFCD', 12, 2000, 10600),
      ('L14088GGFAH', 11, 1865, 8550),
      ('N45-1', 55, 2300, 9000),
      ('S50C-NG', 48, 2200, 9000)
  ) as t(steeltype, thickness, width, length)
),
pool_meta as (
  select count(*)::int as total from steel_pool
)
insert into public.orderinformation_1 (
  oid,
  number,
  steeltype,
  thickness,
  width,
  length,
  sizetype,
  amount,
  cut,
  weight,
  heatway,
  heatprocess,
  deliverydate,
  minimumthicknesstolerance,
  sampling,
  orderPurpose,
  standardNumber,
  surfaceCustomerRequirements,
  samplingLength,
  lengthHigh,
  lengthLow
)
select
  'SM' || to_char(26050000 + g, 'FM00000000') as oid,
  ((g - 1) % 15 + 1)::text as number,
  steel_pool.steeltype,
  steel_pool.thickness::text,
  steel_pool.width::text,
  steel_pool.length::text,
  case when random() > 0.45 then '双定尺' else '单定尺' end as sizetype,
  (8 + floor(random() * 72))::int::text as amount,
  'Y' as cut,
  round((8 + random() * 85)::numeric, 3)::text as weight,
  '无' as heatway,
  '无' as heatprocess,
  (current_date + ((g - 1) % 35))::date as deliverydate,
  tol_pool.tol as minimumthicknesstolerance,
  '无' as sampling,
  (array['M01', 'M02', 'M03'])[1 + ((g - 1) % 3)] as orderPurpose,
  (array[
    'GB/T713.2-Q345R',
    'GB/T3274-Q235B',
    'GB/T1591-Q355B',
    'ASTM A36',
    'EN10025-S355J2'
  ])[1 + ((g - 1) % 5)] as standardNumber,
  '无' as surfaceCustomerRequirements,
  (array['100', '120', '150'])[1 + ((g - 1) % 3)] as samplingLength,
  (steel_pool.length + 80)::text as lengthHigh,
  greatest(0, steel_pool.length - 80)::text as lengthLow
from generate_series(1, 120) as g
cross join pool_meta
join steel_pool
  on steel_pool.idx = ((g - 1) % pool_meta.total) + 1
cross join lateral (
  select (array['-0.75', '-0.8', '-0.9', '-1.0', '-1.1'])[1 + floor(random() * 5)::int] as tol
) as tol_pool
on conflict (oid, number) do update
set
  steeltype = excluded.steeltype,
  thickness = excluded.thickness,
  width = excluded.width,
  length = excluded.length,
  sizetype = excluded.sizetype,
  amount = excluded.amount,
  cut = excluded.cut,
  weight = excluded.weight,
  heatway = excluded.heatway,
  heatprocess = excluded.heatprocess,
  deliverydate = excluded.deliverydate,
  minimumthicknesstolerance = excluded.minimumthicknesstolerance,
  sampling = excluded.sampling,
  orderpurpose = excluded.orderpurpose,
  standardnumber = excluded.standardnumber,
  surfacecustomerrequirements = excluded.surfacecustomerrequirements,
  samplinglength = excluded.samplinglength,
  lengthhigh = excluded.lengthhigh,
  lengthlow = excluded.lengthlow;

-- 验证：查看各钢种数量
-- select steeltype, count(*) from public.orderinformation_1 group by steeltype order by count(*) desc;
