/**
 * Self-contained bilingual copy for ReportView/ThemeDetailView, kept
 * out of src/i18n/strings.js so this fork doesn't touch shared
 * files — the coordinator merges this into strings.js during final
 * integration.
 */
export const REPORT_COPY = {
  en: {
    title: "Your report",
    intro: "Explore your results by topic.",
    retestLabel: n => `Test ${n}`,
    loading: "Loading your report...",
    emptyNoClient: "We don't have a report linked to your account yet.",
    emptyNoTest: "No published report yet — check back once your results are ready.",
    back: "Back",
    nothingFlagged: "Nothing flagged for this theme yet.",
    tagGood: "Strength",
    tagWatch: "Within range",
    tagAct: "Focus area",
    keyBacteriaTitle: "Key bacteria",
    keyBacteriaSub: "Your level vs. the community average",
    you: "You",
    community: "Community avg.",
    safetyTitle: "Safety screen summary",
    detected: "detected",
    notDetected: "not detected",
    seeFoods: "See the Foods tab",
    seeSupplements: "See Supplements",
    foodNote: "Your personalized food scores live in the Foods tab.",
    supplementsNote: "Prebiotic and probiotic picks based on your report.",
    noMetricsYet: "No measurements for this topic yet.",
  },
  es: {
    title: "Tu informe",
    intro: "Explora tus resultados por tema.",
    retestLabel: n => `Test ${n}`,
    loading: "Cargando tu informe...",
    emptyNoClient: "Todavía no tienes un informe vinculado a tu cuenta.",
    emptyNoTest: "Aún no hay un informe publicado — vuelve a consultarlo cuando tus resultados estén listos.",
    back: "Atrás",
    nothingFlagged: "Todavía no hay nada señalado para este tema.",
    tagGood: "Punto fuerte",
    tagWatch: "Dentro del rango",
    tagAct: "Área de enfoque",
    keyBacteriaTitle: "Bacterias clave",
    keyBacteriaSub: "Tu nivel frente a la media de la comunidad",
    you: "Tú",
    community: "Media comunidad",
    safetyTitle: "Resumen del control de seguridad",
    detected: "detectado",
    notDetected: "no detectado",
    seeFoods: "Ver la pestaña de Alimentos",
    seeSupplements: "Ver Suplementos",
    foodNote: "Tus puntuaciones de alimentos personalizadas están en la pestaña de Alimentos.",
    supplementsNote: "Recomendaciones de prebióticos y probióticos según tu informe.",
    noMetricsYet: "Todavía no hay mediciones para este tema.",
  },
};

export const TAG_FOR_BADGE = { good: "tagGood", watch: "tagWatch", act: "tagAct" };
export const COLOR_FOR_BADGE = { good: "sageText", watch: "amberText", act: "redText" };
