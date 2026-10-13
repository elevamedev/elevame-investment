/* ============================================================
   FOOD VISUALS — the picture shown for each food on the
   "Foods" page.

   Two layers:
   1. FOOD_PHOTOS: ids that have a real photo in /public/foods/<id>.jpg.
      Drop a square photo in that folder and add its id here, and the
      page uses the photo automatically. Empty for now.
   2. FOOD_EMOJI: the fallback shown on a soft tinted tile until a
      photo exists. Anything not listed falls back to its category.
============================================================ */
export const FOOD_PHOTOS = new Set([]);

export const CATEGORY_EMOJI = {
  produce: "🥬", grains: "🌾", dairy: "🥚", nuts: "🌰", herbs: "🌿",
};

// Soft tile tint per category, so the grid reads like a fresh market spread.
export const CATEGORY_TINT = {
  produce: ["#eaf6ec", "#d7eedb"],
  grains: ["#faf3e6", "#f2e4c8"],
  dairy: ["#f3f1ff", "#e4e0fb"],
  nuts: ["#f7efe8", "#ecdccd"],
  herbs: ["#ecf6f1", "#d5ebe0"],
};

export const FOOD_EMOJI = {
  // produce
  potato: "🥔", red_pepper: "🫑", rocket: "🥬", strawberry: "🍓", pear: "🍐", peach: "🍑",
  sweet_potato: "🍠", red_cabbage: "🥬", brussels_sprout: "🥬", purple_carrot: "🥕", kale: "🥬",
  turnip: "🥔", parsley: "🌿", cress: "🌱", beetroot: "🍠", kiwi: "🥝", raspberry: "🍓",
  blackberry: "🫐", sour_cherry: "🍒", green_banana: "🍌", apple: "🍎", apricot: "🍑",
  green_bean: "🫛", shallot: "🧅", aubergine: "🍆", radish: "🌱", cauliflower: "🥦", carrot: "🥕",
  collard: "🥬", spring_onion: "🧅", tomato: "🍅", jerusalem_artichoke: "🥔", white_cabbage: "🥬",
  pomegranate: "🍎", blueberry: "🫐", mango: "🥭", raisin: "🍇", black_grape: "🍇", date: "🌴",
  lemon: "🍋", cranberry: "🍒", grapefruit: "🍊", melon: "🍈", mung_bean_sprout: "🌱",
  basil: "🌿", coriander: "🌿", celery: "🥬", orange: "🍊", coconut: "🥥", dried_apricot: "🍑",
  fennel: "🥬", chard: "🥬", courgette: "🥒", broccoli: "🥦", spinach: "🥬", onion: "🧅",
  garlic: "🧄", banana: "🍌", cherry: "🍒", watermelon: "🍉", fig: "🍈", lime: "🍋",
  cucumber: "🥒", leek: "🥬", dried_apple: "🍎", lettuce: "🥬", chilli: "🌶️", sweet_pepper: "🫑",
  // grains, bread & legumes
  white_flour: "🌾", oat_bread: "🍞", rice_bran: "🌾", rice: "🍚", oat_bran: "🌾",
  gf_white_bread: "🍞", white_bread: "🍞", rice_noodle: "🍜", white_tortilla: "🫓",
  soybean_sprout: "🌱", veggie_mince: "🫘", mung_bean: "🫘", kidney_bean: "🫘", millet: "🌾",
  pasta: "🍝", edamame: "🫛", red_lentil: "🫘", brown_rice: "🍚", rice_flour: "🌾",
  rye_bread: "🍞", green_lentil: "🫘", chickpea: "🫘", buckwheat: "🌾", quinoa: "🌾", black_bean: "🫘",
  // dairy, eggs & plant proteins
  cream: "🥛", sour_cream: "🥛", gorgonzola: "🧀", yoghurt_ff: "🥣", coconut_milk: "🥥",
  oat_milk: "🥛", cream_cheese: "🧀", tofu: "🧈", halloumi: "🧀", feta: "🧀", eggs: "🥚",
  yoghurt_full: "🥣", goats_cheese: "🧀", cheddar: "🧀", mozzarella: "🧀", egg_white: "🥚", whole_milk: "🥛",
  // nuts, seeds & oils
  black_olive: "🫒", coconut_oil: "🥥", green_olive: "🫒", sunflower_oil: "🌻", sunflower_seed: "🌻",
  chestnut: "🌰", chia_seed: "🌱", grape_seed_oil: "🍇", pecan: "🌰", pumpkin_seed: "🎃",
  pine_nut: "🌰", almond_butter: "🥜", olive_oil: "🫒", cashew: "🥜", macadamia: "🌰",
  walnut: "🌰", almond: "🥜",
  // herbs, spices & condiments
  olive_paste: "🫒", grape_molasses: "🍇", pickled_cucumber: "🥒", cacao_nibs: "🍫", mint: "🌿",
  mustard: "🟡", chamomile_tea: "🍵", coffee: "☕", cumin_seed: "🌿", salt: "🧂", sauerkraut: "🥬",
  dark_chocolate: "🍫", green_tea: "🍵", mineral_water: "💧", soy_sauce: "🥢", tahini: "🥣",
  black_pepper: "🌶️", turmeric: "🟠", star_anise: "⭐", cinnamon: "🪵", ginger: "🫚", honey: "🍯",
};

export function foodEmoji(id, cat) {
  return FOOD_EMOJI[id] || CATEGORY_EMOJI[cat] || "🍽️";
}
