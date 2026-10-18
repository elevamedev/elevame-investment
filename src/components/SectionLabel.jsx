import { C } from "../theme.js";

export default function SectionLabel({ children, id }) {
  return <div id={id} style={{ color: C.textSoft, scrollMarginTop: 90 }} className="text-[13px] font-medium mb-2">{children}</div>;
}
