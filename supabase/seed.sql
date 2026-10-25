-- Catalogue seed (cycle 6, from elevame-redesign). No client data.
-- Run after the migrations in supabase/migrations/ and after
-- `node scripts/seedCatalogV2.mjs` (which seeds the conditions and
-- metrics rows this file's updates/inserts attach to). Idempotent.
--
-- taxa- and foods-dependent overlay content (bacterium one liners,
-- plant/aisle flags, curated swap pairs) is NOT here — those tables
-- only have rows once a real client's report has been seeded
-- (scripts/seedReportV2.mjs), so that content lives in
-- supabase/seed_client_report_overlay.sql instead, run per client
-- after their report exists. See supabase/README.md.
begin;
-- pattern names (client wording; clients never see conditions.name_*)
update conditions set pattern_name_en = 'Loose stools pattern', pattern_name_es = 'Patrón de heces sueltas' where id = 'diarrhea';
update conditions set pattern_name_en = 'Gas pattern', pattern_name_es = 'Patrón de gases' where id = 'gas';
update conditions set pattern_name_en = 'Slow transit pattern', pattern_name_es = 'Patrón de tránsito lento' where id = 'constipation';
update conditions set pattern_name_en = 'Bloating pattern', pattern_name_es = 'Patrón de hinchazón' where id = 'bloating';
update conditions set pattern_name_en = 'Bowel comfort pattern', pattern_name_es = 'Patrón de confort intestinal' where id = 'irritable_bowel_syndrome';
update conditions set pattern_name_en = 'Gut inflammation pattern', pattern_name_es = 'Patrón de inflamación intestinal' where id = 'inflammatory_bowel_disease';
update conditions set pattern_name_en = 'Gut inflammation pattern, whole gut', pattern_name_es = 'Patrón de inflamación intestinal, todo el intestino' where id = 'crohns_disease';
update conditions set pattern_name_en = 'Gut inflammation pattern, large bowel', pattern_name_es = 'Patrón de inflamación intestinal, colon' where id = 'ulcerative_colitis';
update conditions set pattern_name_en = 'Weight gain pattern', pattern_name_es = 'Patrón de aumento de peso' where id = 'obesity';
update conditions set pattern_name_en = 'Blood sugar pattern', pattern_name_es = 'Patrón de azúcar en sangre' where id = 'type_2_diabetes';
update conditions set pattern_name_en = 'Heart health pattern', pattern_name_es = 'Patrón de salud del corazón' where id = 'coronary_heart_disease';
update conditions set pattern_name_en = 'Oxalate pattern', pattern_name_es = 'Patrón de oxalato' where id = 'kidney_stone';
update conditions set pattern_name_en = 'Butyrate making', pattern_name_es = 'Producción de butirato' where id = 'butyric_acid_biosynthesis';
update conditions set pattern_name_en = 'Propionate making', pattern_name_es = 'Producción de propionato' where id = 'propionate_biosynthesis';
update conditions set pattern_name_en = 'Polyamine making', pattern_name_es = 'Producción de poliaminas' where id = 'polyamine_biosynthesis';
update conditions set pattern_name_en = 'Red meat and egg yolk conversion (TMA)', pattern_name_es = 'Conversión de carne roja y yema (TMA)' where id = 'tma_conversion';
update conditions set pattern_name_en = 'Serotonin, for sleep', pattern_name_es = 'Serotonina, para el sueño' where id = 'serotonin_biosynthesis';
update conditions set pattern_name_en = 'GABA, for sleep', pattern_name_es = 'GABA, para el sueño' where id = 'gaba_biosynthesis';
-- client labels for printed reference markers
insert into marker_labels values ('metabolic_score', 'Lean', 'Lean profiles', 'Perfiles delgados') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('metabolic_score', 'Overweight', 'Weight gain profiles', 'Perfiles con tendencia a ganar peso') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('vitamin_synthesis', 'Vitamin deficiency', 'People low in vitamins', 'Personas con déficit de vitaminas') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('vitamin_synthesis', 'No vitamin deficiency', 'People not low in vitamins', 'Personas sin déficit de vitaminas') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('lactose_sensitivity', 'No sensitivity', 'People who digest lactose well', 'Personas que digieren bien la lactosa') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('lactose_sensitivity', 'Lactose sensitivity', 'People sensitive to lactose', 'Personas sensibles a la lactosa') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('gluten_sensitivity', 'No sensitivity', 'People who digest gluten well', 'Personas que digieren bien el gluten') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('gluten_sensitivity', 'Gluten sensitivity', 'People sensitive to gluten', 'Personas sensibles al gluten') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('sugar_index', 'Avoiding sugar', 'People who avoid sugar', 'Personas que evitan el azúcar') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('sugar_index', 'Consuming sugar', 'People who eat a lot of sugar', 'Personas que toman mucho azúcar') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('processed_food_index', 'Avoiding processed foods', 'People who avoid processed foods', 'Personas que evitan los procesados') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('processed_food_index', 'Consuming processed foods', 'People who eat processed foods often', 'Personas que comen procesados a menudo') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('bowel_mobility', 'Decreased intestinal motility', 'Slower transit', 'Tránsito más lento') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('bowel_mobility', 'Increased intestinal motility', 'Faster transit', 'Tránsito más rápido') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('antibiotic_damage', 'Avoiding antibiotics', 'People with no recent antibiotics', 'Personas sin antibióticos recientes') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('antibiotic_damage', 'Using antibiotics', 'People using antibiotics often', 'Personas que toman antibióticos a menudo') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('autoimmune_index', 'Healthy individuals', 'People with no autoimmune pattern', 'Personas sin patrón autoinmune') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('autoimmune_index', 'Has autoimmune diseases', 'People with an autoimmune pattern', 'Personas con patrón autoinmune') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('sleep_quality', 'Low sleep quality', 'People who sleep poorly', 'Personas que duermen mal') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
insert into marker_labels values ('sleep_quality', 'High sleep quality', 'People who sleep well', 'Personas que duermen bien') on conflict (metric_id, printed_label) do update set client_label_en = excluded.client_label_en, client_label_es = excluded.client_label_es;
-- score to pattern links (replaces SCORE_DETAILS[key].bacteria)
insert into score_pattern_links values ('metabolic_score', 'obesity', 'elevame_link', 'Weight gain table p25; F/B ratio linked to weight gain by the report p4') on conflict do nothing;
insert into score_pattern_links values ('bowel_mobility', 'diarrhea', 'elevame_link', 'Loose stools table p19') on conflict do nothing;
insert into score_pattern_links values ('bowel_mobility', 'constipation', 'elevame_link', 'Slow transit table p20') on conflict do nothing;
insert into score_pattern_links values ('sugar_index', 'type_2_diabetes', 'elevame_link', 'Blood sugar table p26') on conflict do nothing;
insert into score_pattern_links values ('carbohydrate_metabolism', 'gas', 'report', 'p19: Dorea produces gas using carbohydrates') on conflict do nothing;
insert into score_pattern_links values ('sleep_quality', 'serotonin_biosynthesis', 'report', 'p32: serotonin helps healthy sleep patterns') on conflict do nothing;
insert into score_pattern_links values ('sleep_quality', 'gaba_biosynthesis', 'report', 'p32: GABA helps deeper, more restorative sleep') on conflict do nothing;
insert into score_screen_links values ('autoimmune_index', 'autoimmune_triggers', 'report', 'p11: Prevotella copri in the autoimmune trigger screen') on conflict do nothing;
update metrics set client_action_en = 'Less sugar. Your index sits closer to people who eat a lot of sugar.', client_action_es = 'Menos azúcar. Tu índice está más cerca de las personas que toman mucho azúcar.', client_action_page = 'p16' where id = 'sugar_index';
update metrics set client_action_en = 'Fewer processed foods. Your index sits closer to people who eat them often.', client_action_es = 'Menos procesados. Tu índice está más cerca de las personas que los comen a menudo.', client_action_page = 'p16' where id = 'processed_food_index';
update metrics set client_action_en = 'Some animal proteins can carry traces of antibiotics, so this score can rise without taking any.', client_action_es = 'Algunas proteínas animales pueden llevar restos de antibióticos, así que esta puntuación puede subir sin tomarlos.', client_action_page = 'p17' where id = 'antibiotic_damage';
-- aisles (food_categories is pure catalogue, seeded by seedCatalogV2.mjs)
update food_categories set shopping_list_group = 'fruit_veg' where id = 'vegetables';
update food_categories set shopping_list_group = 'fruit_veg' where id = 'fruits';
update food_categories set shopping_list_group = 'bread_grains' where id = 'bread_cereals';
update food_categories set shopping_list_group = 'legumes' where id = 'legumes';
update food_categories set shopping_list_group = 'meat_fish' where id = 'meat_eggs';
update food_categories set shopping_list_group = 'meat_fish' where id = 'fish_seafood';
update food_categories set shopping_list_group = 'dairy_eggs' where id = 'dairy';
update food_categories set shopping_list_group = 'dairy_eggs' where id = 'cheese';
update food_categories set shopping_list_group = 'nuts_seeds_oils' where id = 'nuts_seeds';
update food_categories set shopping_list_group = 'nuts_seeds_oils' where id = 'oils_fats';
update food_categories set shopping_list_group = 'herbs_seasoning' where id = 'herbs_spices_sauces';
update food_categories set shopping_list_group = 'other' where id = 'drinks';
update food_categories set shopping_list_group = 'other' where id = 'supplements';
update food_categories set shopping_list_group = 'other' where id = 'others';
commit;
