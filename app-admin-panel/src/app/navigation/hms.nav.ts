import { NavigationItem, NavigationSection } from "src/app/shared/components/navigation/navigation-item";

export const hmsNavigationSection: NavigationSection = {
  meta: {
    id: 'hms',
    order: 9999,
    visible: true
  },
  header: {
    title: 'Handy Multiplayer Server',
    subtitle: 'Core',
    icon: { style: 'fas', name: 'server' }
  },
  items: [
    {
      id: 'users',
      displayName: 'Users',
      icon: { style: 'fas', name: 'users' },
      route: 'app/hms/users',
      active: false,
      children: [
        {
          id: 'create-admin-invite',
          displayName: 'Create Admin Invite',
          icon: { style: 'fas', name: 'user-plus' },
          route: 'app/hms/users/create-admin-invite',
          active: false
        },
        {
          id: 'users-finder',
          displayName: 'Finder',
          icon: { style: 'fas', name: 'search' },
          route: 'app/hms/users/finder',
          active: false
        }
      ]
    },
    {
      id: 'maintenance',
      displayName: 'Maintenance',
      route: 'app/hms/maintenance',
      icon: { style: 'fas', name: 'wrench' },
      active: false,
      children: [
        {
          id: 'panel',
          displayName: 'Panel',
          icon: { style: 'fas', name: 'dashboard' },
          route: 'app/hms/maintenance/panel',
          active: false
        }
      ]
    }
  ]
};
