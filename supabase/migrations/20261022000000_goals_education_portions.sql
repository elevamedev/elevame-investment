-- Cycle 8 (Amina's review, 19 Oct 2026): body system education, client goals,
-- optional weight goal with portions. Idempotent: safe to run twice.
-- Depends on: schema.sql, schema_v2_data_model.sql, schema_v2_admin.sql, 20261020_redesign.sql
-- (owns_client, clinician_owns_client, is_admin, is_staff, my_client_id).

-- 1. Body system education (general science, the same for every client) ------------
create table if not exists body_system_education (
  theme_id text primary key references themes,
  hook_en text not null, hook_es text not null,
  why_short_en text not null, why_short_es text not null,   -- shown by default
  why_more_en text not null, why_more_es text not null,     -- behind "Read more"
  reviewed_by uuid, reviewed_at timestamptz,                -- Amina signs off each text
  updated_at timestamptz not null default now()
);
create table if not exists education_facts (
  id text primary key,
  theme_id text not null references themes,
  sort_order int not null default 0,
  text_en text not null, text_es text not null,
  evidence_level text not null check (evidence_level in ('established','growing','early')),
  source_citation text not null,
  source_url text,
  collapsed_visible boolean not null default false           -- true: shown before "Read more"
);
alter table body_system_education
  add column if not exists image_url text,            -- Supabase bucket `lifestyle-photos`, {theme_id}.webp, 1600x900
  add column if not exists image_alt_en text, add column if not exists image_alt_es text,
  add column if not exists image_credit text;          -- source and licence, e.g. 'Canva, generated 2026-10-19'
alter table body_system_education enable row level security;
alter table education_facts enable row level security;
drop policy if exists bse_read on body_system_education;
create policy bse_read on body_system_education for select using (auth.uid() is not null and reviewed_at is not null or is_staff());
drop policy if exists bse_admin on body_system_education;
create policy bse_admin on body_system_education for all using (is_admin()) with check (is_admin());
drop policy if exists ef_read on education_facts;
create policy ef_read on education_facts for select using (
  auth.uid() is not null and exists (select 1 from body_system_education b where b.theme_id = education_facts.theme_id and b.reviewed_at is not null)
  or is_staff());
drop policy if exists ef_admin on education_facts;
create policy ef_admin on education_facts for all using (is_admin()) with check (is_admin());

-- 2. Goals: suggested from the report, confirmed or added by the client --------------
create table if not exists goal_catalog (
  key text primary key,
  kind text not null check (kind in ('report','own')),
  label_en text not null, label_es text not null,
  tracked_by text,              -- check in field that follows it (energy, sleep, mood, digestion), or 'weight'
  sort_order int not null default 0
);
alter table goal_catalog enable row level security;
drop policy if exists gc_read on goal_catalog;
create policy gc_read on goal_catalog for select using (auth.uid() is not null);
drop policy if exists gc_admin on goal_catalog;
create policy gc_admin on goal_catalog for all using (is_admin()) with check (is_admin());

create table if not exists client_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  goal_key text not null,                       -- insights.key for report goals, goal_catalog.key for own goals
  source text not null check (source in ('report','client','nutritionist')),
  insight_id uuid references insights on delete set null,
  status text not null default 'active' check (status in ('active','dismissed')),
  custom_label text,                            -- "Something else" typed by the client
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, goal_key)
);
alter table client_goals enable row level security;
drop policy if exists cg_read on client_goals;
create policy cg_read on client_goals for select using (owns_client(client_id) or clinician_owns_client(client_id) or is_admin());
drop policy if exists cg_write_own on client_goals;
create policy cg_write_own on client_goals for insert with check (owns_client(client_id) and source = 'client' or is_staff());
drop policy if exists cg_update_own on client_goals;
create policy cg_update_own on client_goals for update using (owns_client(client_id) or is_staff()) with check (owns_client(client_id) or is_staff());
drop policy if exists cg_delete_staff on client_goals;
create policy cg_delete_staff on client_goals for delete using (is_staff());
create or replace function client_goals_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() and (new.goal_key is distinct from old.goal_key or new.source is distinct from old.source
     or new.insight_id is distinct from old.insight_id or new.client_id is distinct from old.client_id) then
    raise exception 'clients can only confirm, dismiss or rename their goals';
  end if;
  return new;
