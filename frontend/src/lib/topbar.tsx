'use client';

import { createContext, useContext } from 'react';

/* ─── Topbar Title Context ─── */
const TopbarTitleContext = createContext<{
  title: string;
  setTitle: (t: string) => void;
}>({ title: '', setTitle: () => {} });

export function useTopbarTitle() {
  return useContext(TopbarTitleContext);
}

export { TopbarTitleContext };