'use client';

import { useState } from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { Category, ItemPhotoResponse } from '@/lib/types';
import { CategoryLucideIcon } from '@/components/items/CategoryIcon';

/** Categories the API withholds photos for until a claim is verified — see API.md's Visibility rules. */
export const RESTRICTED_PHOTO_CATEGORIES: Category[] = ['PHONE', 'LAPTOP', 'WALLET', 'ID_CARD', 'JEWELLERY'];

interface ItemPhotoGalleryProps {
  photos: ItemPhotoResponse[];
  title: string;
  category: Category;
  viewerIsReporter: boolean;
  onBack: () => void;
}

/**
 * Mobile: stacked photo area with an icon back button baked in.
 * Desktop: the same area renders as a rounded card (the page supplies its own
 * "Back to Browse" text link above), plus a banner below explaining verified
 * access — the mobile equivalent is the small overlay pill on the photo itself.
 */
export function ItemPhotoGallery({ photos, title, category, viewerIsReporter, onBack }: ItemPhotoGalleryProps) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const showPhotos = photos.length > 0;
  const isRestrictedCategory = RESTRICTED_PHOTO_CATEGORIES.includes(category);

  // Photos are present for a normally-restricted category and the viewer isn't the
  // reporter — the only way that happens is verified/privileged access (approved
  // claimant or admin), since browsing students get an empty array for these categories.
  const hasVerifiedAccess = showPhotos && isRestrictedCategory && !viewerIsReporter;
  const photosWithheld = !showPhotos && isRestrictedCategory && !viewerIsReporter;

  return (
    <div>
      <div className="relative">
        {showPhotos ? (
          <div className="relative bg-gray-100 md:rounded-2xl md:overflow-hidden">
            <img
              src={photos[photoIdx]?.url}
              alt={title}
              className="w-full h-64 md:h-[420px] object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={onBack}
              className="md:hidden absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/30 backdrop-blur-sm text-white flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            {hasVerifiedAccess && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <ShieldCheck size={13} />
                Verified Photo Access
              </div>
            )}
          </div>
        ) : (
          <div className="relative bg-gray-100 h-48 md:h-[420px] md:rounded-2xl flex flex-col items-center justify-center gap-2 px-8 text-center">
            <CategoryLucideIcon category={category} size={48} className="text-gray-300" />
            {photosWithheld && (
              <p className="text-xs font-medium text-gray-400 leading-relaxed max-w-[220px]">
                Photo access is restricted for this category until a claim is verified.
              </p>
            )}
            <button
              onClick={onBack}
              className="md:hidden absolute top-4 left-4 w-9 h-9 rounded-xl bg-white border border-gray-100 text-gray-700 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>

      {hasVerifiedAccess && (
        <div className="hidden md:flex items-center gap-2.5 mt-3 bg-[#FFF7ED] border border-[#FDBA74] text-[#C2410C] text-sm font-semibold rounded-2xl px-4 py-3">
          <ShieldCheck size={16} className="shrink-0" />
          Verified photo access active. Details are pixelated for privacy.
        </div>
      )}
    </div>
  );
}
