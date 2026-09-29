import { t2, FOODS, CATEGORY_ORDER } from "./foods.js";

/* ============================================================
   DEFAULT 6-WEEK PLAN TEMPLATE — dish/desc/tip are bilingual
   text; foods are ids referencing FOODS in ./foods.js, so names
   and scores never duplicate.

   This is the starting template assigned to a new client by
   scripts/seed.mjs. Once seeded, each client's actual plan lives
   in the `plan_phases` / `plan_days` / `plan_meals` tables in
   Supabase and can be customised per client from there.
============================================================ */
const meal = (labelKey, dish, foods, desc) => ({ labelKey, dish, foods, desc: desc || null });

export const PHASES = [
  {
    id: "phase1", weeks: t2("Weeks 1-2", "Semanas 1-2"), subtitle: t2("Foundation", "Fundamentos"),
    blurb: t2("Every score 0-3 food is already removed. Focus on eating calmly and consistently.",
              "Todos los alimentos con score 0-3 ya están eliminados. El objetivo es comer con calma y constancia."),
    days: [
      { tip: t2("Kale and cauliflower bring sulforaphane-family compounds; olive oil and coconut oil both carry anti-inflammatory fats.",
                "La col rizada y la coliflor aportan compuestos de la familia del sulforafano; el aceite de oliva y el de coco aportan grasas antiinflamatorias."),
        meals: [
          meal("breakfast", t2("Oat toast with almond butter and berries","Tostada de avena con crema de almendra y frutos rojos"), ["oat_bread","almond_butter","strawberry","chia_seed","chamomile_tea"], t2("Toast oat bread, spread with almond butter, top with sliced strawberries and chia seeds.","Tuesta el pan de avena, unta con crema de almendra y cubre con fresas en rodajas y semillas de chía.")),
          meal("lunch", t2("Roasted pepper and rocket salad with kidney beans","Ensalada de pimiento asado y rúcula con judías rojas"), ["red_pepper","aubergine","rocket","feta","olive_oil","kidney_bean"], t2("Roast pepper and aubergine, toss with rocket and feta, dress with olive oil and lemon.","Asa el pimiento y la berenjena, mezcla con rúcula y feta, aliña con aceite de oliva y limón.")),
          meal("dinner", t2("Baked sweet potato with sautéed kale and tofu","Boniato al horno con col rizada salteada y tofu"), ["sweet_potato","tofu","kale","cauliflower","coconut_oil","parsley"], t2("Bake sweet potato, pan-fry tofu, sauté kale and cauliflower in coconut oil.","Hornea el boniato, saltea el tofu y la col rizada y la coliflor en aceite de coco.")),
          meal("snack", t2("Apple with pumpkin seeds","Manzana con semillas de calabaza"), ["apple","pumpkin_seed"]),
        ]},
      { tip: t2("Beetroot and blueberries are two of the best-studied polyphenol sources for calming inflammation.",
                "La remolacha y los arándanos son dos de las fuentes de polifenoles mejor estudiadas para calmar la inflamación."),
        meals: [
          meal("breakfast", t2("Creamy rice porridge with blueberries","Gachas cremosas de arroz con arándanos"), ["rice","oat_milk","blueberry","pine_nut"], t2("Simmer rice in oat milk until creamy, top with blueberries and toasted pine nuts.","Cuece el arroz en leche de avena hasta que quede cremoso, cubre con arándanos y piñones tostados.")),
          meal("lunch", t2("Beetroot and carrot soup","Sopa de remolacha y zanahoria"), ["beetroot","carrot","sour_cream","white_bread"], t2("Blend cooked beetroot and carrot into a soup, swirl in sour cream.","Tritura la remolacha y la zanahoria cocidas hasta obtener una sopa, añade un toque de nata agria.")),
          meal("dinner", t2("Cabbage rolls with beans and rice","Rollitos de col con judías y arroz"), ["white_cabbage","mung_bean","rice","tomato","green_bean"], t2("Stuff cabbage leaves with mung beans and rice, bake in tomato sauce.","Rellena hojas de col con judías mungo y arroz, hornea en salsa de tomate.")),
          meal("snack", t2("Pear with gorgonzola","Pera con gorgonzola"), ["pear","gorgonzola"]),
        ]},
      { tip: t2("Mustard replaces chilli here for warmth without the low score.","La mostaza sustituye aquí al chile para dar calidez sin el score bajo."),
        meals: [
          meal("breakfast", t2("Soft scrambled eggs with greens","Huevos revueltos suaves con verduras"), ["eggs","spring_onion","spinach","white_bread"], t2("Scramble eggs with spring onion and spinach, serve on white bread.","Revuelve los huevos con cebolleta y espinaca, sirve sobre pan blanco.")),
          meal("lunch", t2("Rocket and radish salad with sprouts","Ensalada de rúcula y rábano con brotes"), ["rocket","radish","soybean_sprout","olive_oil","mustard"], t2("Toss rocket, radish and sprouts in an olive oil and mustard dressing.","Mezcla la rúcula, el rábano y los brotes con una vinagreta de aceite de oliva y mostaza.")),
          meal("dinner", t2("Roasted root vegetable tray bake","Bandeja de raíces asadas"), ["turnip","brussels_sprout","purple_carrot","olive_oil","quinoa"], t2("Roast root vegetables in olive oil, serve with quinoa.","Asa las verduras de raíz en aceite de oliva, sirve con quinoa.")),
          meal("snack", t2("Pomegranate with chestnuts","Granada con castañas"), ["pomegranate","chestnut"]),
        ]},
      { tip: t2("Skip shop-bought curry powder — it's usually turmeric-based. Cumin and mustard give the same warmth.","Evita el curry en polvo comprado, suele llevar cúrcuma. El comino y la mostaza aportan el mismo calor."),
        meals: [
          meal("breakfast", t2("Yoghurt bowl with raspberries and chia","Bol de yogur con frambuesas y chía"), ["yoghurt_ff","raspberry","chia_seed"]),
          meal("lunch", t2("Red lentil and carrot soup","Sopa de lenteja roja y zanahoria"), ["red_lentil","carrot","celery","parsley","oat_bread"]),
          meal("dinner", t2("Cauliflower and chickpea curry","Curry de coliflor y garbanzos"), ["cauliflower","chickpea","coconut_milk","cumin_seed","mustard","rice"], t2("Simmer cauliflower and chickpea in coconut milk with cumin and mustard.","Cuece la coliflor y los garbanzos en leche de coco con comino y mostaza.")),
          meal("snack", t2("Date with walnuts","Dátil con nueces"), ["date","walnut"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Breakfast wrap","Wrap de desayuno"), ["white_tortilla","egg_white","tomato","rocket"]),
          meal("lunch", t2("Beetroot and goat's cheese salad","Ensalada de remolacha y queso de cabra"), ["beetroot","goats_cheese","walnut","pomegranate"]),
          meal("dinner", t2("Vegetable stir-fry with rice noodles","Salteado de verduras con fideos de arroz"), ["collard","aubergine","spring_onion","coconut_oil","rice_noodle"]),
          meal("snack", t2("Kiwi with pecans","Kiwi con pacanas"), ["kiwi","pecan"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Oat bran porridge with peach","Gachas de salvado de avena con melocotón"), ["oat_bran","peach","sunflower_seed"]),
          meal("lunch", t2("Cabbage slaw with tofu","Ensalada de col con tofu"), ["white_cabbage","carrot","mung_bean_sprout","tofu","tahini","lemon"]),
          meal("dinner", t2("Sweet potato and black bean tacos","Tacos de boniato y judías negras"), ["sweet_potato","black_bean","white_tortilla","red_cabbage","coriander"]),
          meal("snack", t2("Grapes","Uvas"), ["black_grape"]),
        ]},
      { tip: t2("A lighter day to close the week — basil and fresh tomato build flavour without any spice swap needed.","Un día más ligero para cerrar la semana: la albahaca y el tomate fresco aportan sabor sin necesitar ninguna sustitución de especias."),
        meals: [
          meal("breakfast", t2("Green smoothie","Batido verde"), ["green_banana","spinach","oat_milk","chia_seed"]),
          meal("lunch", t2("Leek and root vegetable soup","Sopa de puerro y raíces"), ["leek","turnip","rye_bread"]),
          meal("dinner", t2("Baked aubergine parmigiana","Berenjena a la parmesana al horno"), ["aubergine","tomato","mozzarella","basil"]),
          meal("snack", t2("Pickled cucumber with olives","Pepinillos con aceitunas"), ["pickled_cucumber","green_olive"]),
        ]},
    ],
  },
  {
    id: "phase2", weeks: t2("Weeks 3-4", "Semanas 3-4"), subtitle: t2("Diversity Expansion", "Expansión de la Diversidad"),
    blurb: t2("New plants and the first fermented foods are introduced to lift that 1.1 diversity score.",
              "Se introducen nuevas plantas y los primeros alimentos fermentados para mejorar ese score de diversidad de 1,1."),
    days: [
      { tip: t2("First new addition of the diversity phase — buckwheat, widely sold as crêpe flour.","Primera incorporación de la fase de diversidad: el trigo sarraceno, muy vendido como harina para crepes."),
        meals: [
          meal("breakfast", t2("Buckwheat crêpes with blackberries","Crepes de trigo sarraceno con moras"), ["buckwheat","blackberry","coconut"]),
          meal("lunch", t2("Tomato and olive salad with halloumi","Ensalada de tomate y aceitunas con halloumi"), ["tomato","green_olive","halloumi","olive_oil"]),
          meal("dinner", t2("Roasted cauliflower and chickpeas with tahini","Coliflor y garbanzos asados con tahini"), ["cauliflower","chickpea","tahini","pomegranate"]),
          meal("snack", t2("Yoghurt with cacao nibs","Yogur con nibs de cacao"), ["yoghurt_ff","cacao_nibs"]),
        ]},
      { tip: t2("Sauerkraut is the first fermented food — start with a small spoonful.","El chucrut es el primer alimento fermentado: empieza con una cucharada pequeña."),
        meals: [
          meal("breakfast", t2("Rice flour crêpes with mango","Crepes de harina de arroz con mango"), ["rice_flour","mango","pumpkin_seed"]),
          meal("lunch", t2("Sauerkraut and lentil bowl","Bol de chucrut y lentejas"), ["red_lentil","sauerkraut","beetroot","parsley"]),
          meal("dinner", t2("Stuffed peppers","Pimientos rellenos"), ["red_pepper","rice","mung_bean","tomato"]),
          meal("snack", t2("Figs with pine nuts","Higos con piñones"), ["fig","pine_nut"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Chia pudding with raspberries","Pudin de chía con frambuesas"), ["chia_seed","oat_milk","raspberry","grape_seed_oil"]),
          meal("lunch", t2("Roasted root veg and rocket salad","Ensalada de raíces asadas y rúcula"), ["carrot","turnip","rocket","pomegranate"]),
          meal("dinner", t2("Vegetable and tofu hotpot","Cazuela de verduras y tofu"), ["kale","turnip","leek","collard","tofu"]),
          meal("snack", t2("Dried apricot with walnuts","Orejones con nueces"), ["dried_apricot","walnut"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Warm rice bran porridge with strawberries","Gachas templadas de salvado de arroz con fresas"), ["rice_bran","strawberry","apple"]),
          meal("lunch", t2("Kidney bean salad with roasted vegetables","Ensalada de judías rojas con verduras asadas"), ["kidney_bean","purple_carrot","spring_onion","mint","lemon"]),
          meal("dinner", t2("Aubergine and courgette bake","Gratinado de berenjena y calabacín"), ["aubergine","courgette","white_cabbage","cheddar"]),
          meal("snack", t2("Pickled cucumber with hummus","Pepinillos con hummus"), ["pickled_cucumber","chickpea","olive_oil"]),
        ]},
      { tip: t2("Cumin and mustard build the warm base here — no turmeric needed.","El comino y la mostaza crean aquí la base cálida, sin necesidad de cúrcuma."),
        meals: [
          meal("breakfast", t2("Oat toast with cream cheese and pear","Tostada de avena con queso crema y pera"), ["oat_bread","cream_cheese","pear","mint"]),
          meal("lunch", t2("Radish and cress salad","Ensalada de rábano y berro"), ["radish","cress","soybean_sprout","feta","olive_oil"]),
          meal("dinner", t2("Sweet potato and lentil dal","Dal de boniato y lentejas"), ["sweet_potato","red_lentil","cumin_seed","mustard","rice"]),
          meal("snack", t2("Blueberries with yoghurt","Arándanos con yogur"), ["blueberry","yoghurt_ff"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Berry and greens smoothie bowl","Bol de batido de frutos rojos y verdes"), ["green_banana","spinach","blueberry","chia_seed","sunflower_seed"]),
          meal("lunch", t2("Beetroot, rocket and walnut salad","Ensalada de remolacha, rúcula y nueces"), ["beetroot","goats_cheese","rocket","walnut","grape_molasses"]),
          meal("dinner", t2("Stuffed aubergine","Berenjena rellena"), ["aubergine","mung_bean","tomato","parsley"]),
          meal("snack", t2("Dark chocolate with macadamias","Chocolate negro con macadamias"), ["dark_chocolate","macadamia"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Buckwheat crêpes with almond butter","Crepes de trigo sarraceno con crema de almendra"), ["buckwheat","almond_butter","raspberry"]),
          meal("lunch", t2("Tomato and cucumber salad","Ensalada de tomate y pepino"), ["tomato","cucumber","olive_oil","lemon"]),
          meal("dinner", t2("Cauliflower rice stir-fry with edamame","Salteado de arroz de coliflor con edamame"), ["cauliflower","edamame","carrot","spring_onion","soy_sauce"]),
          meal("snack", t2("Grapes with cacao nibs","Uvas con nibs de cacao"), ["black_grape","cacao_nibs"]),
        ]},
    ],
  },
  {
    id: "phase3", weeks: t2("Weeks 5-6", "Semanas 5-6"), subtitle: t2("Optimisation", "Optimización"),
    blurb: t2("Fermented foods are now daily, and polyphenol-rich foods for Akkermansia are woven through every day.",
              "Los alimentos fermentados ya son diarios, y los alimentos ricos en polifenoles para la Akkermansia están presentes cada día."),
    days: [
      { tip: t2("Fermented sauerkraut is now a near-daily habit.","El chucrut fermentado es ya casi un hábito diario."),
        meals: [
          meal("breakfast", t2("Millet porridge with blackberries","Gachas de mijo con moras"), ["millet","blackberry","pumpkin_seed"]),
          meal("lunch", t2("Sauerkraut and lentil bowl with roasted pepper","Bol de chucrut y lentejas con pimiento asado"), ["green_lentil","sauerkraut","red_pepper","parsley"]),
          meal("dinner", t2("Stuffed cabbage with soy mince","Col rellena con picadillo de soja"), ["white_cabbage","veggie_mince","rice","tomato"]),
          meal("snack", t2("Apple with almond butter","Manzana con crema de almendra"), ["apple","almond_butter"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Oat toast with almond butter and kiwi","Tostada de avena con crema de almendra y kiwi"), ["oat_bread","almond_butter","kiwi","chia_seed"]),
          meal("lunch", t2("Rocket and radish salad with tapenade","Ensalada de rúcula y rábano con tapenade"), ["rocket","radish","soybean_sprout","olive_paste"]),
          meal("dinner", t2("Roasted Brussels sprouts and sweet potato with tofu","Coles de Bruselas y boniato asados con tofu"), ["brussels_sprout","sweet_potato","purple_carrot","tofu"]),
          meal("snack", t2("Pomegranate with gorgonzola","Granada con gorgonzola"), ["pomegranate","gorgonzola"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Chia pudding with strawberries","Pudin de chía con fresas"), ["chia_seed","oat_milk","strawberry","grape_seed_oil"]),
          meal("lunch", t2("Beetroot and carrot soup","Sopa de remolacha y zanahoria"), ["beetroot","carrot","gf_white_bread"]),
          meal("dinner", t2("Kale and chickpea stew","Guiso de col rizada y garbanzos"), ["kale","chickpea","cumin_seed","mustard"]),
          meal("snack", t2("Raisins with pine nuts","Pasas con piñones"), ["raisin","pine_nut"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Rice porridge with peach and coconut","Gachas de arroz con melocotón y coco"), ["rice","peach","coconut"]),
          meal("lunch", t2("Tomato and feta salad","Ensalada de tomate y feta"), ["tomato","feta","olive_oil"]),
          meal("dinner", t2("Aubergine and mung bean curry","Curry de berenjena y judías mungo"), ["aubergine","mung_bean","coconut_milk","rice","cumin_seed","mustard"]),
          meal("snack", t2("Blueberries with cacao nibs","Arándanos con nibs de cacao"), ["blueberry","cacao_nibs"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Buckwheat crêpes with apple compote","Crepes de trigo sarraceno con compota de manzana"), ["buckwheat","apple","mint"]),
          meal("lunch", t2("Roasted pepper and rocket salad with mozzarella","Ensalada de pimiento asado y rúcula con mozzarella"), ["red_pepper","rocket","mozzarella","olive_oil"]),
          meal("dinner", t2("Stuffed peppers with quinoa","Pimientos rellenos de quinoa"), ["red_pepper","quinoa","black_bean","parsley"]),
          meal("snack", t2("Pear with walnuts","Pera con nueces"), ["pear","walnut"]),
        ]},
      { tip: null, meals: [
          meal("breakfast", t2("Green smoothie with pear","Batido verde con pera"), ["pear","spinach","chia_seed","oat_milk"]),
          meal("lunch", t2("Sauerkraut, beetroot and goat's cheese plate","Plato de chucrut, remolacha y queso de cabra"), ["sauerkraut","beetroot","goats_cheese"]),
          meal("dinner", t2("Roasted cauliflower and turnip with tahini","Coliflor y nabo asados con tahini"), ["cauliflower","turnip","tahini"]),
          meal("snack", t2("Grapes with dark chocolate","Uvas con chocolate negro"), ["black_grape","dark_chocolate"]),
        ]},
      { tip: t2("A tagine-style dinner built with mint instead of the traditional cinnamon and ginger base.","Una cena estilo tajín hecha con menta en lugar de la tradicional base de canela y jengibre."),
        meals: [
          meal("breakfast", t2("Oat bran porridge with blackberries","Gachas de salvado de avena con moras"), ["oat_bran","blackberry","sunflower_seed"]),
          meal("lunch", t2("Lentil and carrot salad","Ensalada de lentejas y zanahoria"), ["green_lentil","carrot","parsley","lemon"]),
          meal("dinner", t2("Mediterranean vegetable stew","Guiso mediterráneo de verduras"), ["sweet_potato","aubergine","chickpea","tomato","mint"]),
          meal("snack", t2("Pickled cucumber with olives","Pepinillos con aceitunas"), ["pickled_cucumber","green_olive"]),
        ]},
    ],
  },
];

/* ============================================================
   MILESTONES
============================================================ */
export const MILESTONES = [
  { id: "baseline", day: 1, label: t2("Baseline","Línea Base"), hint: t2("Before you start","Antes de empezar") },
  { id: "phase1End", day: 14, label: t2("End of Phase 1","Fin de la Fase 1"), hint: t2("End of week 2","Fin de la semana 2") },
  { id: "phase2End", day: 28, label: t2("End of Phase 2","Fin de la Fase 2"), hint: t2("End of week 4","Fin de la semana 4") },
  { id: "phase3End", day: 42, label: t2("End of Phase 3","Fin de la Fase 3"), hint: t2("End of week 6","Fin de la semana 6") },
];
export const PHASE_START_DAYS = { phase1: 1, phase2: 15, phase3: 29 };

export function homeBanners(planDay, milestones) {
  const banners = [];
  const due = MILESTONES.find(m => m.day === planDay && !milestones[m.id]);
  if (due) banners.push({ type: "milestone", milestone: due });
  const phaseStart = Object.entries(PHASE_START_DAYS).find(([, d]) => d === planDay);
  if (phaseStart) banners.push({ type: "shopping", phaseId: phaseStart[0] });
  return banners;
}

export function groceryFor(phase) {
  const buckets = {}; CATEGORY_ORDER.forEach(c => buckets[c] = new Set());
  phase.days.forEach(d => d.meals.forEach(m => m.foods.forEach(id => {
    if (FOODS[id]) buckets[FOODS[id].cat].add(id);
  })));
  const out = {};
  CATEGORY_ORDER.forEach(c => out[c] = Array.from(buckets[c]));
  return out;
}
