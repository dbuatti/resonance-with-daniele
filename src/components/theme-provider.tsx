"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Re-adding the useEffect to ensure the 'dark' class is correctly applied/removed
  // from the document.documentElement, which is essential for Tailwind CSS theme switching.
  const { theme, resolvedTheme } = useTheme();
  React.useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}