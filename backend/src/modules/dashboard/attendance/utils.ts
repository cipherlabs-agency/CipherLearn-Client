export function getMonthRangeInUTC(yearNum: number, monthNum: number) {
  const monthIndex = monthNum - 1;
  const tzOffsetMinutes = 5 * 60 + 30;

  const startLocalUtcMs = Date.UTC(yearNum, monthIndex, 1); // gives 00:00 local? -> this is UTC of that date

  const startUtcMs = startLocalUtcMs - tzOffsetMinutes * 60 * 1000;

  const nextMonthLocalUtcMs = Date.UTC(yearNum, monthIndex + 1, 1);
  const endUtcMs = nextMonthLocalUtcMs - tzOffsetMinutes * 60 * 1000;

  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

export function toIntOrDefault(val: number | string | undefined, fallback: number) {
  if (val === undefined) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}
