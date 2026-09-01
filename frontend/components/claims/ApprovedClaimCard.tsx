'use client';

import { useRef, useState } from 'react';
import { Copy, Check, CheckCircle2, Circle } from 'lucide-react';
import { mutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { fireConfetti } from '@/components/ui/ConfettiBurst';
import { confirmHandover } from '@/lib/api/claims';
import { ClaimDetailResponse } from '@/lib/types';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';
import { CATEGORY_LABELS } from '@/lib/utils';

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast('Copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Could not copy.', 'error');
    }
  };

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-gray-400">{label}</span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#F97316] hover:opacity-80 transition-opacity"
      >
        {value}
        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

interface ApprovedClaimCardProps {
  claim: ClaimDetailResponse;
}

/** Full "approved" claim detail: item summary, released contact info, and handover confirmation. */
export function ApprovedClaimCard({ claim }: ApprovedClaimCardProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmBtnRef = useRef<HTMLDivElement>(null);

  const isClaimant = claim.viewerRole === 'CLAIMANT';
  const youConfirmed = isClaimant ? claim.claimantConfirmed : claim.finderConfirmed;
  const counterpartConfirmed = isClaimant ? claim.finderConfirmed : claim.claimantConfirmed;
  const counterpartName = claim.counterpartContact?.fullName ?? (isClaimant ? 'the finder' : 'the claimant');

  const handleConfirm = async () => {
    // If the other party already confirmed, this click is the one that
    // completes the return — the single moment in the app worth celebrating.
    const completesReturn = counterpartConfirmed;
    setConfirming(true);
    try {
      await confirmHandover(claim.id);
      await mutate(['claim', claim.id]);
      toast('Handover confirmed!', 'success');
      if (completesReturn && confirmBtnRef.current) {
        const rect = confirmBtnRef.current.getBoundingClientRect();
        fireConfetti({ x: rect.left + rect.width / 2, y: rect.top });
      }
    } catch {
      toast('Failed to confirm handover.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <CategoryLucideIcon category={claim.itemCategory} size={24} className="text-[#F97316]" />
        </div>
        <div className="min-w-0">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[claim.itemCategory]}
          </span>
          <p className="font-bold text-[#111827] truncate mt-1">{claim.itemTitle}</p>
        </div>
      </div>

      {claim.counterpartContact && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="font-bold text-sm text-[#111827] mb-1">Contact Information Released</p>
          <p className="text-xs text-gray-500 mb-3">
            Your claim was verified by staff. Get in touch to schedule your item handover.
          </p>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-gray-400">Name</span>
              <span className="text-sm font-bold text-[#111827]">{claim.counterpartContact.fullName}</span>
            </div>
            <CopyRow label="Email" value={claim.counterpartContact.email} />
            <CopyRow label="Phone" value={claim.counterpartContact.phoneNumber} />
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Handover Status</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-sm">
            {youConfirmed ? (
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            ) : (
              <Circle size={16} className="text-gray-300 shrink-0" />
            )}
            <span className={youConfirmed ? 'text-gray-700' : 'text-gray-400'}>You confirmed handover</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {counterpartConfirmed ? (
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            ) : (
              <Circle size={16} className="text-amber-500 shrink-0" />
            )}
            <span className="text-gray-600">
              {counterpartConfirmed ? `${counterpartName} confirmed handover` : `Waiting for ${counterpartName} to confirm...`}
            </span>
          </div>
        </div>
      </div>

      {!youConfirmed && (
        <div ref={confirmBtnRef}>
          <Button fullWidth onClick={handleConfirm} loading={confirming}>
            Confirm Handover
          </Button>
          <p className="text-xs text-gray-400 text-center mt-2">Both parties must confirm to complete the return.</p>
        </div>
      )}
    </div>
  );
}
