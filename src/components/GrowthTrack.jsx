import { Leaf } from "lucide-react";
import { C } from "../theme.js";

export default function GrowthTrack({ progress }) {
  const filled = Math.round(progress * 6);
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Leaf key={i} size={16} strokeWidth={2.2} color={i < filled ? C.sage : C.line} fill={i < filled ? C.sage : "none"} />
      ))}
    </div>
  );
}
