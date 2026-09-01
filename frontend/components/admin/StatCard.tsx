import { Skeleton } from '@/components/ui/Skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  sublabel?: string;
  sublabelColor?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  valueColor = 'text-[#111827]',
  sublabel,
  sublabelColor = 'text-gray-400',
  isLoading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <p className={`text-3xl font-extrabold ${valueColor} stat-num`}>{value}</p>
          {sublabel && <p className={`text-xs font-semibold mt-1.5 ${sublabelColor}`}>{sublabel}</p>}
        </>
      )}
    </div>
  );
}
