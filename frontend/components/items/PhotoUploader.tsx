'use client';

import { Camera, X } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import { ItemPhotoResponse } from '@/lib/types';

interface PhotoUploaderProps {
  photos: ItemPhotoResponse[];
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemovePhoto?: (photoId: string) => void;
  onRemovePending?: (index: number) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  photos, pendingFiles, onAddFiles, onRemovePhoto, onRemovePending, maxPhotos = 5,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = photos.length + pendingFiles.length;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = maxPhotos - total;
    if (allowed <= 0) return;
    const arr = Array.from(files).slice(0, allowed);
    onAddFiles(arr);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[#111827]">Photos (up to {maxPhotos})</label>

      <div className="flex gap-2 flex-wrap">
        {photos.map((p) => (
          <div key={p.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
            <Image src={p.url} alt="" fill sizes="80px" className="object-cover" />
            {onRemovePhoto && (
              <button
                type="button"
                onClick={() => onRemovePhoto(p.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {pendingFiles.map((f, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#F97316]/40 bg-[#FFF7ED]">
            {/* A local blob: URL, not a remote image — next/image's optimizer can't fetch it, so a plain <img> is correct here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
            {onRemovePending && (
              <button
                type="button"
                onClick={() => onRemovePending(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {total < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-[#F97316] bg-[#FFF7ED] hover:border-[#F97316] transition-colors"
          >
            <Camera size={20} />
            <span className="text-[9px] font-semibold">Add</span>
          </button>
        )}
      </div>

      {total === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-8 flex flex-col items-center gap-2 text-[#F97316] bg-[#FFF7ED] hover:border-[#F97316] transition-colors"
        >
          <Camera size={28} />
          <span className="text-sm font-semibold">Add Photos (up to {maxPhotos})</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
