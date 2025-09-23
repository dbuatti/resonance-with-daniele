"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Removed ThemeLogger component and its usage to ensure NextThemesProvider receives a single child.
  // Logging can be done in components that consume the theme context (e.g., ThemeToggle, Layout).
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}