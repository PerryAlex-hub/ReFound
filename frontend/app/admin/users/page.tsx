'use client';

import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { getAdminUsers, suspendUser, reactivateUser, promoteUser, demoteUser } from '@/lib/api/admin';
import { useAccumulatedPages } from '@/lib/hooks/useAccumulatedPages';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { UserCard, UserAction } from '@/components/admin/UserCard';
import { UserTableRow } from '@/components/admin/UserTableRow';
import { Pagination } from '@/components/ui/Pagination';
import { AdminUserResponse, Role, UserStatus } from '@/lib/types';
import { AxiosError } from 'axios';

const ROLE_OPTIONS = [
  { value: '', label: 'Role: All' },
  { value: 'STUDENT', label: 'Role: Student' },
  { value: 'ADMIN', label: 'Role: Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Status: All' },
  { value: 'ACTIVE', label: 'Status: Active' },
  { value: 'SUSPENDED', label: 'Status: Suspended' },
];

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<{ user: AdminUserResponse; action: UserAction } | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useSWR(
    ['admin-users', q, role, status, page],
    () => getAdminUsers({ q: q || undefined, role: role || undefined, status: status || undefined, page, size: 20 }),
    { revalidateOnFocus: false }
  );

  // Mobile: "Load More" grows the list instead of replacing it.
  const mobile = useAccumulatedPages(
    ['admin-users-infinite', q, role, status],
    (pageIndex) => getAdminUsers({ q: q || undefined, role: role || undefined, status: status || undefined, page: pageIndex, size: 20 }),
  );

  // GET /api/admin/users accepts role/status params but silently ignores them
  // (verified live: identical results with or without them) — filter client-side
  // over whatever's been loaded until the backend adds real support.
  const hasClientFilter = !!role || !!status;
  const applyClientFilter = (list: AdminUserResponse[]) =>
    list.filter((u) => (!role || u.role === role) && (!status || u.status === status));
  const visibleUsers = data ? applyClientFilter(data.content) : [];
  const visibleMobileUsers = applyClientFilter(mobile.items);

  const handleAction = (user: AdminUserResponse, action: UserAction) => {
    setTarget({ user, action });
    setReason('');
  };

  const handleConfirm = async () => {
    if (!target) return;
    if (target.action === 'suspend' && !reason.trim()) return toast('Reason is required for suspension.', 'error');
    setLoading(true);
    try {
      const { user, action } = target;
      if (action === 'suspend') await suspendUser(user.id, reason);
      else if (action === 'reactivate') await reactivateUser(user.id);
      else if (action === 'promote') await promoteUser(user.id);
      else if (action === 'demote') await demoteUser(user.id);
      await mutate(['admin-users', q, role, status, page]);
      toast('Action completed.', 'success');
      setTarget(null);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast(e.response?.data?.message ?? 'Action failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const rangeStart = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.size + data.content.length, data.totalElements) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="User Management" />

      {/* Desktop subtitle */}
      <p className="hidden md:block text-sm text-gray-500 -mt-4 mb-6">
        Admin access control. Suspend or promote students and university staff members.
      </p>

      <div className="px-4 md:px-0 pb-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email or matric..."
              icon={<Search size={16} />}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); mobile.reset(); }}
            />
          </div>
          <div className="hidden md:flex gap-3">
            <div className="w-44">
              <Select
                options={ROLE_OPTIONS.filter((o) => o.value !== '')}
                placeholder="Role: All"
                value={role}
                onChange={(e) => { setRole(e.target.value as Role | ''); setPage(0); mobile.reset(); }}
              />
            </div>
            <div className="w-48">
              <Select
                options={STATUS_OPTIONS.filter((o) => o.value !== '')}
                placeholder="Status: All"
                value={status}
                onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(0); mobile.reset(); }}
              />
            </div>
          </div>
          {data && (
            <p className="hidden md:block text-xs text-gray-400 font-semibold shrink-0 md:ml-auto">
              {hasClientFilter
                ? `Showing ${visibleUsers.length} matching on this page — role/status filters apply to loaded results only`
                : `Showing ${rangeStart}-${rangeEnd} of ${data.totalElements.toLocaleString()} members`}
            </p>
          )}
        </div>

        {/* Mobile list */}
        <div className="md:hidden flex flex-col gap-3">
          {mobile.isLoadingInitial ? (
            <ListSkeleton count={5} />
          ) : !visibleMobileUsers.length ? (
            <EmptyState icon={<Users size={24} />} title="No users found" />
          ) : (
            visibleMobileUsers.map((u) => (
              <UserCard key={u.id} u={u} onAction={handleAction} />
            ))
          )}
        </div>

        {mobile.hasMore && (
          <div className="md:hidden">
            <Button variant="secondary" fullWidth onClick={mobile.loadMore} loading={mobile.isLoadingMore}>Load More</Button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : !visibleUsers.length ? (
            <EmptyState icon={<Users size={24} />} title="No users found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Matric Number</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Phone</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Member Since</th>
                    <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <UserTableRow key={u.id} u={u} onAction={handleAction} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="hidden md:block">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? `${target.action.charAt(0).toUpperCase() + target.action.slice(1)} User` : ''}
      >
        {target && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {target.action === 'suspend' && `Suspend ${target.user.fullName}? This revokes all active sessions immediately.`}
              {target.action === 'reactivate' && `Reactivate ${target.user.fullName}?`}
              {target.action === 'promote' && `Promote ${target.user.fullName} to Admin?`}
              {target.action === 'demote' && `Demote ${target.user.fullName} to Student?`}
            </p>
            {target.action === 'suspend' && (
              <Textarea
                label="Reason"
                placeholder="Enter reason for suspension..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" fullWidth onClick={() => setTarget(null)}>Cancel</Button>
              <Button
                fullWidth
                loading={loading}
                onClick={handleConfirm}
                variant={target.action === 'suspend' ? 'danger' : 'primary'}
              >
                Confirm
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
