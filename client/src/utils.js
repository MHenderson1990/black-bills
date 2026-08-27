export function formatMoney(x) {
  if (x === null || x === undefined || isNaN(x)) return '0.00';
  return Number.isInteger(x) ? x : x.toFixed(2);
}