export const MENU_CATALOG = [
  {
    category: 'Burger',
    items: ['Chicken Burger', 'Veg Burger', 'Mushroom Burger', 'Paneer Burger']
  },
  {
    category: 'Ice Cream',
    items: ['Vanilla', 'Strawberry', 'Pista', 'Butterscotch', 'Chocolate']
  },
  {
    category: 'Pizza',
    items: ['Margherita', 'Farmhouse', 'Pepperoni', 'Mushroom']
  },
  {
    category: 'Juice',
    items: ['Orange Juice', 'Mango Juice', 'Watermelon Juice', 'Pineapple Juice']
  }
];

export const CATEGORY_THEME = {
  Burger: {
    card: 'from-rose-100 to-red-200 border-red-300',
    badge: 'bg-red-600 text-white'
  },
  'Ice Cream': {
    card: 'from-pink-100 to-fuchsia-200 border-fuchsia-300',
    badge: 'bg-fuchsia-600 text-white'
  },
  Pizza: {
    card: 'from-amber-100 to-orange-200 border-orange-300',
    badge: 'bg-orange-600 text-white'
  },
  Juice: {
    card: 'from-lime-100 to-emerald-200 border-emerald-300',
    badge: 'bg-emerald-600 text-white'
  },
  Uncategorized: {
    card: 'from-slate-100 to-slate-200 border-slate-300',
    badge: 'bg-slate-600 text-white'
  }
};

export function getItemsForCategory(category) {
  const categoryRow = MENU_CATALOG.find((row) => row.category === category);
  return categoryRow ? categoryRow.items : [];
}

export function getCategoryForItem(itemName) {
  if (!itemName) {
    return 'Uncategorized';
  }
  const normalized = itemName.trim().toLowerCase();
  const categoryRow = MENU_CATALOG.find((row) =>
    row.items.some((item) => item.toLowerCase() === normalized)
  );
  return categoryRow ? categoryRow.category : 'Uncategorized';
}

export function getCategoryTheme(categoryName) {
  return CATEGORY_THEME[categoryName] || CATEGORY_THEME.Uncategorized;
}
