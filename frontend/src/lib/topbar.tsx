'use client';

import { createContext, useContext } from 'react';

interface TopbarTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

export const TopbarTitleContext = createContext<TopbarTitleContextValue>({
  title: '',
  setTitle: () => {},
});

export function useTopbarTitle() {
  return useContext(TopbarTitleContext);
}
