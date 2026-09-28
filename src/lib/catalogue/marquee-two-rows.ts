/** Same row split as fashion marquee — even distribution + row2 rotation. */
export function splitMarqueeTwoRows<T>(items: T[]): { row1: T[]; row2: T[] } {
  const row1: T[] = [];
  const row2: T[] = [];
  for (let i = 0; i < items.length; i += 1) {
    if (i % 2 === 0) row1.push(items[i]);
    else row2.push(items[i]);
  }
  const rotate = Math.max(1, Math.floor(row2.length / 3));
  const row2Varied = row2.length ? [...row2.slice(rotate), ...row2.slice(0, rotate)] : row2;
  return { row1, row2: row2Varied };
}
