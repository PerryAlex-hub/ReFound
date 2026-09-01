'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Phone, Mail, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { getAdminClaim, approveClaim, rejectClaim, requestClaimInfo } from '@/lib/api/admin';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ClaimStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { CompetingClaimsBanner } from '@/components/admin/CompetingClaimsBanner';
import { ReviewDecisionPanel, DecisionAction } from '@/components/admin/ReviewDecisionPanel';
import { formatDate, formatRelative, CATEGORY_LABELS } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

type Action = 'approve' | 'reject' | 'info' | null;

export default function AdminClaimReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Desktop inline decision panel keeps its own state — independent of the
  // mobile modal flow above so the two UIs never fight over shared state.
  const [deskReason, setDeskReason] = useState('');
  const [deskAction, setDeskAction] = useState<DecisionAction | null>(null);

  const { data: claim, isLoading } = useSWR(['admin-claim', id], () => getAdminClaim(id), { revalidateOnFocus: false });

  const handleAction = async () => {
    if (!reason.trim()) return toast('Please provide a reason.', 'error');
    setSubmitting(true);
    try {
      if (action === 'approve') await approveClaim(id, reason);
      else if (action === 'reject') await rejectClaim(id, reason);
      else if (action === 'info') await requestClaimInfo(id, reason);
      await mutate(['admin-claim', id]);
      toast(action === 'approve' ? 'Claim approved!' : action === 'reject' ? 'Claim rejected.' : 'Info requested.', 'success');
      setAction(null);
      setReason('');
      if (action !== 'info') router.push('/admin/claims');
    } catch {
      toast('Action failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeskDecide = async (decision: DecisionAction) => {
    if (!deskReason.trim()) return toast('Please provide a reason.', 'error');
    setDeskAction(decision);
    try {
      if (decision === 'approve') await approveClaim(id, deskReason);
      else if (decision === 'reject') await rejectClaim(id, deskReason);
      else if (decision === 'info') await requestClaimInfo(id, deskReason);
      await mutate(['admin-claim', id]);
      toast(decision === 'approve' ? 'Claim approved!' : decision === 'reject' ? 'Claim rejected.' : 'Info requested.', 'success');
      setDeskReason('');
      if (decision !== 'info') router.push('/admin/claims');
    } catch {
      toast('Action failed.', 'error');
    } finally {
      setDeskAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-4 flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!claim) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Claim not found.</div>;
  }

  const isDecided = ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(claim.status);
  const shortRef = claim.foundItemId ? `#${claim.foundItemId.slice(0, 8).toUpperCase()}` : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Desktop back link */}
      <Link
        href="/admin/claims"
        className="hidden md:flex items-center gap-2 text-sm font-bold text-[#F97316] hover:opacity-80 mb-6"
      >
        <ArrowLeft size={16} /> Back to Claims Queue
      </Link>

      <TopBar title="Review Claim" />

      <div className="px-4 md:px-0 pb-28 md:pb-10 flex flex-col gap-5">

        {/* Claim status */}
        <div className="flex items-center gap-3">
          <ClaimStatusBadge status={claim.status} />
          <span className="text-xs text-gray-400">Submitted {formatRelative(claim.createdAt)}</span>
          {claim.competingClaims > 0 && (
            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              +{claim.competingClaims} competing
            </span>
          )}
        </div>

        {/* Desktop competing-claims banner */}
        <div className="hidden md:block">
          <CompetingClaimsBanner count={claim.competingClaims} />
        </div>

        {/* Item info (mobile summary card) */}
        <div className="md:hidden bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Found Item</p>
          <div className="flex gap-3 items-center">
            {claim.itemPhotoUrls[0] ? (
              <img src={claim.itemPhotoUrls[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <CategoryLucideIcon category={claim.itemCategory} size={24} className="text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-bold text-[#111827]">{claim.itemTitle}</p>
              {claim.itemLocationLabel && <p className="text-xs text-gray-500 mt-0.5">{claim.itemLocationLabel}</p>}
              {claim.itemDescription && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{claim.itemDescription}</p>}
            </div>
          </div>
        </div>

        {/* Side-by-side evidence (mobile / narrow desktop) */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-amber-600" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Finder&apos;s Verification</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{claim.finderVerificationAnswer}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-blue-600" />
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Claimant&apos;s Evidence</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{claim.claimantDescription}</p>
            {claim.claimantLostContext && (
              <p className="text-xs text-gray-500 mt-2 italic">Lost context: {claim.claimantLostContext}</p>
            )}
          </div>
        </div>

        {/* Desktop: Finder's Description Log + Claimant's Verification Evidence / Review Decision */}
        <div className="hidden md:grid md:grid-cols-2 gap-5 items-start">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-extrabold text-[#111827]">Finder&apos;s Description Log</p>
              {shortRef && <span className="text-xs text-gray-400 font-mono">ID: {shortRef}</span>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Logged Security Identifier</p>
              <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{claim.finderVerificationAnswer}&rdquo;</p>
            </div>

            {claim.itemPhotoUrls[0] && (
              <div className="mb-4">
                <p className="text-sm font-bold text-[#111827] mb-2">Finder&apos;s Evidence Photo</p>
                <img src={claim.itemPhotoUrls[0]} alt="" className="w-full h-64 rounded-xl object-cover" />
              </div>
            )}

            <p className="text-sm font-bold text-[#111827] mb-2">Item Properties</p>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Title</p>
                <p className="font-semibold text-[#111827]">{claim.itemTitle}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="font-semibold text-[#111827]">{CATEGORY_LABELS[claim.itemCategory]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Location Lost/Found</p>
                <p className="font-semibold text-[#111827]">{claim.itemLocationLabel ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Claim Submitted</p>
                <p className="font-semibold text-[#111827]">{formatDate(claim.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-base font-extrabold text-[#111827] mb-4">Claimant&apos;s Verification Evidence</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Claimant&apos;s Lost Context</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  &ldquo;{claim.claimantLostContext ?? claim.claimantDescription}&rdquo;
                </p>
              </div>

              <p className="text-sm font-bold text-[#111827] mb-2">Student Information</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="font-semibold text-[#111827]">{claim.claimant.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Matric No.</span>
                  <span className="font-semibold text-[#111827]">{claim.claimantMatricNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Email</span>
                  <span className="font-semibold text-[#111827]">{claim.claimant.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Phone</span>
                  <span className="font-semibold text-[#111827]">{claim.claimant.phoneNumber}</span>
                </div>
              </div>
            </div>

            {!isDecided ? (
              <ReviewDecisionPanel
                reason={deskReason}
                onReasonChange={setDeskReason}
                onDecide={handleDeskDecide}
                submittingAction={deskAction}
              />
            ) : claim.decisionReason && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-1">Decision Reason</p>
                <p className="text-sm text-gray-700">{claim.decisionReason}</p>
                {claim.reviewedByName && <p className="text-xs text-gray-400 mt-1">— {claim.reviewedByName}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Info exchange */}
        {claim.infoRequest && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 mb-1">Info Requested</p>
            <p className="text-sm text-gray-700 mb-2">{claim.infoRequest}</p>
            {claim.infoResponse && (
              <>
                <p className="text-xs font-bold text-gray-400 mb-1">Claimant Response</p>
                <p className="text-sm text-gray-700">{claim.infoResponse}</p>
              </>
            )}
          </div>
        )}

        {/* Contacts (mobile) */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {[
            { label: 'Finder', contact: claim.finder },
            { label: 'Claimant', contact: claim.claimant, extra: claim.claimantMatricNumber },
          ].map(({ label, contact, extra }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              <p className="font-bold text-sm text-[#111827]">{contact.fullName}</p>
              {extra && <p className="text-xs text-gray-500 mb-1">ID: {extra}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Mail size={12} className="text-gray-400" />
                <p className="text-xs text-gray-600">{contact.email}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={12} className="text-gray-400" />
                <p className="text-xs text-gray-600">{contact.phoneNumber}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Decision reason (mobile, already-decided claims) */}
        {claim.decisionReason && (
          <div className="md:hidden bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 mb-1">Decision Reason</p>
            <p className="text-sm text-gray-700">{claim.decisionReason}</p>
            {claim.reviewedByName && <p className="text-xs text-gray-400 mt-1">— {claim.reviewedByName}</p>}
          </div>
        )}
      </div>

      {/* Mobile sticky actions */}
      {!isDecided && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#F5F6FA] border-t border-gray-100">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setAction('info'); setReason(''); }}>
              <HelpCircle size={14} /> Ask Info
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => { setAction('reject'); setReason(''); }}>
              <XCircle size={14} /> Reject
            </Button>
            <Button size="sm" className="flex-1 bg-green-500 hover:opacity-90" onClick={() => { setAction('approve'); setReason(''); }}>
              <CheckCircle size={14} /> Approve
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === 'approve' ? 'Approve Claim' : action === 'reject' ? 'Reject Claim' : 'Request Information'}
      >
        <Textarea
          label={action === 'info' ? 'Question for claimant' : 'Reason for decision'}
          placeholder={action === 'info'
            ? 'e.g. What is the screen lock pattern / wallpaper?'
            : action === 'approve' ? 'Evidence matches the finder\'s verification answer...' : 'Evidence does not match...'}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" fullWidth onClick={() => setAction(null)}>Cancel</Button>
          <Button
            fullWidth
            loading={submitting}
            onClick={handleAction}
            className={action === 'approve' ? 'bg-green-500 hover:opacity-90 text-white' : action === 'reject' ? 'bg-red-500 hover:opacity-90 text-white' : ''}
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Send Question'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
