/**
 * Static v2 catalogue seed data — the same for every client, straight
 * from DATA_MODEL_SPEC.md ("Theme catalogue", "Status and direction
 * rules", "Extraction map"). Only the per-test tables differ per
 * client/report; these rows never change unless Enbiosis adds items.
 */

export const THEMES = [
  { id: "overview", name_en: "Your gut at a glance", name_es: "Tu intestino de un vistazo", client_question_en: "How healthy is my gut overall?", client_question_es: "¿Qué tan saludable está mi intestino en general?", sort_order: 0 },
  { id: "digestion", name_en: "Digestion and comfort", name_es: "Digestión y bienestar", client_question_en: "Why do I feel how I feel after eating?", client_question_es: "¿Por qué me siento así después de comer?", sort_order: 1 },
  { id: "metabolism", name_en: "Metabolism and weight", name_es: "Metabolismo y peso", client_question_en: "How does my gut handle energy and sugar?", client_question_es: "¿Cómo maneja mi intestino la energía y el azúcar?", sort_order: 2 },
  { id: "inflammation", name_en: "Inflammation and gut lining", name_es: "Inflamación y barrera intestinal", client_question_en: "Is my gut protecting me?", client_question_es: "¿Me está protegiendo mi intestino?", sort_order: 3 },
  { id: "heart", name_en: "Heart and long term health", name_es: "Corazón y salud a largo plazo", client_question_en: "What should I keep an eye on?", client_question_es: "¿Qué debo vigilar?", sort_order: 4 },
  { id: "mind", name_en: "Mind, sleep and vitamins", name_es: "Mente, sueño y vitaminas", client_question_en: "How does my gut affect my energy and mood?", client_question_es: "¿Cómo afecta mi intestino mi energía y estado de ánimo?", sort_order: 5 },
  { id: "safety", name_en: "Safety screen", name_es: "Control de seguridad", client_question_en: "Is anything harmful there?", client_question_es: "¿Hay algo dañino presente?", sort_order: 6 },
  { id: "food", name_en: "What to eat", name_es: "Qué comer", client_question_en: "What should I eat more or less of?", client_question_es: "¿Qué debería comer más o menos?", sort_order: 7 },
  { id: "supplements", name_en: "Supplements", name_es: "Suplementos", client_question_en: "Which supplements fit me?", client_question_es: "¿Qué suplementos me convienen?", sort_order: 8 },
];

