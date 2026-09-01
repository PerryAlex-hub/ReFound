import Link from 'next/link';
import { FileWarning, Users } from 'lucide-react';
import { ReactNode } from 'react';

interface TaskItemProps {
  icon: ReactNode;
  label: string;
  href: string;
}

function TaskItem({ icon, label, href }: TaskItemProps) {
  return (
    <Link href={href} className="block hover:border-[#F97316]/40 hover:bg-[#FFF7ED]/40 rounded-2xl">
      <span className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-gray-100 text-sm font-semibold text-[#111827] transition-colors">
        <span className="text-[#F97316]">{icon}</span>
        {label}
      </span>
    </Link>
  );
}

/**
 * Only real, working actions belong here — "Export Verification Reports" and
 * "Flag Suspicious Activities" were removed because no backend endpoint exists
 * for either yet (see API.md's admin section). Add them back once one does.
 */
export function QuickAdminTasks({ pendingClaims }: { pendingClaims: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <p className="text-base font-extrabold text-[#111827] mb-4">Quick Admin Tasks</p>
      <div className="flex flex-col gap-2.5">
        <TaskItem icon={<FileWarning size={16} />} label={`Review Pending Claims (${pendingClaims})`} href="/admin/claims" />
        <TaskItem icon={<Users size={16} />} label="Manage Campus Users" href="/admin/users" />
      </div>
    </div>
  );
}
