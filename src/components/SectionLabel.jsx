import { C } from "../theme.js";

export default function SectionLabel({ children }) {
  return <div style={{ color: C.textSoft }} className="text-[13px] font-medium mb-2">{children}</div>;
}
