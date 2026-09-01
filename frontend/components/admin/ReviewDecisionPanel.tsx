import { CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

export type DecisionAction = 'approve' | 'reject' | 'info';

interface ReviewDecisionPanelProps {
  reason: string;
  onReasonChange: (value: string) => void;
  onDecide: (action: DecisionAction) => void;
  submittingAction: DecisionAction | null;
}

// Desktop-only inline decision panel — replaces the mobile sticky bottom bar
// + confirmation modal with a single always-visible panel, per the desktop mock.
export function ReviewDecisionPanel({ reason, onReasonChange, onDecide, submittingAction }: ReviewDecisionPanelProps) {
  const busy = submittingAction !== null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-base font-extrabold text-[#111827] mb-4">Review Decision</p>

      <Textarea
        label="Decision Reason (will be sent to claimant)"
        placeholder="Describe why you are approving/rejecting this claim..."
        rows={4}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        disabled={busy}
      />

      <div className="flex flex-col gap-2.5 mt-4">
        <Button
          fullWidth
          loading={submittingAction === 'approve'}
          disabled={busy && submittingAction !== 'approve'}
          onClick={() => onDecide('approve')}
          className="bg-green-500 hover:opacity-90 text-white"
        >
          <CheckCircle size={16} /> Approve Claim
        </Button>
        <Button
          fullWidth
          variant="outline"
          loading={submittingAction === 'info'}
          disabled={busy && submittingAction !== 'info'}
          onClick={() => onDecide('info')}
          className="border-amber-400 text-amber-600 bg-amber-50/60 hover:opacity-90"
        >
          <HelpCircle size={16} /> Request More Information
        </Button>
        <Button
          fullWidth
          variant="outline"
          loading={submittingAction === 'reject'}
          disabled={busy && submittingAction !== 'reject'}
          onClick={() => onDecide('reject')}
          className="border-red-400 text-red-600 hover:opacity-90"
        >
          <XCircle size={16} /> Reject Claim
        </Button>
      </div>
    </div>
  );
}
