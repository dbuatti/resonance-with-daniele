"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup components

const AdminViewToggle: React.FC = () => {
  const { user, loading, isAdminView, toggleAdminView } = useSession();

  if (loading || !user || !user.is_admin) {
    return null; // Only show if user is an admin and session is loaded
  }

  // Determine the current value for the ToggleGroup
  const currentValue = isAdminView ? "admin" : "user";

  const handleToggleChange = (value: string) => {
    if (value === "admin" && !isAdminView) {
      toggleAdminView();
    } else if (value === "user" && isAdminView) {
      toggleAdminView();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleGroup
          type="single"
          value={currentValue}
          onValueChange={handleToggleChange}
          className="bg-primary-foreground/10 rounded-full p-0.5 shadow-inner h-auto"
          aria-label="Toggle Admin View"
        >
          <ToggleGroupItem 
            value="admin" 
            aria-label="Admin View"
            className={cn(
              "px-3 py-1 h-8 rounded-full text-sm font-medium transition-all duration-200",
              "data-[state=on]:bg-primary-foreground data-[state=on]:text-primary data-[state=on]:shadow-md",
              "data-[state=off]:text-primary-foreground data-[state=off]:hover:bg-primary-foreground/5"
            )}
          >
            <Shield className="h-4 w-4 mr-1" />
            Admin
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="user" 
            aria-label="User View"
            className={cn(
              "px-3 py-1 h-8 rounded-full text-sm font-medium transition-all duration-200",
              "data-[state=on]:bg-primary-foreground data-[state=on]:text-primary data-[state=on]:shadow-md",
              "data-[state=off]:text-primary-foreground data-[state=off]:hover:bg-primary-foreground/5"
            )}
          >
            <EyeOff className="h-4 w-4 mr-1" />
            User
          </ToggleGroupItem>
        </ToggleGroup>
      </TooltipTrigger>
      <TooltipContent>
        {isAdminView ? "Currently Admin View (Click to switch to User View)" : "Currently User View (Click to switch to Admin View)"}
      </TooltipContent>
    </Tooltip>
  );
};

export default AdminViewToggle;