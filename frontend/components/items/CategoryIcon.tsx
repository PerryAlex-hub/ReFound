import { Smartphone, Laptop, CreditCard, Key, ShoppingBag, BookOpen, Wallet, Shirt, Gem, Package } from 'lucide-react';
import { Category } from '@/lib/types';
import { Select } from '@/components/ui/Input';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/lib/utils';

const lucideMap: Record<Category, typeof Smartphone> = {
  PHONE: Smartphone, LAPTOP: Laptop, ID_CARD: CreditCard, KEYS: Key,
  BAG: ShoppingBag, BOOK: BookOpen, WALLET: Wallet, CLOTHING: Shirt,
  JEWELLERY: Gem, OTHER: Package,
};

export function CategoryLucideIcon({ category, size = 20, className = '' }: { category: Category; size?: number; className?: string }) {
  const Icon = lucideMap[category] ?? Package;
  return <Icon size={size} className={className} />;
}

/** Plain dropdown, matching the report-item form in the design — not an icon grid. */
export function CategoryPicker({
  value, onChange, error,
}: {
  value: Category | '';
  onChange: (v: Category) => void;
  error?: string;
}) {
  return (
    <Select
      name="category"
      label="Category"
      placeholder="Select a category"
      value={value}
      onChange={(e) => onChange(e.target.value as Category)}
      options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
      error={error}
    />
  );
}