end $$;
drop trigger if exists client_goals_guard on client_goals;
create trigger client_goals_guard before update on client_goals for each row execute function client_goals_guard();
-- Report goals: the seeder writes one row per approved goal insight (source 'report', confirmed_at null).
-- The client confirms (confirmed_at) or dismisses (status). Own goals are inserted by the client (source 'client').
-- A client dismisses a goal by setting status = 'dismissed'; rows are never deleted by clients,
-- so the nutritionist can see what was suggested and what the client chose.

-- 3. Weight goal and portions (optional, off by default, approved by the nutritionist) --
create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5,1) check (weight_kg between 30 and 300),
  height_cm numeric(5,1) check (height_cm between 120 and 230),
  source text not null default 'client' check (source in ('client','nutritionist'))
);
alter table body_metrics enable row level security;
drop policy if exists bm_read on body_metrics;
create policy bm_read on body_metrics for select using (owns_client(client_id) or clinician_owns_client(client_id) or is_admin());
drop policy if exists bm_insert on body_metrics;
create policy bm_insert on body_metrics for insert with check (owns_client(client_id) and source = 'client' or is_staff());

create table if not exists weight_goals (
  client_id uuid primary key references clients on delete cascade,
  target_kg numeric(5,1) not null check (target_kg between 30 and 300),
  pace text not null default 'steady' check (pace in ('gentle','steady')),   -- 0.25 or 0.5 kg a week
  activity text not null default 'light' check (activity in ('low','light','moderate','active')),
  show_portions boolean not null default false,
  screening_ok boolean not null default false,      -- client answered the safety question with "no reason"
  -- set by the nutritionist only:
  kcal_target int, protein_g int,
  approved_by uuid, approved_at timestamptz,
  blocked_reason text,
  updated_at timestamptz not null default now()
);
alter table weight_goals enable row level security;
drop policy if exists wg_read on weight_goals;
create policy wg_read on weight_goals for select using (owns_client(client_id) or clinician_owns_client(client_id) or is_admin());
drop policy if exists wg_insert on weight_goals;
create policy wg_insert on weight_goals for insert with check (
  (owns_client(client_id) and kcal_target is null and protein_g is null and approved_at is null and approved_by is null) or is_staff());
drop policy if exists wg_update on weight_goals;
create policy wg_update on weight_goals for update using (owns_client(client_id) or is_staff()) with check (owns_client(client_id) or is_staff());
-- Clients may change target, pace, activity, show_portions, screening_ok. Staff columns are guarded:
create or replace function weight_goals_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then
    if new.kcal_target is distinct from old.kcal_target or new.protein_g is distinct from old.protein_g
       or new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by
       or new.blocked_reason is distinct from old.blocked_reason then
      raise exception 'only the nutritionist can set portions';
    end if;
    -- a client change to target or pace sends portions back for review
    if new.target_kg is distinct from old.target_kg or new.pace is distinct from old.pace or new.activity is distinct from old.activity then
      new.approved_at := null; new.approved_by := null;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists weight_goals_guard on weight_goals;
create trigger weight_goals_guard before update on weight_goals for each row execute function weight_goals_guard();

-- Portions show only when all of this is true. The app reads this, never its own logic.
create or replace function portions_visible(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select w.show_portions and w.screening_ok and w.approved_at is not null and w.blocked_reason is null
                   from weight_goals w where w.client_id = p_client_id
                     and (owns_client(p_client_id) or clinician_owns_client(p_client_id) or is_admin())), false);
$$;

