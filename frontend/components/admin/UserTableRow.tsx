'use client';

import { useState } from 'react';
import { AdminUserResponse } from '@/lib/types';
import { getInitials, formatDate } from '@/lib/utils';
import { UserAction } from './UserCard';

interface UserTableRowProps {
  u: AdminUserResponse;
  onAction: (u: AdminUserResponse, act: UserAction) => void;
}

export function UserTableRow({ u, onAction }: UserTableRowProps) {
  const [open, setOpen] = useState(false);
  const statusColor = u.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  const roleColor = u.role === 'ADMIN' ? 'text-[#F97316] bg-[#FFF7ED]' : 'text-blue-600 bg-blue-50';

  const act = (action: UserAction) => {
    setOpen(false);
    onAction(u, action);
  };

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FFF1E3] text-[#F97316] font-bold text-xs flex items-center justify-center shrink-0">
            {getInitials(u.fullName)}
          </div>
          <span className="font-semibold text-sm text-[#111827] whitespace-nowrap">{u.fullName}</span>
        </div>
      </td>
      <td className="py-4 pr-4 text-sm text-gray-600 whitespace-nowrap">{u.matricNumber}</td>
      <td className="py-4 pr-4 text-sm text-gray-600">{u.email}</td>
      <td className="py-4 pr-4 text-sm text-gray-600 whitespace-nowrap">{u.phoneNumber}</td>
      <td className="py-4 pr-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${roleColor}`}>{u.role}</span>
      </td>
      <td className="py-4 pr-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusColor}`}>{u.status}</span>
      </td>
      <td className="py-4 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(u.createdAt)}</td>
      <td className="py-4 relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-300 transition-colors"
        >
          Modify
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-44">
              {u.status === 'ACTIVE' ? (
                <button onClick={() => act('suspend')} className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Suspend</button>
              ) : (
                <button onClick={() => act('reactivate')} className="w-full text-left px-3.5 py-2 text-xs font-semibold text-green-600 hover:bg-green-50">Reactivate</button>
              )}
              {u.role === 'STUDENT' ? (
                <button onClick={() => act('promote')} className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#F97316] hover:bg-[#FFF7ED]">Promote to Admin</button>
              ) : (
                <button onClick={() => act('demote')} className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Demote to Student</button>
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
