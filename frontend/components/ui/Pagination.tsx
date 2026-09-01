interface PaginationProps {
  page: number; // 0-indexed
  totalPages: number;
  onChange: (page: number) => void;
}

function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);

  const result: (number | 'ellipsis')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-300 transition-colors"
      >
        Previous
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              p === page ? 'bg-[#F97316] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p + 1}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-300 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
