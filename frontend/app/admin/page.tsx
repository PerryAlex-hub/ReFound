'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import useSWR from 'swr';
import gsap from 'gsap';
import { getAdminStats, getAdminClaims } from '@/lib/api/admin';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/admin/StatCard';
import { QuickAdminTasks } from '@/components/admin/QuickAdminTasks';
import { ItemsOverTimeChart } from '@/components/admin/ItemsOverTimeChart';
import { RecentActivityLog } from '@/components/admin/RecentActivityLog';
import { formatRelative } from '@/lib/utils';

const RECOVERY_TARGET_PERCENT = 80;

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR('admin-stats', getAdminStats, { revalidateOnFocus: false });
  const { data: queue, isLoading: queueLoading } = useSWR(
    'admin-claims-pending',
    () => getAdminClaims({ status: 'PENDING', size: 5 }),
    { revalidateOnFocus: false }
  );
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statsLoading && stats) {
      const ctx = gsap.context(() => {
        gsap.from('.stat-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [statsLoading, stats]);

  const pendingClaims = stats?.claimsByStatus?.PENDING ?? 0;
  const activeUsers = (stats?.totalUsers ?? 0) - (stats?.suspendedUsers ?? 0);
  const recoveryRate = stats?.recoveryRatePercent ?? 0;

  return (
    <div className="px-4 md:px-0 pt-5 md:pt-0 pb-8">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
            <Shield size={20} className="text-[#F97316]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#111827]">Admin Dashboard</h1>
        </div>
        <span className="text-xs font-bold bg-[#FFF7ED] text-[#F97316] px-3 py-1.5 rounded-full">Staff</span>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827]">Admin Control Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of campus recoveries, pending verification logs, and registered users.
        </p>
      </div>

      {/* Mobile stats grid */}
      <div ref={statsRef} className="md:hidden grid grid-cols-2 gap-3 mb-6">
        <div className="stat-card"><StatCard label="Total Items" value={stats?.totalItems ?? 0} isLoading={statsLoading} /></div>
        <div className="stat-card"><StatCard label="Recovery Rate" value={`${recoveryRate.toFixed(0)}%`} valueColor="text-green-500" isLoading={statsLoading} /></div>
        <div className="stat-card"><StatCard label="Pending Claims" value={pendingClaims} valueColor="text-[#F97316]" isLoading={statsLoading} /></div>
        <div className="stat-card"><StatCard label="Active Users" value={activeUsers} isLoading={statsLoading} /></div>
      </div>

      {stats && (
        <div className="md:hidden grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-blue-500">{stats.matchesSuggested}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Matches Suggested</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-teal-500">{stats.returnedItems}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Returned</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-gray-500">{stats.medianReviewHours?.toFixed(1) ?? '—'}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Median Review (h)</p>
          </div>
        </div>
      )}

      {/* Mobile review queue */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#111827]">Review Queue</p>
          <Link href="/admin/claims" className="text-xs font-bold text-[#F97316] hover:opacity-80">
            View All ({pendingClaims})
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {queueLoading ? (
            <ListSkeleton count={3} />
          ) : !queue?.content.length ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <p className="text-sm text-gray-500 font-semibold">Queue is empty 🎉</p>
            </div>
          ) : (
            queue.content.map((claim) => (
              <div key={claim.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#111827] truncate">{claim.itemTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Submitted {formatRelative(claim.createdAt)}</p>
                </div>
                <Link href={`/admin/claims/${claim.id}`} className="shrink-0">
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <Link href="/admin/users">
            <Button variant="secondary" fullWidth size="lg">Manage Users</Button>
          </Link>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total Items Reported"
              value={stats?.totalItems ?? 0}
              sublabel={stats ? `${stats.lostReports} lost · ${stats.foundReports} found` : undefined}
              isLoading={statsLoading}
            />
            <StatCard
              label="Lost Reports"
              value={stats?.lostReports ?? 0}
              sublabel="Total logged"
              isLoading={statsLoading}
            />
            <StatCard
              label="Found Items Logged"
              value={stats?.foundReports ?? 0}
              sublabel="Total logged"
              isLoading={statsLoading}
            />
            <StatCard
              label="Recovery Rate %"
              value={`${recoveryRate.toFixed(1)}%`}
              valueColor="text-green-500"
              sublabel={recoveryRate >= RECOVERY_TARGET_PERCENT ? `UTM target met (${RECOVERY_TARGET_PERCENT}%)` : `Below UTM target (${RECOVERY_TARGET_PERCENT}%)`}
              sublabelColor={recoveryRate >= RECOVERY_TARGET_PERCENT ? 'text-green-500' : 'text-amber-500'}
              isLoading={statsLoading}
            />
            <StatCard
              label="Pending Claims"
              value={pendingClaims}
              valueColor="text-[#F97316]"
              sublabel="Requires staff review"
              sublabelColor="text-[#F97316]"
              isLoading={statsLoading}
            />
            <StatCard
              label="Active Users"
              value={activeUsers}
              sublabel={stats ? `${stats.suspendedUsers} suspended of ${stats.totalUsers} total` : undefined}
              isLoading={statsLoading}
            />
          </div>

          <QuickAdminTasks pendingClaims={pendingClaims} />
        </div>

        {statsLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <ItemsOverTimeChart
            series={[
              { label: 'Lost Reports', color: '#F97316', value: stats?.lostReports ?? 0 },
              { label: 'Found Items', color: '#3B82F6', value: stats?.foundReports ?? 0 },
            ]}
          />
        )}

        <RecentActivityLog claims={queue?.content ?? []} />
      </div>
    </div>
  );
}