-- Suggested daily guide for the nutritionist (Mifflin St Jeor x activity, minus 500 kcal,
-- floors 1500 men / 1200 women; protein 1.2 g/kg from 65, else 1.0 g/kg). Staff only.
create or replace function suggest_weight_guide(p_client_id uuid)
returns table (bmr int, kcal_target int, protein_g int, weekly_loss_kg numeric, target_bmi numeric, eligible boolean, reason text)
language plpgsql stable security definer set search_path = public as $$
declare c record; m record; w record; age int; b numeric; f numeric; k numeric; tb numeric; floor_k int;
begin
  if not is_staff() then raise exception 'staff only'; end if;
  select * into c from clients where id = p_client_id;
  select * into m from body_metrics where client_id = p_client_id order by measured_on desc limit 1;
  select * into w from weight_goals where client_id = p_client_id;
  if m.weight_kg is null or m.height_cm is null or w.target_kg is null or c.birth_year is null then
    return query select null::int, null::int, null::int, null::numeric, null::numeric, false, 'missing weight, height, goal or birth year'; return;
  end if;
  age := extract(year from current_date)::int - c.birth_year;
  b := 10*m.weight_kg + 6.25*m.height_cm - 5*age + case when c.sex in ('male','m','M') then 5 else -161 end;
  f := case w.activity when 'low' then 1.2 when 'light' then 1.375 when 'moderate' then 1.55 else 1.725 end;
  floor_k := case when c.sex in ('male','m','M') then 1500 else 1200 end;
  k := greatest(round((b*f - 500)/50)*50, floor_k);
  tb := round(w.target_kg / ((m.height_cm/100)^2), 1);
  return query select round(b)::int, k::int,
    (round(m.weight_kg * case when age >= 65 then 1.2 else 1.0 end / 5) * 5)::int,
    case w.pace when 'gentle' then 0.25 else 0.5 end::numeric, tb,
    (age >= 18 and tb >= case when age >= 65 then 22 else 18.5 end and w.screening_ok and w.target_kg < m.weight_kg),
    case when age < 18 then 'under 18'
         when not w.screening_ok then 'safety question not cleared'
         when w.target_kg >= m.weight_kg then 'goal is not below current weight'
         when tb < case when age >= 65 then 22 else 18.5 end then 'goal BMI too low for age'
         else null end;
end $$;

create table if not exists food_portions (
  food_id text primary key references foods,
  label_en text not null, label_es text not null,   -- "2 slices", "half your plate"
  grams numeric,                                      -- null for "half your plate", "to taste"
  scales boolean not null default true,               -- false: vegetables, herbs (not scaled to kcal)
  kcal_per_100g numeric, protein_per_100g numeric,
  source text not null check (source in ('BEDCA','USDA','nutritionist')),
  source_ref text
);
alter table food_portions enable row level security;
drop policy if exists fp_read on food_portions;
create policy fp_read on food_portions for select using (auth.uid() is not null);
drop policy if exists fp_admin on food_portions;
create policy fp_admin on food_portions for all using (is_admin()) with check (is_admin());

-- 4. Seeds -------------------------------------------------------------------------
insert into goal_catalog (key, kind, label_en, label_es, tracked_by, sort_order) values
 ('energy','own','More energy','Más energía','energy',10),
 ('sleep','own','Better sleep','Dormir mejor','sleep',20),
 ('mood','own','A calmer mood','Un estado de ánimo más tranquilo','mood',30),
 ('weight','own','Lose weight','Perder peso','weight',40),
 ('cravings','own','Fewer sugar cravings','Menos antojos de dulce','processed_snacks',50),
 ('other','own','Something else','Otro objetivo',null,90)
on conflict (key) do update set label_en = excluded.label_en, label_es = excluded.label_es, tracked_by = excluded.tracked_by, sort_order = excluded.sort_order;

insert into body_system_education (theme_id, hook_en, hook_es, why_short_en, why_short_es, why_more_en, why_more_es) values
('digestion','Why food can sit heavy, or move too fast','Por qué la comida a veces pesa o pasa demasiado rápido',
 'Most of your food is digested before it reaches your large bowel. What''s left, mainly fibre, feeds the bacteria that live there. As they eat, they make gas and useful substances, and they help set how fast food moves through you.',
 'La mayor parte de lo que comes se digiere antes de llegar al intestino grueso. Lo que queda, sobre todo fibra, alimenta a las bacterias que viven allí. Al comer, producen gases y sustancias útiles, y ayudan a marcar la velocidad a la que la comida avanza.',
 'When the mix is off balance you can feel it: more gas, heaviness, or stools that are too loose or too slow. A little gas every day is normal. It shows your bacteria are at work. What matters is which bacteria are doing the work, and how much.',
 'Cuando la mezcla no está equilibrada, se nota: más gases, pesadez, o deposiciones demasiado blandas o lentas. Un poco de gas cada día es normal y significa que tus bacterias trabajan. Lo importante es qué bacterias hacen ese trabajo y cuánto.'),
