// The client's own local day (brief 4.15: "Dates are the phone's local
// day"), not the UTC day `Date#toISOString()` gives — those two differ
// for part of every day outside UTC+0, which is every day in Madrid
// (UTC+1/+2). Acceptance test 9/9 catches exactly this: a check-in
// made between 00:00 and 02:00 Madrid time must land on the Madrid
// day, which toISOString().slice(0, 10) would get wrong until 01:00
// (or 02:00 in summer) UTC.
export function isoDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
