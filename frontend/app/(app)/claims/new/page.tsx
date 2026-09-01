'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { TopBar } from '@/components/layout/TopBar';
import { Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClaim } from '@/lib/api/claims';
import { getItem, getMyItems } from '@/lib/api/items';
import { toast } from '@/components/ui/Toast';
import { formatOccurredOn } from '@/lib/utils';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';
import { AxiosError } from 'axios';

const schema = z.object({
  description:  z.string().min(10, 'Please provide at least 10 characters').max(1000),
  lostContext:  z.string().max(500).optional(),
  lostItemId:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewClaimPage({ searchParams }: { searchParams: Promise<{ foundItemId?: string }> }) {
  const { foundItemId } = use(searchParams);
  const router = useRouter();

  const { data: foundItem, isLoading: loadingItem } = useSWR(
    foundItemId ? ['item', foundItemId] : null,
    () => getItem(foundItemId!),
    { revalidateOnFocus: false }
  );

  const { data: myLostItems } = useSWR(
    'my-lost-items',
    () => getMyItems({ type: 'LOST', size: 50 }),
    { revalidateOnFocus: false }
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!foundItemId) return toast('No item specified.', 'error');
    try {
      const claim = await createClaim({
        foundItemId,
        description: data.description,
        lostContext: data.lostContext,
        lostItemId: data.lostItemId || undefined,
      });
      toast('Claim submitted!', 'success');
      router.push(`/claims/${claim.id}`);
    } catch (err) {
      const e = err as AxiosError<{ message: string; error: string }>;
      if (e.response?.status === 409) toast('You already have an active claim for this item.', 'error');
      else if (e.response?.status === 422) toast(e.response.data?.message ?? 'Cannot claim this item.', 'error');
      else toast('Failed to submit claim.', 'error');
    }
  };

  const lostOptions = myLostItems?.content.map((i) => ({
    value: i.id,
    label: `${i.title} — ${formatOccurredOn(i.occurredOn)}`,
  })) ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Claim Item" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8 flex flex-col gap-5">

        {/* Item summary */}
        {loadingItem ? (
          <div className="bg-white rounded-2xl p-4 flex gap-3">
            <Skeleton className="w-16 h-16 rounded-xl" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
          </div>
        ) : foundItem ? (
          <div className="bg-white rounded-2xl p-4 flex gap-3 border border-gray-100">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              {foundItem.photos[0] ? (
                <img src={foundItem.photos[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <CategoryLucideIcon category={foundItem.category} size={24} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#F97316] uppercase tracking-wide mb-0.5">
                {foundItem.locationLabel ?? 'Campus'}
              </p>
              <p className="font-bold text-[#111827]">{foundItem.title}</p>
              <p className="text-xs text-gray-500">Reported on {formatOccurredOn(foundItem.occurredOn)}</p>
            </div>
          </div>
        ) : null}

        <Textarea
          label="Describe your item in detail"
          placeholder="Mention specific marks, damage, contents, or features only the owner would know."
          rows={5}
          error={errors.description?.message}
          {...register('description')}
        />

        <Textarea
          label="When & where did you lose it?"
          placeholder="Describe the approximate day, time range, and specific campus location."
          rows={4}
          error={errors.lostContext?.message}
          {...register('lostContext')}
        />

        {lostOptions.length > 0 && (
          <Select
            label="Link your lost report (Optional)"
            options={lostOptions}
            placeholder="Select a lost report..."
            error={errors.lostItemId?.message}
            {...register('lostItemId')}
          />
        )}

        <div className="mt-2">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Submit Claim
          </Button>
        </div>
      </form>
    </div>
  );
}
