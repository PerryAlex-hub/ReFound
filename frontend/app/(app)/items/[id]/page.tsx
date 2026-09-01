'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ChevronLeft, Edit2, XCircle, Phone, Mail, Flag } from 'lucide-react';
import useSWR from 'swr';
import { getItem, cancelItem, reportItemAbuse } from '@/lib/api/items';
import { Button } from '@/components/ui/Button';
import { ItemStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { formatOccurredOn } from '@/lib/utils';
import { ItemPhotoGallery } from '@/components/items/ItemPhotoGallery';
import Link from 'next/link';

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const { data: item, isLoading, error } = useSWR(
    ['item', id],
    () => getItem(id),
    { revalidateOnFocus: false }
  );

  if (isLoading) return (
    <div className="px-4 pt-4 flex flex-col gap-4">
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
  );

  if (error || !item) return (
    <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
      <p className="text-gray-500 font-semibold">Item not found.</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-[#F97316] font-bold">Go back</button>
    </div>
  );

  const canClaim = !item.viewerIsReporter && (item.status === 'OPEN' || item.status === 'CLAIM_PENDING');

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelItem(id);
      toast('Report cancelled.', 'success');
      router.push('/my-items');
    } catch {
      toast('Failed to cancel report.', 'error');
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  };

  const handleReportAbuse = async () => {
    setReporting(true);
    try {
      await reportItemAbuse(id, reportReason.trim());
      toast('Report submitted. Thanks for flagging this.', 'success');
      setReportOpen(false);
      setReportReason('');
    } catch {
      toast('Failed to submit report. Please try again.', 'error');
    } finally {
      setReporting(false);
    }
  };

  const actions = (
    <>
      {canClaim && (
        <Button
          fullWidth size="lg"
          onClick={() => router.push(`/claims/new?foundItemId=${id}`)}
        >
          Claim This Item
        </Button>
      )}
      {item.viewerIsReporter && item.status === 'OPEN' && (
        <div className="flex gap-3">
          <Link href={`/items/${id}/edit`} className="flex-1">
            <Button fullWidth size="lg" variant="secondary">
              <Edit2 size={16} /> Edit
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="flex-1" onClick={() => setCancelOpen(true)}>
            <XCircle size={16} /> Cancel Report
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="md:max-w-5xl md:mx-auto md:w-full md:px-6 md:pt-6">
        <button
          onClick={() => router.back()}
          className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[#F97316] hover:opacity-80 mb-4"
        >
          <ChevronLeft size={18} /> Back to Browse
        </button>

        <div className="md:bg-white md:rounded-3xl md:border md:border-gray-100 md:p-8 md:flex md:gap-8">
          <div className="md:w-[42%] md:shrink-0">
            <ItemPhotoGallery
              photos={item.photos}
              title={item.title}
              category={item.category}
              viewerIsReporter={item.viewerIsReporter}
              onBack={() => router.back()}
            />
          </div>

          <div className="px-4 pt-5 pb-28 md:px-0 md:pt-0 md:pb-0 md:flex-1 flex flex-col gap-5">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <ItemStatusBadge status={item.status} />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.category.replace('_', ' ')}</span>
              {item.viewerIsReporter && (
                <span className="ml-auto text-xs font-semibold text-[#F97316] bg-[#FFF7ED] px-2 py-0.5 rounded-full">Your Report</span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-[#111827] leading-tight">{item.title}</h1>

            {/* Meta */}
            <div className="flex flex-col gap-3 border-t border-b border-gray-100 py-4">
              {item.locationLabel && (
                <div className="flex gap-3 items-start">
                  <MapPin size={16} className="text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Location {item.type === 'FOUND' ? 'Found' : 'Lost'}</p>
                    <p className="text-sm font-semibold text-[#111827]">
                      {item.locationLabel}{item.locationDetail ? ` — ${item.locationDetail}` : ''}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 items-start">
                <Calendar size={16} className="text-[#F97316] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Date {item.type === 'FOUND' ? 'Found' : 'Lost'}</p>
                  <p className="text-sm font-semibold text-[#111827]">{formatOccurredOn(item.occurredOn)}</p>
                </div>
              </div>
            </div>

            {item.description && (
              <div>
                <p className="text-sm font-bold text-[#111827] mb-2">Reporter Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Reporter contact (only when permitted) */}
            {item.reporter && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700 mb-2">Contact Details Released</p>
                <p className="text-sm font-bold text-[#111827]">{item.reporter.fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={13} className="text-gray-500" />
                  <p className="text-xs text-gray-600">{item.reporter.email}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={13} className="text-gray-500" />
                  <p className="text-xs text-gray-600">{item.reporter.phoneNumber}</p>
                </div>
              </div>
            )}

            {item.viewerIsReporter && item.verificationAnswer && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-1">Your Verification Answer</p>
                <p className="text-sm text-gray-700">{item.verificationAnswer}</p>
              </div>
            )}

            {/* Desktop-only inline actions — mobile uses the fixed bottom bar */}
            <div className="hidden md:flex md:flex-col md:gap-3 md:mt-2">
              {actions}
            </div>

            <button
              onClick={() => setReportOpen(true)}
              className="self-start flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
            >
              <Flag size={12} />
              Report an issue with this listing
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only fixed action bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#F5F6FA] border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {actions}
        </div>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Report">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to withdraw this report? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setCancelOpen(false)}>Keep it</Button>
          <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>Yes, Cancel</Button>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue">
        <p className="text-sm text-gray-600 mb-4">
          Let us know if something looks wrong with this listing — a moderator will review it.
        </p>
        <Textarea
          label="Reason"
          placeholder="Describe the issue with this listing…"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          minLength={5}
          maxLength={500}
          hint={`${reportReason.length}/500`}
        />
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" fullWidth onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            fullWidth
            loading={reporting}
            disabled={reportReason.trim().length < 5}
            onClick={handleReportAbuse}
          >
            Submit Report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