('inflammation','How your bacteria feed and protect your gut wall','Cómo tus bacterias alimentan y protegen la pared intestinal',
 'Your gut lining is a single layer of cells, covered in mucus. It lets nutrients in and keeps everything else out. Some bacteria feed this lining: when they ferment fibre they make butyrate and propionate, which help control inflammation and keep the lining healthy.',
 'La pared intestinal es una sola capa de células cubierta de moco. Deja pasar los nutrientes y frena todo lo demás. Algunas bacterias la alimentan: al fermentar la fibra producen butirato y propionato, que ayudan a controlar la inflamación y a mantener la pared sana.',
 'When these helpers are low, the lining is less well fed and inflammation is more likely. Akkermansia, which lives in the mucus layer, is one to watch: lower levels are linked in studies to inflammation and weight gain, though research in people is still early.',
 'Cuando estas bacterias escasean, la pared está peor alimentada y la inflamación es más probable. Akkermansia, que vive en la capa de moco, es una de las que conviene vigilar: niveles bajos se asocian en estudios con inflamación y aumento de peso, aunque la investigación en personas aún es temprana.'),
('metabolism','How your gut shapes energy, appetite and blood sugar','Cómo tu intestino influye en la energía, el apetito y el azúcar en sangre',
 'Your bacteria help decide how much energy you get from food and how your body handles sugar. Substances they make tell your gut to release hormones that help you feel full and keep blood sugar steady.',
 'Tus bacterias influyen en cuánta energía obtienes de la comida y en cómo tu cuerpo maneja el azúcar. Las sustancias que producen avisan al intestino para liberar hormonas que te ayudan a sentirte saciado y a mantener estable el azúcar en sangre.',
 'This is why two people can eat the same meal and react very differently. Your gut bacteria are one part of that difference, next to sleep, movement and genes.',
 'Por eso dos personas pueden comer lo mismo y reaccionar de forma muy distinta. Las bacterias intestinales son una parte de esa diferencia, junto con el sueño, el movimiento y los genes.'),
('heart','The link between red meat, your bacteria and your heart','La relación entre la carne roja, tus bacterias y tu corazón',
 'When you eat red meat and egg yolk, some gut bacteria turn nutrients in them (choline and carnitine) into a substance called TMA. Your liver turns TMA into TMAO.',
 'Cuando comes carne roja o yema de huevo, algunas bacterias intestinales transforman sus nutrientes (colina y carnitina) en una sustancia llamada TMA. El hígado convierte la TMA en TMAO.',
 'In large studies, people with more TMAO had more heart problems in the years that followed. This shows a link, not proof that one causes the other, but it is one of the clearest ways gut bacteria connect to the heart. Your report checks the bacteria that make TMA.',
 'En estudios grandes, las personas con más TMAO tuvieron más problemas de corazón en los años siguientes. Es una asociación, no la prueba de que una cosa cause la otra, pero es una de las conexiones más claras entre las bacterias intestinales y el corazón. Tu informe analiza las bacterias que producen TMA.'),
('mind','How your gut talks to your brain, mood and sleep','Cómo tu intestino habla con tu cerebro, tu ánimo y tu sueño',
 'Your gut and brain talk all day, through the vagus nerve, hormones and substances your bacteria make. Around 90% of your body''s serotonin is made in your gut, by cells in the gut lining. Certain gut bacteria tell those cells to make more. Some bacteria also make GABA, a calming messenger.',
 'Tu intestino y tu cerebro se comunican todo el día, a través del nervio vago, las hormonas y las sustancias que producen tus bacterias. Alrededor del 90% de la serotonina del cuerpo se fabrica en el intestino, en células de la pared intestinal. Ciertas bacterias indican a esas células que fabriquen más. Algunas bacterias también producen GABA, un mensajero que calma.',
 'Serotonin made in your gut mostly stays in your body, because your brain makes its own. At night your brain turns serotonin into melatonin, the hormone that makes you sleepy. Your bacteria may shape this indirectly, through signals to the brain and through tryptophan from food, which is what serotonin is made from. Studies link gut bacteria to sleep and mood, but this science is still young.',
 'La serotonina del intestino se queda sobre todo en el cuerpo, porque el cerebro fabrica la suya. Por la noche, el cerebro convierte la serotonina en melatonina, la hormona que da sueño. Tus bacterias pueden influir de forma indirecta, con señales al cerebro y a través del triptófano de los alimentos, que es la materia prima de la serotonina. Los estudios relacionan las bacterias con el sueño y el ánimo, pero es una ciencia todavía joven.')
