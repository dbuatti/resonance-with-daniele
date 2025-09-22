"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // The ThemeLogger component was causing a React.Children.only error
  // because NextThemesProvider expects a single child.
  // The logic for applying dark class is now handled directly by next-themes
  // and your globals.css file, making this logger redundant.
  
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}