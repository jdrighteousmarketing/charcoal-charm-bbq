export function money(value) {
  return Number(value || 0).toFixed(2);
}

export function number(value) {
  return Number(value || 0).toLocaleString();
}

export function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function customerLabel(customer) {
  return (
    customer?.name ||
    customer?.email ||
    customer?.customer_code ||
    'Customer'
  );
}

export function compactMoney(value) {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(amount) >= 10000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }

  return `$${money(amount)}`;
}