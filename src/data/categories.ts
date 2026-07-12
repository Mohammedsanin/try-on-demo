export interface SubCategory {
  id: string;
  label: string;
  keywords: string[]; // matched against garment filename (lowercase, no ext)
}

export interface Category {
  id: string;
  label: string;
  subCategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'gents',
    label: 'Gents',
    subCategories: [
      { id: 'g-shirts',  label: 'Shirts',   keywords: ['shirt','formal','casual','combat','oxford','linen'] },
      { id: 'g-tshirts', label: 'T-Shirts', keywords: ['tshirt','t-shirt','tee','polo'] },
      { id: 'g-pants',   label: 'Pants',    keywords: ['pant','trouser','jean','chino','cargo','slack'] },
      { id: 'g-kurta',   label: 'Kurta',    keywords: ['kurta','kurtha','dhoti'] },
      { id: 'g-blazer',  label: 'Blazer',   keywords: ['blazer','suit','coat','jacket'] },
      { id: 'g-shorts',  label: 'Shorts',   keywords: ['short','bermuda'] },
    ],
  },
  {
    id: 'ladies',
    label: 'Ladies',
    subCategories: [
      { id: 'l-saree',     label: 'Saree',     keywords: ['saree','sari'] },
      { id: 'l-churidar',  label: 'Churidar',  keywords: ['churidar','salwar','kurti','kurthi'] },
      { id: 'l-dress',     label: 'Dress',     keywords: ['dress','gown','frock','skirt'] },
      { id: 'l-tops',      label: 'Tops',      keywords: ['top','blouse','ladies','women'] },
      { id: 'l-lehenga',   label: 'Lehenga',   keywords: ['lehenga','ghagra'] },
    ],
  },
  {
    id: 'kids',
    label: 'Kids',
    subCategories: [
      { id: 'k-boys',   label: 'Boys',   keywords: ['boy','kids-boy'] },
      { id: 'k-girls',  label: 'Girls',  keywords: ['girl','kids-girl'] },
      { id: 'k-all',    label: 'All',    keywords: ['kid','child','junior'] },
    ],
  },
  {
    id: 'others',
    label: 'Others',
    subCategories: [
      { id: 'o-all',    label: 'All Items', keywords: [] },
    ],
  },
];

/** Returns category+subCategory IDs for a garment filename */
export function classifyGarment(filename: string): { catId: string; subId: string } | null {
  const base = filename.toLowerCase().replace(/\.glb$/i, '').replace(/[_\s-]+/g, '');
  for (const cat of CATEGORIES) {
    if (cat.id === 'others') continue;
    for (const sub of cat.subCategories) {
      if (sub.keywords.some(k => base.includes(k.replace(/[_\s-]+/g,'')))) {
        return { catId: cat.id, subId: sub.id };
      }
    }
  }
  return null; // will be shown in Others
}
