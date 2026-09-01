export type Role = 'STUDENT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'OPEN' | 'CLAIM_PENDING' | 'MATCHED' | 'RETURNED' | 'EXPIRED' | 'CANCELLED';
export type Category = 'PHONE' | 'LAPTOP' | 'ID_CARD' | 'KEYS' | 'BAG' | 'BOOK' | 'WALLET' | 'CLOTHING' | 'JEWELLERY' | 'OTHER';
export type ClaimStatus = 'PENDING' | 'AWAITING_INFO' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type MatchStatus = 'SUGGESTED' | 'DISMISSED' | 'CLAIMED';
export type NotificationType =
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'MATCH_FOUND'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_INFO_REQUESTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'HANDOVER_REMINDER'
  | 'ITEM_EXPIRING';

export interface UserResponse {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface ContactResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface ItemPhotoResponse {
  id: string;
  url: string;
  position: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ItemSummaryResponse {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: Category;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  occurredOn: string;
  thumbnailUrl: string | null;
  hasPhotos: boolean;
  createdAt: string;
}

export interface ItemDetailResponse {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: Category;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  locationDetail: string | null;
  occurredOn: string;
  attributes: Record<string, unknown>;
  photos: ItemPhotoResponse[];
  createdAt: string;
  viewerIsReporter: boolean;
  reporter?: ContactResponse;
  verificationAnswer?: string;
}

export interface ClaimSummaryResponse {
  id: string;
  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  status: ClaimStatus;
  decidedAt: string | null;
  createdAt: string;
}

export interface ClaimDetailResponse {
  id: string;
  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  status: ClaimStatus;
  description: string;
  lostContext: string | null;
  evidenceUrls: string[];
  infoRequest?: string;
  infoResponse?: string;
  decisionReason?: string;
  decidedAt?: string;
  finderConfirmed: boolean;
  claimantConfirmed: boolean;
  viewerRole: 'CLAIMANT' | 'FINDER' | 'ADMIN';
  counterpartContact?: ContactResponse;
  createdAt: string;
}

export interface MatchResponse {
  id: string;
  score: number;
  status: MatchStatus;
  breakdown: Record<string, unknown>;
  lostItemId: string;
  candidate: ItemSummaryResponse;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  suspendedUsers: number;
  totalItems: number;
  lostReports: number;
  foundReports: number;
  openItems: number;
  returnedItems: number;
  expiredItems: number;
  recoveryRatePercent: number;
  claimsByStatus: Record<ClaimStatus, number>;
  medianReviewHours: number | null;
  matchesSuggested: number;
  matchesDismissed: number;
  matchesLeadingToClaims: number;
}

export interface AdminClaimReviewResponse {
  id: string;
  status: ClaimStatus;
  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  itemDescription: string | null;
  itemLocationLabel: string | null;
  itemPhotoUrls: string[];
  finderVerificationAnswer: string;
  claimantDescription: string;
  claimantLostContext: string | null;
  claimantEvidenceUrls: string[];
  claimantLostItemId?: string;
  finder: ContactResponse;
  claimant: ContactResponse;
  claimantMatricNumber: string;
  infoRequest?: string;
  infoResponse?: string;
  decisionReason?: string;
  decidedAt?: string;
  reviewedByName?: string;
  competingClaims: number;
  createdAt: string;
}

export interface AdminUserResponse {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  traceId?: string;
  fieldErrors?: { field: string; message: string }[];
}
