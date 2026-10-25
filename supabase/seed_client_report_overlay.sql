-- Per-client overlay, from elevame-redesign cycle 6. No health data —
-- but it DOES reference taxa and food ids that only exist once a real
-- client's report has been seeded (scripts/seedReportV2.mjs populates
-- `taxa` from that client's genus/pathway data; `foods` from their
-- diet plan). Run this AFTER seedReportV2.mjs for a client whose
-- report happens to include these ids; skip rows that don't apply.
-- Idempotent.
begin;
-- bacterium one liners, report wording only; null where the report gives none
update taxa set plain_en = 'One of the bacteria that produce gas using carbohydrates.', plain_es = 'Una de las bacterias que producen gas a partir de los carbohidratos.' where id = 'dorea';  -- p19
update taxa set plain_en = 'Protective in your gut inflammation, weight gain and blood sugar patterns, and helps make propionate.', plain_es = 'Protectora en tus patrones de inflamación intestinal, aumento de peso y azúcar en sangre, y ayuda a producir propionato.' where id = 'akkermansia_muciniphila';  -- p24 to p26, p29
update taxa set plain_en = 'Makes butyrate, which helps control inflammation.', plain_es = 'Produce butirato, que ayuda a controlar la inflamación.' where id = 'roseburia';  -- p28 to p29
update taxa set plain_en = 'Makes butyrate, which helps control inflammation.', plain_es = 'Produce butirato, que ayuda a controlar la inflamación.' where id = 'anaerostipes';  -- p28 to p29
update taxa set plain_en = 'Makes butyrate, which helps control inflammation.', plain_es = 'Produce butirato, que ayuda a controlar la inflamación.' where id = 'coprococcus';  -- p28 to p29
update taxa set plain_en = 'Makes butyrate, which helps control inflammation. Also turns red meat and egg yolk into TMA.', plain_es = 'Produce butirato, que ayuda a controlar la inflamación. También convierte la carne roja y la yema en TMA.' where id = 'eubacterium';  -- p28 to p30
update taxa set plain_en = 'Turns red meat and egg yolk into TMA.', plain_es = 'Convierte la carne roja y la yema en TMA.' where id = 'clostridium';  -- p30
update taxa set plain_en = 'Turns red meat and egg yolk into TMA.', plain_es = 'Convierte la carne roja y la yema en TMA.' where id = 'bacillus';  -- p30
-- plant flag, eggs to dairy and eggs, mutton and goat never in plans (Phase D)
update foods set is_plant = (category_id in ('vegetables', 'fruits', 'legumes', 'bread_cereals', 'nuts_seeds', 'herbs_spices_sauces'));
update foods set shop_group_override = 'dairy_eggs' where id in ('chicken_egg', 'egg_white');
update foods set use_in_plans = false where id in ('mutton', 'goat');
-- curated swap pairs, awaiting nutritionist approval (approved = false until then) — Phase D
insert into swap_pairs (from_food_id, to_food_id) values ('whole_milk', 'oat_milk') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('whole_milk', 'almond_milk') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('salmon', 'sea_bream') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('leek', 'spring_onions') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('leek', 'shallot') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('ginger', 'mint') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('ginger', 'thyme') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('okra', 'green_bean') on conflict do nothing;
insert into swap_pairs (from_food_id, to_food_id) values ('soya_milk', 'oat_milk') on conflict do nothing;
commit;
