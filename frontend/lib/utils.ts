import { Category, ClaimStatus, ItemStatus, ItemType } from './types';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelative(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  PHONE: 'Phone',
  LAPTOP: 'Laptop',
  ID_CARD: 'ID Card',
  KEYS: 'Keys',
  BAG: 'Bag',
  BOOK: 'Book',
  WALLET: 'Wallet',
  CLOTHING: 'Clothing',
  JEWELLERY: 'Jewellery',
  OTHER: 'Other',
};

export const ALL_CATEGORIES: Category[] = [
  'PHONE', 'LAPTOP', 'ID_CARD', 'KEYS', 'BAG',
  'BOOK', 'WALLET', 'CLOTHING', 'JEWELLERY', 'OTHER',
];

export function getItemStatusColor(status: ItemStatus): string {
  switch (status) {
    case 'OPEN': return 'text-green-600 bg-green-50 border border-green-200';
    case 'CLAIM_PENDING': return 'text-amber-600 bg-amber-50';
    case 'MATCHED': return 'text-blue-600 bg-blue-50';
    case 'RETURNED': return 'text-teal-600 bg-teal-50';
    case 'EXPIRED': return 'text-gray-500 bg-gray-100';
    case 'CANCELLED': return 'text-gray-500 bg-gray-100';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export function getClaimStatusColor(status: ClaimStatus): string {
  switch (status) {
    case 'PENDING': return 'text-amber-600 bg-amber-50';
    case 'AWAITING_INFO': return 'text-blue-600 bg-blue-50';
    case 'APPROVED': return 'text-green-600 bg-green-50';
    case 'REJECTED': return 'text-red-600 bg-red-50';
    case 'WITHDRAWN': return 'text-gray-500 bg-gray-100';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export function getItemTypeColor(type: ItemType): string {
  return type === 'LOST'
    ? 'text-red-600 bg-red-50'
    : 'text-green-600 bg-green-50';
}

export function formatOccurredOn(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMatchPercent(score: number): number {
  return Math.round(score * 100);
}

export function deriveBreakdownTags(breakdown: Record<string, unknown>): string[] {
  const tags: string[] = [];
  const b = breakdown as Record<string, { value?: number; weight?: number; available?: boolean }>;

  if (b.category?.value === 1) tags.push('Same category');
  if (b.location?.value !== undefined && b.location.value > 0.8) tags.push('Found nearby');
  if (b.time?.value !== undefined && b.time.value > 0.9) tags.push('Within 1 hour');
  else if (b.time?.value !== undefined && b.time.value > 0.7) tags.push('Similar date');
  if (b.text?.value !== undefined && b.text.value > 0.5) tags.push('Similar description');
  if (b.attributes?.value === 1) tags.push('Matching attributes');

  return tags.slice(0, 3);
}
