"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageLoadingContextType {
  pageLoading: boolean;
  setPageLoading: (isLoading: boolean) => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined);

export const PageLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageLoading, setPageLoading] = useState(true); // Default to true for initial page load

  return (
    <PageLoadingContext.Provider value={{ pageLoading, setPageLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
};

export const usePageLoading = () => {
  const context = useContext(PageLoadingContext);
  if (context === undefined) {
    throw new Error('usePageLoading must be used within a PageLoadingProvider');
  }
  return context;
};