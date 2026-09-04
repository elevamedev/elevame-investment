/* ============================================================
   FOOD DATABASE — one canonical entry per food. Add a language
   anywhere by adding one more name field per item, nothing else
   in the app needs to change.

   This is shared reference data (the same for every client), so
   it lives in code rather than per-client database rows. It is
   also mirrored into the `foods` table in Supabase (see
   supabase/schema.sql + scripts/seed.mjs) so plan rows can
   reference it by id.
============================================================ */
export const FOODS_RAW = {
  produce: [
    ["potato",10,"Potato","Patata"],["red_pepper",10,"Red Sweet Pointed Pepper","Pimiento Rojo Puntiagudo"],
    ["rocket",10,"Rocket","Rúcula"],["strawberry",10,"Strawberry","Fresa"],["pear",10,"Pear","Pera"],["peach",10,"Peach","Melocotón"],
    ["sweet_potato",9,"Sweet Potato","Boniato"],["red_cabbage",9,"Red Cabbage","Col Lombarda"],["brussels_sprout",9,"Brussels Sprout","Col de Bruselas"],
    ["purple_carrot",9,"Purple Carrot","Zanahoria Morada"],["kale",9,"Kale","Col Rizada"],["turnip",9,"Turnip","Nabo"],["parsley",9,"Parsley","Perejil"],
    ["cress",9,"Cress","Berro"],["beetroot",9,"Beetroot","Remolacha"],["kiwi",9,"Kiwi","Kiwi"],["raspberry",9,"Raspberry","Frambuesa"],
    ["blackberry",9,"Blackberry","Mora"],["sour_cherry",9,"Sour Cherry","Guinda"],["green_banana",9,"Banana (green, unripe)","Plátano (verde, sin madurar)"],
    ["apple",9,"Apple","Manzana"],["apricot",9,"Apricot","Albaricoque"],["green_bean",8,"Green Bean","Judía Verde"],["shallot",8,"Shallot","Chalota"],
    ["aubergine",8,"Aubergine","Berenjena"],["radish",8,"Radish","Rábano"],["cauliflower",8,"Cauliflower","Coliflor"],["carrot",8,"Carrot","Zanahoria"],
    ["collard",8,"Collard Greens","Berza"],["spring_onion",8,"Spring Onions","Cebolleta"],["tomato",8,"Tomato","Tomate"],
    ["jerusalem_artichoke",8,"Jerusalem Artichoke","Aguaturma"],["white_cabbage",8,"White Cabbage","Col Blanca"],["pomegranate",8,"Pomegranate","Granada"],
    ["blueberry",8,"Blueberry","Arándano"],["mango",8,"Mango","Mango"],["raisin",8,"Raisin","Pasa"],["black_grape",8,"Black Grape","Uva Negra"],
    ["date",8,"Date","Dátil"],["lemon",8,"Lemon","Limón"],["cranberry",8,"Cranberry","Arándano Rojo"],["grapefruit",8,"Grapefruit","Pomelo"],
    ["melon",8,"Melon","Melón"],["mung_bean_sprout",8,"Mung Bean Sprouts","Brotes de Judía Mungo"],["basil",7,"Basil","Albahaca"],
    ["coriander",7,"Coriander","Cilantro"],["celery",7,"Celery","Apio"],["orange",7,"Orange","Naranja"],["coconut",7,"Coconut","Coco"],
    ["dried_apricot",7,"Dried Apricot","Albaricoque Seco"],["fennel",7,"Fennel","Hinojo"],["chard",6,"Chard","Acelga"],
    ["courgette",6,"Courgette","Calabacín"],["broccoli",6,"Broccoli","Brócoli"],["spinach",6,"Spinach","Espinaca"],["onion",6,"Onion","Cebolla"],
    ["garlic",6,"Garlic","Ajo"],["banana",6,"Banana","Plátano"],["cherry",6,"Cherry","Cereza"],["watermelon",6,"Watermelon","Sandía"],
    ["fig",6,"Fig","Higo"],["lime",6,"Lime","Lima"],["cucumber",5,"Cucumber","Pepino"],["leek",5,"Leek","Puerro"],
    ["dried_apple",5,"Dried Apple","Manzana Seca"],["lettuce",4,"Lettuce","Lechuga"],["chilli",3,"Chilli","Chile"],["sweet_pepper",3,"Sweet Pepper","Pimiento Dulce"],
  ],
  grains: [
    ["white_flour",10,"White Flour","Harina Blanca"],["oat_bread",8,"Oat Bread","Pan de Avena"],["rice_bran",8,"Rice Bran","Salvado de Arroz"],
    ["rice",8,"Rice","Arroz"],["oat_bran",8,"Oat Bran","Salvado de Avena"],["gf_white_bread",8,"Gluten-Free White Bread","Pan Blanco Sin Gluten"],
    ["white_bread",8,"White Bread","Pan Blanco"],["rice_noodle",8,"Rice Noodle","Fideos de Arroz"],["white_tortilla",8,"White Tortilla","Tortilla de Trigo Blanca"],
    ["soybean_sprout",8,"Soybean Sprout","Brotes de Soja"],["veggie_mince",8,"Veggie Mince (Soy)","Picadillo de Soja"],["mung_bean",8,"Mung Beans","Judías Mungo"],
    ["kidney_bean",8,"Kidney Bean","Judía Roja"],["millet",7,"Millet","Mijo"],["pasta",7,"Pasta","Pasta"],["edamame",7,"Edamame","Edamame"],
    ["red_lentil",7,"Red Lentil","Lenteja Roja"],["brown_rice",6,"Brown Rice","Arroz Integral"],["rice_flour",6,"Rice Flour","Harina de Arroz"],
    ["rye_bread",6,"Rye Bread","Pan de Centeno"],["green_lentil",6,"Green Lentil","Lenteja Verde"],["chickpea",6,"Chickpea","Garbanzo"],
    ["buckwheat",5,"Buckwheat","Trigo Sarraceno"],["quinoa",5,"Quinoa","Quinoa"],["black_bean",5,"Black Bean","Judía Negra"],
  ],
  dairy: [
    ["cream",8,"Cream","Nata"],["sour_cream",8,"Sour Cream","Nata Agria"],["gorgonzola",8,"Gorgonzola","Gorgonzola"],
    ["yoghurt_ff",7,"Yoghurt (Fat Free)","Yogur Desnatado"],["coconut_milk",7,"Coconut Milk","Leche de Coco"],["oat_milk",7,"Oat Milk","Leche de Avena"],
    ["cream_cheese",7,"Cream Cheese","Queso Crema"],["tofu",7,"Tofu","Tofu"],["halloumi",7,"Halloumi","Halloumi"],["feta",7,"Feta Cheese","Queso Feta"],
    ["eggs",7,"Eggs","Huevos"],["yoghurt_full",6,"Yoghurt (Full Fat)","Yogur Entero"],["goats_cheese",6,"Goat's Cheese","Queso de Cabra"],
    ["cheddar",6,"Cheddar Cheese","Queso Cheddar"],["mozzarella",6,"Mozzarella Cheese","Mozzarella"],["egg_white",6,"Egg White","Clara de Huevo"],
    ["whole_milk",3,"Whole Milk","Leche Entera"],
  ],
  nuts: [
    ["black_olive",9,"Black Olive","Aceituna Negra"],["coconut_oil",9,"Coconut Oil","Aceite de Coco"],["green_olive",9,"Green Olive","Aceituna Verde"],
    ["sunflower_oil",8,"Sunflower Oil","Aceite de Girasol"],["sunflower_seed",8,"Sunflower Seed","Semillas de Girasol"],["chestnut",8,"Chestnut","Castaña"],
    ["chia_seed",8,"Chia Seed","Semillas de Chía"],["grape_seed_oil",8,"Grape Seed Oil","Aceite de Semilla de Uva"],["pecan",8,"Pecan","Pacana"],
    ["pumpkin_seed",8,"Pumpkin Seed","Semillas de Calabaza"],["pine_nut",8,"Pine Nut","Piñón"],["almond_butter",8,"Almond Butter","Crema de Almendra"],
    ["olive_oil",7,"Olive Oil","Aceite de Oliva"],["cashew",7,"Cashew","Anacardo"],["macadamia",7,"Macadamia","Macadamia"],
    ["walnut",4,"Walnut","Nuez"],["almond",4,"Almond","Almendra"],
  ],
  herbs: [
    ["olive_paste",9,"Olive Paste","Paté de Aceitunas"],["grape_molasses",8,"Grape Molasses","Melaza de Uva"],["pickled_cucumber",8,"Pickled Cucumber","Pepinillo"],
    ["cacao_nibs",8,"Cacao Nibs","Nibs de Cacao"],["mint",8,"Mint","Menta"],["mustard",8,"Mustard","Mostaza"],["chamomile_tea",8,"Chamomile Tea","Manzanilla"],
    ["coffee",8,"Coffee","Café"],["cumin_seed",7,"Cumin Seeds","Comino"],["salt",7,"Salt","Sal"],["sauerkraut",7,"Sauerkraut","Chucrut"],
    ["dark_chocolate",7,"Dark Chocolate","Chocolate Negro"],["green_tea",7,"Green Tea","Té Verde"],["mineral_water",7,"Mineral Water","Agua Mineral"],
    ["soy_sauce",6,"Soy Sauce","Salsa de Soja"],["tahini",5,"Tahini","Tahini"],["black_pepper",4,"Black Pepper","Pimienta Negra"],
    ["turmeric",3,"Turmeric","Cúrcuma"],["star_anise",3,"Star Anise","Anís Estrellado"],["cinnamon",1,"Cinnamon","Canela"],["ginger",0,"Ginger","Jengibre"],
    ["honey",2,"Honey","Miel"],
  ],
};

export const FOODS = {};
Object.entries(FOODS_RAW).forEach(([cat, list]) =>
  list.forEach(([id, score, en, es]) => { FOODS[id] = { cat, score, en, es }; })
);

export const CATEGORY_ORDER = ["produce", "grains", "dairy", "nuts", "herbs"];

export function foodName(id, lang) { return FOODS[id] ? FOODS[id][lang] : id; }
export function foodScore(id) { return FOODS[id] ? FOODS[id].score : 0; }

export const t2 = (en, es) => ({ en, es });
