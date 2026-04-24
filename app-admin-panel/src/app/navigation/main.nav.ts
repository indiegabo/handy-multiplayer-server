import { NavigationItem, NavigationSection } from "src/app/shared/components/navigation/navigation-item";

export const mainNavigationSection: NavigationSection = {
  meta: {
    id: 'main',
    order: 1,
    visible: true
  },
  items: [
    {
      id: 'dashboard',
      displayName: 'Dashboard',
      route: 'app/dashboard',
      icon: { style: 'fas', name: 'dashboard' },
      active: false
    }
  ]
};
