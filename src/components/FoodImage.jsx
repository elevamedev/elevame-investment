import { useState } from "react";
import { FOOD_PHOTOS, CATEGORY_TINT, foodEmoji } from "../data/foodVisuals.js";

// Shows the food's photo if one exists in /public/foods, otherwise a soft
// tinted tile with the food's emoji. Same footprint either way.
export default function FoodImage({ id, cat, size = 64, rounded = 16, className = "" }) {
  const [broken, setBroken] = useState(false);
  const [a, b] = CATEGORY_TINT[cat] || ["#f3f1ff", "#e4e0fb"];
  const usePhoto = FOOD_PHOTOS.has(id) && !broken;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size === "fill" ? "100%" : size,
        height: size === "fill" ? "100%" : size,
        borderRadius: rounded,
        background: `radial-gradient(120% 90% at 30% 20%, #ffffff 0%, ${a} 45%, ${b} 100%)`,
      }}
    >
      {usePhoto ? (
        <img src={`/foods/${id}.jpg`} alt="" loading="lazy" onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span aria-hidden style={{ fontSize: size === "fill" ? 44 : Math.round(size * 0.5), lineHeight: 1, filter: "drop-shadow(0 4px 6px rgba(26,29,46,0.12))" }}>
          {foodEmoji(id, cat)}
        </span>
      )}
    </div>
  );
}
