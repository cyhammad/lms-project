import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  Inbox,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export interface SuperAdminNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export interface SuperAdminNavSection {
  title: string;
  items: SuperAdminNavItem[];
}

export const superAdminNavSections: SuperAdminNavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        href: ROUTES.SUPER_ADMIN.DASHBOARD,
      },
    ],
  },
  {
    title: 'Directory',
    items: [
      { icon: Building2, label: 'Schools', href: ROUTES.SUPER_ADMIN.SCHOOLS },
      { icon: Users, label: 'Users', href: ROUTES.SUPER_ADMIN.USERS },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      { icon: Layers, label: 'Subscriptions', href: ROUTES.SUPER_ADMIN.SUBSCRIPTIONS },
      {
        icon: Inbox,
        label: 'Upgrade requests',
        href: ROUTES.SUPER_ADMIN.SUBSCRIPTION_REQUESTS,
      },
    ],
  },
];
