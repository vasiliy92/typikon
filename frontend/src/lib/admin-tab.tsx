'use client';

import { createContext, useContext } from 'react';

export type AdminTab = 'dashboard' | 'calendar' | 'saints' | 'blocks' | 'templates' | 'users' | 'import';

export const AdminTabContext = createContext<{
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export function useAdminTab() {
  return useContext(AdminTabContext);
}
