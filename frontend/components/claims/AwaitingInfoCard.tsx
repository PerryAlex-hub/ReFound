'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { mutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { respondToClaim } from '@/lib/api/claims';
import { ClaimDetailResponse } from '@/lib/types';

interface AwaitingInfoCardProps {
  claim: ClaimDetailResponse;
}

/** Full "awaiting info" claim detail: original description, admin question, and a response form. */
export function AwaitingInfoCard({ claim }: AwaitingInfoCardProps) {
  const [answer, setAnswer] = useState(claim.infoResponse ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleRespond = async () => {
    if (!answer.trim()) {
      toast('Please enter a response.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await respondToClaim(claim.id, answer);
      await mutate(['claim', claim.id]);
      await mutate('my-claims');
      toast('Response submitted!', 'success');
    } catch {
      toast('Failed to submit response.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Your Original Claim Description</p>
        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{claim.description}&rdquo;</p>
      </div>

      {claim.infoRequest && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <HelpCircle size={14} className="text-[#F97316]" />
            </div>
            <p className="font-bold text-sm text-[#111827]">Admin Question</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
            <p className="text-sm text-gray-700 leading-relaxed">{claim.infoRequest}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <Textarea
          label="Your Response"
          placeholder="Enter your brand, color, or other private identifying details..."
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <Button fullWidth className="mt-3" loading={submitting} onClick={handleRespond}>
          Submit Response
        </Button>
      </div>
    </div>
  );
}
