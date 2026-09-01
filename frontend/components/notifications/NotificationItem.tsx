'use client';

import { NotificationResponse, NotificationType } from '@/lib/types';
import { formatRelative } from '@/lib/utils';
import { Target, HelpCircle, CheckCircle, FileText, XCircle, Clock } from 'lucide-react';

const iconConfig: Record<NotificationType, { icon: typeof Target; bg: string; color: string }> = {
  MATCH_FOUND:           { icon: Target,       bg: 'bg-[#FFF7ED]', color: 'text-[#F97316]' },
  CLAIM_INFO_REQUESTED:  { icon: HelpCircle,   bg: 'bg-amber-50',  color: 'text-amber-500' },
  CLAIM_APPROVED:        { icon: CheckCircle,  bg: 'bg-green-50',  color: 'text-green-500' },
  CLAIM_SUBMITTED:       { icon: FileText,     bg: 'bg-blue-50',   color: 'text-blue-500'  },
  CLAIM_REJECTED:        { icon: XCircle,      bg: 'bg-red-50',    color: 'text-red-500'   },
  ITEM_EXPIRING:         { icon: Clock,        bg: 'bg-amber-50',  color: 'text-amber-500' },
  HANDOVER_REMINDER:     { icon: CheckCircle,  bg: 'bg-green-50',  color: 'text-green-500' },
  EMAIL_VERIFICATION:    { icon: FileText,     bg: 'bg-blue-50',   color: 'text-blue-500'  },
  PASSWORD_RESET:        { icon: FileText,     bg: 'bg-blue-50',   color: 'text-blue-500'  },
};

const titles: Record<NotificationType, string> = {
  MATCH_FOUND:          'Potential Match Found',
  CLAIM_INFO_REQUESTED: 'Information Requested',
  CLAIM_APPROVED:       'Claim Approved',
  CLAIM_SUBMITTED:      'Claim Submitted Successfully',
  CLAIM_REJECTED:       'Claim Rejected',
  ITEM_EXPIRING:        'Item Expiring Soon',
  HANDOVER_REMINDER:    'Handover Reminder',
  EMAIL_VERIFICATION:   'Verify your Email',
  PASSWORD_RESET:       'Password Reset',
};

function buildDescription(n: NotificationResponse): string {
  const p = n.payload as Record<string, string>;
  switch (n.type) {
    case 'MATCH_FOUND': {
      const score = Number(p.score ?? 0);
      const pct = Number.isFinite(score) ? Math.round(score * 100) : null;
      return `An item matching '${p.foundItemTitle ?? 'your item'}' was found${pct !== null ? ` (${pct}% match)` : ''}.`;
    }
    case 'CLAIM_INFO_REQUESTED': return `Admin requested more details for your '${p.itemTitle ?? 'item'}' claim.`;
    case 'CLAIM_APPROVED':      return `Your claim for '${p.itemTitle ?? 'item'}' has been approved by admin.`;
    case 'CLAIM_SUBMITTED':     return `Your claim for '${p.itemTitle ?? 'item'}' has been sent for verification.`;
    case 'CLAIM_REJECTED':      return `Your claim for '${p.itemTitle ?? 'item'}' was not approved.`;
    case 'ITEM_EXPIRING':       return `Your report '${p.itemTitle ?? 'item'}' will expire soon.`;
    default: return '';
  }
}

interface NotificationItemProps {
  notification: NotificationResponse;
  onRead?: (id: string) => void;
}

export function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  const cfg = iconConfig[n.type] ?? { icon: FileText, bg: 'bg-gray-100', color: 'text-gray-500' };
  const Icon = cfg.icon;
  const isUnread = !n.readAt;

  return (
    <button
      onClick={() => isUnread && onRead?.(n.id)}
      className={`w-full text-left bg-white rounded-2xl p-4 border transition-all ${
        isUnread ? 'border-l-4 border-l-[#F97316] border-t-gray-100 border-r-gray-100 border-b-gray-100' : 'border-gray-100'
      } hover:shadow-sm`}
    >
      <div className="flex gap-3">
        <div className={`w-11 h-11 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold text-[#111827] ${isUnread ? '' : 'font-semibold'}`}>
            {titles[n.type]}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{buildDescription(n)}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">{formatRelative(n.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}
