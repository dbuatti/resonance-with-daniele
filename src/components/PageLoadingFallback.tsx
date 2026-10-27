"use client";

import { Loader2 } from "lucide-react";

/**
 * Lightweight route-level loading fallback used while a lazily-loaded page
 * chunk is fetched. Keeps the branded feel (spinner + label) without pulling in
 * the heavier full Layout skeleton.
 */
const PageLoadingFallback = ({ label = "Loading..." }: { label?: string }) => (
  <div className="min-h-[60vh] flex items-center justify-center px-6">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  </div>
);

export default PageLoadingFallback;
