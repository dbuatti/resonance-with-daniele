"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Add a component to log theme state within the provider
  const ThemeLogger = () => {
    const { theme, resolvedTheme } = useTheme();
    React.useEffect(() => {
      console.log("[ThemeProvider] Current theme:", theme);
      console.log("[ThemeProvider] Resolved theme:", resolvedTheme);
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [theme, resolvedTheme]);
    return null;
  };

  return (
    <NextThemesProvider {...props}>
      <React.Fragment> {/* Wrap ThemeLogger and children in a Fragment */}
        <ThemeLogger />
        {children}
      </React.Fragment>
    </NextThemesProvider>
  );
}