/**
 * School admin seat caps by subscription tier.
 * Keep in sync with `STARTER_PLAN_MAX_SCHOOL_ADMINS` and `PRO_PLAN_MAX_SCHOOL_ADMINS` in
 * `lms-server/src/services/subscription-tier-defaults.ts`.
 */
export const STARTER_PLAN_MAX_SCHOOL_ADMINS = 3;
export const PRO_PLAN_MAX_SCHOOL_ADMINS = 5;

export type SchoolAdminSeatCappedPlan = 'starter' | 'pro';

/** Max admins for tiers with a cap; `null` = no cap (e.g. Enterprise or unassigned). */
export function schoolAdminSeatLimit(tierSlug: string | null | undefined): number | null {
  if (tierSlug === 'starter') return STARTER_PLAN_MAX_SCHOOL_ADMINS;
  if (tierSlug === 'pro') return PRO_PLAN_MAX_SCHOOL_ADMINS;
  return null;
}

export function schoolAdminSeatPlanLabel(tierSlug: string | null | undefined): SchoolAdminSeatCappedPlan | null {
  if (tierSlug === 'starter' || tierSlug === 'pro') return tierSlug;
  return null;
}
