// All items navigate to /profile?tab=<id> so the profile page handles everything in one place.

export const ACCOUNT_ITEMS = [
  {
    id: 'my-profile',
    label: 'My Profile',
    description: 'View and edit your profile',
    icon: 'user',
    to: '/profile',
  },
  {
    id: 'account-settings',
    label: 'Account Settings',
    description: 'Manage your account details',
    icon: 'settings',
    to: '/profile?tab=account-settings',
  },
  {
    id: 'notifications',
    label: 'Notification Preferences',
    description: 'Configure alerts and emails',
    icon: 'bell',
    to: '/profile?tab=notifications',
  },
  {
    id: 'appearance',
    label: 'Appearance Settings',
    description: 'Theme, language and display',
    icon: 'palette',
    to: '/profile?tab=appearance',
  },
]

export const SECURITY_ITEMS = [
  {
    id: 'change-password',
    label: 'Change Password',
    description: 'Update your login password',
    icon: 'key',
    to: '/profile?tab=change-password',
  },
  {
    id: 'security-settings',
    label: 'Security Settings',
    description: 'Manage sessions and access',
    icon: 'shield',
    to: '/profile?tab=security-settings',
  },
]

export function filterByRole(items, role) {
  if (!role) return items
  return items.filter(item => !item.roles || item.roles.includes(role))
}
