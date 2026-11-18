export const money = (value) =>
  `KSh ${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;

export const discountPercent = (product) =>
  product && product.was && product.was > product.price
    ? Math.round(((product.was - product.price) / product.was) * 100)
    : 0;

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
