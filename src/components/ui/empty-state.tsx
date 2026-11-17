import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Icon or illustration shown inside the circular badge. */
  icon: React.ReactNode;
  /** Short, human explanation of what this area is for. */
  title: string;
  /** One sentence on why it matters / what will appear here. */
  description: string;
  /** Optional single primary call-to-action. */
  action?: EmptyStateAction;
  /** Optional secondary helper line (e.g. "Supported: .csv, .tsv"). */
  hint?: string;
  className?: string;
}

/**
 * Focused empty-state card: one idea, one explanation, one clear next step.
 * Replaces bare "Nothing here yet." strings scattered across the admin.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  hint,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-[2rem] border border-dashed border-border/70 bg-muted/20 px-6 py-14 md:py-16",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm text-primary mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-black font-lora tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed max-w-md">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
        >
          {action.icon}
          {action.label}
        </button>
      )}
      {hint && (
        <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  );
};

export default EmptyState;