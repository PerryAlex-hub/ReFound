import { Category, ItemType } from '@/lib/types';

/** Shared filter shape passed between /dashboard and /search via URL search params. */
export interface BrowseFilters {
  type: ItemType | '';
  category: Category | '';
  q: string;
  location: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: BrowseFilters = {
  type: 'LOST',
  category: '',
  q: '',
  location: '',
  dateFrom: '',
  dateTo: '',
};

export function filtersFromParams(params: URLSearchParams): BrowseFilters {
  return {
    type: (params.get('type') as ItemType) || 'LOST',
    category: (params.get('category') as Category) || '',
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
  };
}

export function filtersToParams(filters: Partial<BrowseFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.q) params.set('q', filters.q);
  if (filters.location) params.set('location', filters.location);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  return params;
}
