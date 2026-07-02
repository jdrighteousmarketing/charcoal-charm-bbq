export function getOrderTotal(order) {
  return Number(order?.total_amount ?? 0);
}

export function getPointAmount(transaction) {
  return Number(transaction?.points_amount ?? 0);
}

export function isInRange(value, start, end) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date >= new Date(start) && date <= new Date(end);
}