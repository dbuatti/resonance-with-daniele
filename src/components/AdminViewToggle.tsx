"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const AdminViewToggle: React.FC = () => {
  const { user, loading, isAdminView, toggleAdminView } = useSession();

  if (loading || !user || !user.is_admin) {
    return null; // Only show if user is an admin and session is loaded
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAdminView}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
            !isAdminView && "bg-primary-foreground/20 text-accent font-semibold"
          )}
        >
          {isAdminView ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <span className="hidden lg:inline">
            {isAdminView ? "Admin View" : "User View"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isAdminView ? "Switch to User View (Hide Admin Features)" : "Switch to Admin View (Show Admin Features)"}
      </TooltipContent>
    </Tooltip>
  );
};

export default AdminViewToggle;