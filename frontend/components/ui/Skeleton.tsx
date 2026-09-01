interface SkeletonProps { className?: string; }

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex gap-3">
        <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
