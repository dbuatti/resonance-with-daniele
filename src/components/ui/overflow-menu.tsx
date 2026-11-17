import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface OverflowAction {
  /** Visible label for the action. */
  label: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Called when the item is selected. */
  onSelect: () => void;
  /** Styles the item as destructive (red). */
  destructive?: boolean;
  /** Disables the item. */
  disabled?: boolean;
}

export interface OverflowMenuProps {
  /** Actions to render inside the menu. */
  actions: OverflowAction[];
  /** Optional heading shown at the top of the menu. */
  label?: string;
  /** Separator index positions — a separator is rendered *before* these indices. */
  separatorBefore?: number[];
  /** Tooltip text for the trigger (defaults to "More actions"). */
  triggerLabel?: string;
  /** Icon override for the trigger (defaults to an ellipsis). */
  triggerIcon?: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
}

/**
 * Single, consistent "..." overflow menu. Use this to tuck away
 * tertiary / destructive / administrative actions so the primary
 * action on a card or section stays unambiguous.
 */
const OverflowMenu: React.FC<OverflowMenuProps> = ({
  actions,
  label,
  separatorBefore = [],
  triggerLabel = "More actions",
  triggerIcon,
  align = "end",
  className,
  triggerClassName,
}) => {
  if (!actions || actions.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={triggerLabel}
              className={cn(
                "h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                triggerClassName,
              )}
            >
              {triggerIcon || <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{triggerLabel}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={align} className={cn("w-52", className)}>
        {label && <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</DropdownMenuLabel>}
        {actions.map((action, i) => (
          <React.Fragment key={`${action.label}-${i}`}>
            {separatorBefore.includes(i) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={action.disabled}
              onSelect={action.onSelect}
              className={cn(
                "gap-2 font-medium cursor-pointer",
                action.destructive && "text-destructive focus:text-destructive focus:bg-destructive/10",
              )}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OverflowMenu;