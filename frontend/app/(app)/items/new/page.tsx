'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TopBar } from '@/components/layout/TopBar';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/items/CategoryIcon';
import { PhotoUploader } from '@/components/items/PhotoUploader';
import { createItem, uploadPhoto } from '@/lib/api/items';
import { toast } from '@/components/ui/Toast';
import { scrollToFirstError } from '@/lib/scrollToError';
import { ItemType } from '@/lib/types';
import { AxiosError } from 'axios';

// The verification answer is mandatory for FOUND and forbidden for LOST, so the
// schema is built per type rather than being one shared shape. Marking it
// optional let a found-item report reach the API and come back 422 after the
// user had filled in the whole form.
const baseSchema = z.object({
  title:              z.string().min(1, 'Title is required').max(120),
  category:           z.enum(['PHONE','LAPTOP','ID_CARD','KEYS','BAG','BOOK','WALLET','CLOTHING','JEWELLERY','OTHER'] as const, { errorMap: () => ({ message: 'Select a category' }) }),
  occurredOn:         z.string().min(1, 'Date is required'),
  locationLabel:      z.string().max(200).optional(),
  locationDetail:     z.string().max(500).optional(),
  description:        z.string().max(2000).optional(),
  verificationAnswer: z.string().max(500).optional(),
});

const lostSchema = baseSchema;

const foundSchema = baseSchema.extend({
  verificationAnswer: z
    .string()
    .min(10, 'Give a detail only the owner would know — this is how ownership is verified')
    .max(500),
});

type FormData = z.infer<typeof baseSchema>;

export default function NewItemPage() {
  // useSearchParams(), not the `searchParams` page prop. In a Client Component
  // the prop does not yield a value under Next 16, so `type` came through
  // undefined and every "Report Found Item" silently created a LOST report.
  return (
    <Suspense fallback={null}>
      <NewItemForm />
    </Suspense>
  );
}

function NewItemForm() {
  const searchParams = useSearchParams();
  const itemType: ItemType = searchParams.get('type') === 'found' ? 'FOUND' : 'LOST';
  const router = useRouter();
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(itemType === 'FOUND' ? foundSchema : lostSchema),
    defaultValues: { occurredOn: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const item = await createItem({
        type: itemType,
        category: data.category,
        title: data.title,
        description: data.description,
        locationLabel: data.locationLabel,
        locationDetail: data.locationDetail,
        occurredOn: data.occurredOn,
        verificationAnswer: itemType === 'FOUND' ? data.verificationAnswer : undefined,
      });

      // The report itself is already saved at this point, so a failed photo
      // must not look like a failed submission — but it must not be silent
      // either. Count the failures and say so.
      let failedPhotos = 0;
      for (const file of pendingPhotos) {
        try {
          await uploadPhoto(item.id, file);
        } catch {
          failedPhotos += 1;
        }
      }

      if (failedPhotos > 0) {
        toast(
          `Report submitted, but ${failedPhotos} photo${failedPhotos > 1 ? 's' : ''} failed to upload. You can add them from the item page.`,
          'error',
        );
      } else {
        toast('Report submitted successfully!', 'success');
      }
      router.push(`/items/${item.id}`);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast(e.response?.data?.message ?? 'Failed to submit report.', 'error');
    }
  };

  const isLost = itemType === 'LOST';

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title={isLost ? 'Report Lost Item' : 'Report Found Item'} />

      <form onSubmit={handleSubmit(onSubmit, (errs) => scrollToFirstError(errs))} className="flex-1 px-4 pb-6 flex flex-col gap-5">

        <PhotoUploader
          photos={[]}
          pendingFiles={pendingPhotos}
          onAddFiles={(files) => setPendingPhotos((p) => [...p, ...files].slice(0, 5))}
          onRemovePending={(i) => setPendingPhotos((p) => p.filter((_, idx) => idx !== i))}
        />

        <Input
          label={isLost ? 'Item Title' : 'Item Name'}
          placeholder={isLost ? 'e.g. Leather Bag, AirPods Pro' : 'e.g. Black Samsung Galaxy S24'}
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategoryPicker value={field.value ?? ''} onChange={field.onChange} error={errors.category?.message} />
          )}
        />

        <Input
          label={isLost ? 'Date Lost' : 'Date Found'}
          type="date"
          icon={<Calendar size={16} />}
          max={new Date().toISOString().split('T')[0]}
          error={errors.occurredOn?.message}
          {...register('occurredOn')}
        />

        <Input
          label={isLost ? 'Last Known Location' : 'Found Location'}
          placeholder="e.g. Engineering Block 3"
          icon={<MapPin size={16} />}
          error={errors.locationLabel?.message}
          {...register('locationLabel')}
        />

        {isLost && (
          <Input
            label="Location Detail"
            placeholder="e.g. 2nd floor, study benches near lift"
            icon={<MapPin size={16} />}
            error={errors.locationDetail?.message}
            {...register('locationDetail')}
          />
        )}

        <Textarea
          label="Detailed Description"
          placeholder={isLost
            ? 'e.g. Silver keychain attached, keys include room key and bicycle lock.'
            : 'Describe the item as found — condition, markings, contents.'}
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        {!isLost && (
          <Textarea
            label="Verification Question / Answer"
            placeholder="Name one thing about this item only the owner would know."
            hint="This will be used to filter and verify ownership claims."
            rows={3}
            error={errors.verificationAnswer?.message}
            {...register('verificationAnswer')}
          />
        )}

        <div className="mt-2">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  );
}
