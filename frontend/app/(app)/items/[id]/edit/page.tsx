'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR, { mutate } from 'swr';
import { TopBar } from '@/components/layout/TopBar';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PhotoUploader } from '@/components/items/PhotoUploader';
import { getItem, updateItem, uploadPhoto, deletePhoto } from '@/lib/api/items';
import { toast } from '@/components/ui/Toast';
import { AxiosError } from 'axios';

const schema = z.object({
  title:              z.string().min(1).max(120),
  occurredOn:         z.string().min(1),
  locationLabel:      z.string().max(200).optional(),
  locationDetail:     z.string().max(500).optional(),
  description:        z.string().max(2000).optional(),
  verificationAnswer: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: item, isLoading } = useSWR(['item', id], () => getItem(id), { revalidateOnFocus: false });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        occurredOn: item.occurredOn,
        locationLabel: item.locationLabel ?? '',
        locationDetail: item.locationDetail ?? '',
        description: item.description ?? '',
        verificationAnswer: item.verificationAnswer ?? '',
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateItem(id, {
        title: data.title,
        occurredOn: data.occurredOn,
        locationLabel: data.locationLabel,
        locationDetail: data.locationDetail,
        description: data.description,
        verificationAnswer: item?.type === 'FOUND' ? data.verificationAnswer : undefined,
      });
      toast('Report updated!', 'success');
      router.push(`/items/${id}`);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast(e.response?.data?.message ?? 'Failed to update.', 'error');
    }
  };

  // Photos are managed live against the server (not staged like the create form),
  // since the item already exists — API.md: owner only, and only while status is OPEN.
  const handleAddPhotos = async (files: File[]) => {
    setUploadingPhoto(true);
    try {
      for (const file of files) {
        await uploadPhoto(id, file);
      }
      await mutate(['item', id]);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast(e.response?.data?.message ?? 'Failed to upload photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    try {
      await deletePhoto(id, photoId);
      await mutate(['item', id]);
      toast('Photo removed.', 'success');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast(e.response?.data?.message ?? 'Failed to remove photo.', 'error');
    }
  };

  if (isLoading) return <div className="px-4 pt-4 flex flex-col gap-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-12 w-full" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Edit Report" />
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8 flex flex-col gap-5">
        {item && (
          <PhotoUploader
            photos={item.photos}
            pendingFiles={[]}
            onAddFiles={handleAddPhotos}
            onRemovePhoto={handleRemovePhoto}
          />
        )}
        {uploadingPhoto && <p className="text-xs text-gray-400 -mt-3">Uploading…</p>}
        <Input label="Item Title" error={errors.title?.message} {...register('title')} />
        <Input label={`Date ${item?.type === 'FOUND' ? 'Found' : 'Lost'}`} type="date"
          icon={<Calendar size={16} />} max={new Date().toISOString().split('T')[0]}
          error={errors.occurredOn?.message} {...register('occurredOn')} />
        <Input label="Location" placeholder="e.g. Main Library" icon={<MapPin size={16} />}
          error={errors.locationLabel?.message} {...register('locationLabel')} />
        <Input label="Location Detail" placeholder="e.g. Ground floor, near entrance" icon={<MapPin size={16} />}
          error={errors.locationDetail?.message} {...register('locationDetail')} />
        <Textarea label="Description" rows={4} error={errors.description?.message} {...register('description')} />
        {item?.type === 'FOUND' && (
          <Textarea label="Verification Answer" rows={3} hint="What only the owner would know."
            error={errors.verificationAnswer?.message} {...register('verificationAnswer')} />
        )}
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Save Changes</Button>
      </form>
    </div>
  );
}
