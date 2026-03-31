export type SubscriptionAppSurface = 'SCHOOL_ADMIN' | 'TEACHER_APP' | 'PARENT_APP';

export type SubscriptionModule = {
  id: string;
  moduleKey: string;
  appSurface: SubscriptionAppSurface;
  groupLabel: string | null;
  label: string;
  description: string | null;
  sortOrder: number;
};

export type SubscriptionTierSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { schools: number };
};

export type SubscriptionTierPermissionRow = {
  id: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  module: SubscriptionModule;
};

export type SubscriptionTierDetail = SubscriptionTierSummary & {
  tierPermissions: SubscriptionTierPermissionRow[];
};

/** GET /subscription/tiers/catalog */
export type SubscriptionTierCatalogEntry = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isSystem: boolean;
};

export type SubscriptionUpgradeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** GET /subscription/me/subscription-upgrade-requests — pending only */
export type SchoolPendingSubscriptionUpgrade = {
  id: string;
  schoolId: string;
  requestedTierId: string;
  status: SubscriptionUpgradeRequestStatus;
  requestedTier: {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
  };
};

/** GET /subscription/upgrade-requests (super admin) */
export type SubscriptionUpgradeRequestRow = {
  id: string;
  schoolId: string;
  requestedTierId: string;
  status: SubscriptionUpgradeRequestStatus;
  createdByUserId: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  school: { id: string; name: string };
  requestedTier: {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
  };
  createdByUser: { id: string; name: string; email: string } | null;
  reviewedByUser: { id: string; name: string; email: string } | null;
};

/** Response from GET /subscription/me/effective?surface=SCHOOL_ADMIN */
export type SubscriptionEffectiveForSchool = {
  schoolId: string;
  schoolName: string;
  tier: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sortOrder: number;
  } | null;
  modules: Array<{
    moduleKey: string;
    label: string;
    groupLabel: string | null;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
};
