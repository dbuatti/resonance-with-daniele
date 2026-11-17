import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OverflowMenu, { type OverflowMenuProps } from "@/components/ui/overflow-menu";

export interface SectionProps {
  /** Section title. */
  title: string;
  /** One-sentence subtitle explaining what this section is for. */
  description?: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /**
   * The single primary action for this section. Only one should be passed —
   * everything else belongs in `menu`.
   */
  action?: React.ReactNode;
  /** Overflow menu config for tertiary / destructive actions. */
  menu?: Omit<OverflowMenuProps, "triggerClassName">;
  /** Optional badge / count shown next to the title. */
  badge?: React.ReactNode;
  /** Content of the section. */
  children: React.ReactNode;
  /** Tint the header background subtly. */
  mutedHeader?: boolean;
  className?: string;
  contentClassName?: string;
  /** Remove the default card padding around content (for tables). */
  flush?: boolean;
}

/**
 * Consistent section container: title + one-sentence subtitle on the left,
 * a single primary action on the right, everything else in a "..." menu.
 *
 * Enforces the "one primary action per view" rule at the section level and
 * gives every section predictable, generous spacing.
 */
const Section: React.FC<SectionProps> = ({
  title,
  description,
  icon,
  action,
  menu,
  badge,
  children,
  mutedHeader = false,
  className,
  contentClassName,
  flush = false,
}) => {
  return (
    <Card className={cn("rounded-[2rem] border-border/60 shadow-sm overflow-hidden", className)}>
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between gap-4 space-y-0 p-5 md:p-6",
          mutedHeader && "bg-muted/30 border-b border-border/50",
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black font-lora leading-tight text-foreground">{title}</h3>
              {badge}
            </div>
            {description && (
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {(action || menu) && (
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {menu && <OverflowMenu {...menu} />}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn(flush ? "p-0" : "p-5 md:p-6 pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export default Section;