on conflict (theme_id) do update set hook_en = excluded.hook_en, hook_es = excluded.hook_es,
  why_short_en = excluded.why_short_en, why_short_es = excluded.why_short_es,
  why_more_en = excluded.why_more_en, why_more_es = excluded.why_more_es, updated_at = now();

insert into education_facts (id, theme_id, sort_order, text_en, text_es, evidence_level, source_citation, source_url, collapsed_visible) values
('dig_38_trillion','digestion',1,'Your large bowel is home to around 38 trillion bacteria, roughly as many as all the cells in your body.','Tu intestino grueso alberga unos 38 billones de bacterias, más o menos tantas como células tiene tu cuerpo.','established','Sender, Fuchs and Milo. PLoS Biology, 2016','https://doi.org/10.1371/journal.pbio.1002533',true),
('inf_butyrate_fuel','inflammation',1,'Butyrate made by your bacteria is the main fuel for the cells that line your colon.','El butirato que producen tus bacterias es el principal combustible de las células que recubren el colon.','established','Roediger. Gut, 1980; Donohoe et al. Cell Metabolism, 2011','https://doi.org/10.1016/j.cmet.2011.02.018',true),
('inf_akkermansia','inflammation',2,'Lower Akkermansia is linked to inflammation and weight gain. In a small trial in people, taking it improved insulin sensitivity.','Niveles bajos de Akkermansia se asocian con inflamación y aumento de peso. En un ensayo pequeño en personas, tomarla mejoró la sensibilidad a la insulina.','early','Depommier et al. Nature Medicine, 2019','https://doi.org/10.1038/s41591-019-0495-2',false),
('met_personal_glucose','metabolism',1,'In a study of 800 people, blood sugar after the same meal varied widely from person to person. Knowing each person''s gut bacteria helped predict their response.','En un estudio con 800 personas, el azúcar en sangre tras la misma comida varió mucho de una persona a otra. Conocer sus bacterias intestinales ayudó a predecir la respuesta de cada una.','growing','Zeevi et al. Cell, 2015','https://doi.org/10.1016/j.cell.2015.11.001',true),
('heart_tmao','heart',1,'In a study of 4,007 people followed for 3 years, those with the most TMAO had about 2.5 times the risk of heart attack, stroke or death compared with those with the least.','En un estudio con 4.007 personas seguidas durante 3 años, quienes tenían más TMAO presentaron unas 2,5 veces más riesgo de infarto, ictus o muerte que quienes tenían menos.','growing','Tang et al. New England Journal of Medicine, 2013','https://doi.org/10.1056/NEJMoa1109400',true),
('mind_serotonin_90','mind',1,'Around 90% of your body''s serotonin is made in your gut.','Alrededor del 90% de la serotonina de tu cuerpo se fabrica en el intestino.','established','Yano et al. Cell, 2015','https://doi.org/10.1016/j.cell.2015.02.047',true),
('mind_bacteria_serotonin','mind',2,'Certain gut bacteria help your gut make more serotonin.','Ciertas bacterias intestinales ayudan a tu intestino a fabricar más serotonina.','growing','Yano et al. Cell, 2015','https://doi.org/10.1016/j.cell.2015.02.047',false)
on conflict (id) do update set text_en = excluded.text_en, text_es = excluded.text_es, evidence_level = excluded.evidence_level,
  source_citation = excluded.source_citation, source_url = excluded.source_url, collapsed_visible = excluded.collapsed_visible, sort_order = excluded.sort_order;
-- reviewed_at stays null until Amina approves each text in the admin panel; clients see nothing before that.