// kind: 'headline' (the 4 top-line numbers) or 'gut_score' (the 13 panel scores).
// direction matches the "Status and direction rules" table exactly.
export const METRICS = [
  { id: "microbiome_age", theme_id: "overview", kind: "headline", name_en: "Microbiome age", name_es: "Edad del microbioma", direction: "below_age", sort_order: 0,
    explanation_en: "Compares the bacterial makeup of your gut to patterns typically seen at different ages. A microbiome age below your real age is generally considered favorable.",
    explanation_es: "Compara la composición bacteriana de tu intestino con los patrones típicos de distintas edades. Una edad del microbioma por debajo de tu edad real suele considerarse favorable." },
  { id: "diversity", theme_id: "overview", kind: "headline", name_en: "Diversity", name_es: "Diversidad", direction: "higher_better", scale_min: 0, scale_max: 10, sort_order: 1,
    explanation_en: "Measures how many different kinds of bacteria live in your gut. A wider mix is generally associated with a more resilient microbiome.",
    explanation_es: "Mide cuántos tipos distintos de bacterias viven en tu intestino. Una mayor variedad suele asociarse con un microbioma más resiliente." },
  { id: "wellness_index", theme_id: "overview", kind: "headline", name_en: "Wellness index", name_es: "Índice de bienestar", direction: "categorical", sort_order: 2,
    explanation_en: "A composite score summarizing whether your overall bacterial pattern resembles profiles linked to lower or higher chronic-disease risk in research.",
    explanation_es: "Una puntuación compuesta que resume si tu patrón bacteriano general se asemeja a perfiles asociados en estudios con un riesgo más bajo o más alto de enfermedad crónica." },
  { id: "f_b_ratio", theme_id: "overview", kind: "headline", name_en: "F/B ratio", name_es: "Ratio F/B", direction: "flag_high", sort_order: 3,
    explanation_en: "The balance between two major bacterial groups, Firmicutes and Bacteroidetes. Shifts in this ratio have been studied in relation to calorie extraction and weight regulation.",
    explanation_es: "El equilibrio entre dos grandes grupos bacterianos, Firmicutes y Bacteroidetes. Los cambios en esta proporción se han estudiado en relación con la extracción de calorías y la regulación del peso." },
  { id: "bowel_mobility", theme_id: "digestion", kind: "gut_score", name_en: "Bowel mobility", name_es: "Motilidad intestinal", direction: "middle_best", sort_order: 0,
    explanation_en: "Reflects bacterial patterns associated with how quickly food moves through your digestive tract. The ideal range is a middle ground — not too slow, not too fast.",
    explanation_es: "Refleja los patrones bacterianos asociados a la velocidad con la que los alimentos atraviesan tu tracto digestivo. El rango ideal es un punto intermedio: ni demasiado lento ni demasiado rápido." },
  { id: "carbohydrate_metabolism", theme_id: "digestion", kind: "gut_score", name_en: "Carbohydrate metabolism", name_es: "Metabolismo de carbohidratos", direction: "higher_better", sort_order: 1,
    explanation_en: "How effectively your gut bacteria break down and process carbohydrates from your diet.",
    explanation_es: "Qué tan eficazmente tus bacterias intestinales descomponen y procesan los carbohidratos de tu dieta." },
  { id: "protein_metabolism", theme_id: "digestion", kind: "gut_score", name_en: "Protein metabolism", name_es: "Metabolismo de proteínas", direction: "higher_better", sort_order: 2,
    explanation_en: "How effectively your gut bacteria break down and process dietary protein.",
    explanation_es: "Qué tan eficazmente tus bacterias intestinales descomponen y procesan las proteínas de la dieta." },
  { id: "fat_metabolism", theme_id: "digestion", kind: "gut_score", name_en: "Fat metabolism", name_es: "Metabolismo de grasas", direction: "higher_better", sort_order: 3,
    explanation_en: "How effectively your gut bacteria break down and process dietary fats.",
    explanation_es: "Qué tan eficazmente tus bacterias intestinales descomponen y procesan las grasas de la dieta." },
  { id: "lactose_sensitivity", theme_id: "digestion", kind: "gut_score", name_en: "Lactose sensitivity", name_es: "Sensibilidad a la lactosa", direction: "lower_better", sort_order: 4,
    explanation_en: "Bacterial patterns associated with how well your gut tolerates lactose, the sugar found in dairy products.",
    explanation_es: "Patrones bacterianos asociados con la tolerancia de tu intestino a la lactosa, el azúcar presente en los lácteos." },
  { id: "gluten_sensitivity", theme_id: "digestion", kind: "gut_score", name_en: "Gluten sensitivity", name_es: "Sensibilidad al gluten", direction: "lower_better", sort_order: 5,
    explanation_en: "Bacterial patterns associated with gluten tolerance.",
    explanation_es: "Patrones bacterianos asociados con la tolerancia al gluten." },
  { id: "metabolic_score", theme_id: "metabolism", kind: "gut_score", name_en: "Metabolic score", name_es: "Puntuación metabólica", direction: "lower_better", sort_order: 0,
    explanation_en: "A composite measure of how your gut's bacterial profile relates to metabolic health and energy balance.",
    explanation_es: "Una medida compuesta de cómo se relaciona el perfil bacteriano de tu intestino con la salud metabólica y el balance energético." },
  { id: "sugar_index", theme_id: "metabolism", kind: "gut_score", name_en: "Sugar index", name_es: "Índice de azúcar", direction: "lower_better", sort_order: 1,
    explanation_en: "Bacterial patterns associated with sugar processing in the gut.",
    explanation_es: "Patrones bacterianos asociados con el procesamiento del azúcar en el intestino." },
  { id: "processed_food_index", theme_id: "inflammation", kind: "gut_score", name_en: "Processed food index", name_es: "Índice de alimentos procesados", direction: "lower_better", sort_order: 0,
    explanation_en: "How closely your microbiome resembles bacterial profiles typically seen in diets higher in processed foods.",
    explanation_es: "Qué tanto se parece tu microbioma a los perfiles bacterianos que suelen observarse en dietas con más alimentos procesados." },
  { id: "antibiotic_damage", theme_id: "inflammation", kind: "gut_score", name_en: "Antibiotic damage", name_es: "Daño por antibióticos", direction: "lower_better", sort_order: 1,
    explanation_en: "Signs in your gut bacteria consistent with past antibiotic use affecting microbial diversity.",
    explanation_es: "Señales en tus bacterias intestinales compatibles con un uso previo de antibióticos que haya afectado a la diversidad microbiana." },
  { id: "autoimmune_index", theme_id: "inflammation", kind: "gut_score", name_en: "Autoimmune index", name_es: "Índice autoinmune", direction: "lower_better", sort_order: 2,
    explanation_en: "Bacterial patterns that research has associated with autoimmune-linked profiles.",
    explanation_es: "Patrones bacterianos que la investigación ha asociado con perfiles vinculados a procesos autoinmunes." },
  { id: "sleep_quality", theme_id: "mind", kind: "gut_score", name_en: "Sleep quality", name_es: "Calidad del sueño", direction: "higher_better", sort_order: 0,
    explanation_en: "Bacterial patterns associated with sleep regulation — gut bacteria influence several compounds involved in sleep.",
    explanation_es: "Patrones bacterianos asociados con la regulación del sueño: las bacterias intestinales influyen en varios compuestos implicados en el sueño." },
  { id: "vitamin_synthesis", theme_id: "mind", kind: "gut_score", name_en: "Vitamin synthesis", name_es: "Síntesis de vitaminas", direction: "higher_better", sort_order: 1,
    explanation_en: "How much your gut bacteria contribute to producing vitamins, like B vitamins, as a byproduct of digestion.",
    explanation_es: "Cuánto contribuyen tus bacterias intestinales a producir vitaminas, como las del grupo B, como subproducto de la digestión." },
].map(m => ({ audience: "both", ...m }));

