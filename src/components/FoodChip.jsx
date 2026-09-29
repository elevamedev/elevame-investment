import { foodName, foodScore } from "../data/foods.js";
import { C } from "../theme.js";
import ScorePill from "./ScorePill.jsx";

export default function FoodChip({ id, lang }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm mr-2 mb-1.5">
      <span style={{ color: C.text }}>{foodName(id, lang)}</span>
      <ScorePill score={foodScore(id)} />
    </span>
  );
}
