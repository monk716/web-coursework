export const categoryLabels = {
  furniture: 'Мебель', 'home-decoration': 'Для дома', laptops: 'Ноутбуки',
  'mobile-accessories': 'Аксессуары'
};
export const apiCategories = Object.keys(categoryLabels);
export const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

// DummyJSON returns USD prices. No fictional currency conversion is applied.
export function selectProducts(products, { query = '', category = 'all', sort = 'default', maxPrice = '' } = {}) {
  const text = query.trim().toLocaleLowerCase();
  const result = products.filter(product =>
    (category === 'all' || product.category === category) &&
    (!text || `${product.title} ${product.brand || ''}`.toLocaleLowerCase().includes(text)) &&
    (maxPrice === '' || product.price <= Number(maxPrice))
  );
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  return result;
}

export async function loadProducts(signal) {
  const pages = await Promise.all(apiCategories.map(async category => {
    const response = await fetch(`https://dummyjson.com/products/category/${category}?limit=100`, { signal });
    if (!response.ok) throw new Error(`API вернул ошибку ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('API вернул неожиданный ответ.');
    return data.products;
  }));
  return pages.flat();
}