export const SCREEN_PANELS = [
  { id: "pathogens", name_en: "Pathogenic bacteria", name_es: "Bacterias patógenas" },
  { id: "parasites", name_en: "Parasites", name_es: "Parásitos" },
  { id: "fungi", name_en: "Fungi", name_es: "Hongos" },
  { id: "overgrowth", name_en: "Dysbiotic / overgrowth bacteria", name_es: "Bacterias de sobrecrecimiento disbiótico" },
  { id: "autoimmune_triggers", name_en: "Autoimmune triggers", name_es: "Desencadenantes autoinmunes" },
];

// 14 user-report categories, in printed order. shopping_list_group
// maps onto the v1 foods.category enum (produce/grains/dairy/nuts/
// herbs) where there's a reasonable fit, for the existing
// shopping-list feature — null where the v1 catalog has no
// equivalent bucket (meat, fish, oils, drinks, supplements, legumes).
export const FOOD_CATEGORIES = [
  { id: "dairy", name_en: "Milk and Dairy Products", name_es: "Leche y Productos Lácteos", sort_order: 0, shopping_list_group: "dairy" },
  { id: "cheese", name_en: "Cheese Types", name_es: "Tipos de Queso", sort_order: 1, shopping_list_group: "dairy" },
  { id: "meat_eggs", name_en: "Meat and Eggs", name_es: "Carne y Huevos", sort_order: 2, shopping_list_group: null },
  { id: "fish_seafood", name_en: "Fish and Seafood", name_es: "Pescado y Marisco", sort_order: 3, shopping_list_group: null },
  { id: "bread_cereals", name_en: "Bread and Cereals", name_es: "Pan y Cereales", sort_order: 4, shopping_list_group: "grains" },
  { id: "legumes", name_en: "Legume and Legume-based Products", name_es: "Legumbres y Derivados", sort_order: 5, shopping_list_group: null },
  { id: "vegetables", name_en: "Vegetables", name_es: "Verduras", sort_order: 6, shopping_list_group: "produce" },
  { id: "fruits", name_en: "Fruits", name_es: "Frutas", sort_order: 7, shopping_list_group: "produce" },
  { id: "oils_fats", name_en: "Oil and Fats", name_es: "Aceites y Grasas", sort_order: 8, shopping_list_group: null },
  { id: "nuts_seeds", name_en: "Nut and Seeds", name_es: "Frutos Secos y Semillas", sort_order: 9, shopping_list_group: "nuts" },
  { id: "drinks", name_en: "Drinks", name_es: "Bebidas", sort_order: 10, shopping_list_group: null },
  { id: "herbs_spices_sauces", name_en: "Herb, Spice and Sauces", name_es: "Hierbas, Especias y Salsas", sort_order: 11, shopping_list_group: "herbs" },
  { id: "supplements", name_en: "Supplements", name_es: "Suplementos", sort_order: 12, shopping_list_group: null },
  { id: "others", name_en: "Others", name_es: "Otros", sort_order: 13, shopping_list_group: null },
];

export async function seedThemes(supabase) {
  const { error } = await supabase.from("themes").upsert(THEMES);
  if (error) throw error;
  return THEMES.length;
}

export async function seedMetrics(supabase) {
  const { error } = await supabase.from("metrics").upsert(METRICS);
  if (error) throw error;
  return METRICS.length;
}

export async function seedScreenPanels(supabase) {
  const { error } = await supabase.from("screen_panels").upsert(SCREEN_PANELS);
  if (error) throw error;
  return SCREEN_PANELS.length;
}

export async function seedFoodCategories(supabase) {
  const { error } = await supabase.from("food_categories").upsert(FOOD_CATEGORIES);
  if (error) throw error;
  return FOOD_CATEGORIES.length;
}
