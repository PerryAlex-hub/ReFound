import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import { AdminUserResponse } from '@/lib/types';

export type UserAction = 'suspend' | 'reactivate' | 'promote' | 'demote';

interface UserCardProps {
  u: AdminUserResponse;
  onAction: (u: AdminUserResponse, act: UserAction) => void;
}

export function UserCard({ u, onAction }: UserCardProps) {
  const statusColor = u.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  const roleColor = u.role === 'ADMIN' ? 'text-[#F97316] bg-[#FFF7ED]' : 'text-gray-500 bg-gray-100';

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-[#111827] truncate">{u.fullName}</p>
          <p className="text-xs text-gray-500">{u.matricNumber} · {formatRelative(u.createdAt)}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor}`}>{u.role}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{u.status}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">{u.email}</p>
      <div className="flex gap-2 flex-wrap">
        {u.status === 'ACTIVE' ? (
          <Button size="sm" variant="danger" onClick={() => onAction(u, 'suspend')}>Suspend</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => onAction(u, 'reactivate')}>Reactivate</Button>
        )}
        {u.role === 'STUDENT' ? (
          <Button size="sm" variant="outline" onClick={() => onAction(u, 'promote')}>Promote</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onAction(u, 'demote')}>Demote</Button>
        )}
      </div>
    </div>
  );
}
