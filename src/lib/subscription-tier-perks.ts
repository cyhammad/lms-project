import { PRO_PLAN_MAX_SCHOOL_ADMINS, STARTER_PLAN_MAX_SCHOOL_ADMINS } from '@/constants/subscription-limits';

/** Split on commas not inside (...). */
function splitCommaOutsideParens(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth += 1;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && c === ',' && s[i + 1] === ' ') {
      const chunk = s.slice(start, i).trim();
      if (chunk) parts.push(chunk);
      start = i + 2;
      i += 1;
    }
  }
  const last = s.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

function splitSentenceAfterPeriod(s: string): string[] {
  const parts = s.split(/\.\s+(?=[A-Z])/);
  return parts.map((p) => p.replace(/\.\s*$/, '').trim()).filter(Boolean);
}

function expandWithSentenceSplits(segments: string[]): string[] {
  const out: string[] = [];
  for (const item of segments) {
    const subs = splitSentenceAfterPeriod(item);
    out.push(...(subs.length > 1 ? subs : [item]));
  }
  return out;
}

/** Parse DB / admin-entered description into perk lines. */
export function parseDescriptionToPerks(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const byNewline = normalized
    .split('\n')
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const single = byNewline[0] ?? normalized;

  const bySemi = single
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySemi.length > 1) return expandWithSentenceSplits(bySemi);

  const commaParts = splitCommaOutsideParens(single);
  if (commaParts.length <= 1) return expandWithSentenceSplits([single]);

  return expandWithSentenceSplits(commaParts);
}

/**
 * Canonical marketing bullets for built-in tiers (subscription page).
 * Keeps UI correct even if DB `description` is stale; custom tier slugs fall back to {@link parseDescriptionToPerks}.
 */
export const CANONICAL_SUBSCRIPTION_TIER_PERKS: Record<string, string[]> = {
  free: [
    'School admin: dashboard and core administration (no extra admins beyond default)',
    'Academics without exams module',
    'Admission: enroll, promote, and demote students',
    'Students and staff without ID cards',
    'Leaves and basic attendance (no teacher geofencing)',
    'App access and daily diary',
    'Parent app: view-only',
  ],
  starter: [
    'Everything in the Free plan',
    'Salary (all permissions)',
    'Fee (all permissions)',
    'Accounting (all permissions)',
    'Leaves (all permissions)',
    'Academics: Exams',
    `Up to ${STARTER_PLAN_MAX_SCHOOL_ADMINS} admin users (Administration → Admins)`,
    'Attendance with teacher geofencing',
    'ID cards (students and staff)',
    'Announcements',
  ],
  pro: [
    'Everything in the Starter plan',
    'Expense and budget management (expenses & categories)',
    'Parent–teacher messaging between mobile apps (full chat)',
    `Up to ${PRO_PLAN_MAX_SCHOOL_ADMINS} admin users (Starter allows ${STARTER_PLAN_MAX_SCHOOL_ADMINS})`,
    'Priority support',
    'Onboarding',
  ],
  enterprise: [
    'All permissions on every module — no subscription limits (school admin, teacher app, parent app)',
    'Unlimited school administrators',
    'Everything in Pro and below, at full access',
    'Multi-branching, custom branding, dedicated account manager, onsite training (as agreed)',
  ],
};

export function getTierPerksForDisplay(slug: string | undefined | null, description: string | null | undefined): string[] {
  if (slug && CANONICAL_SUBSCRIPTION_TIER_PERKS[slug]) {
    return CANONICAL_SUBSCRIPTION_TIER_PERKS[slug];
  }
  return parseDescriptionToPerks(description);
}
