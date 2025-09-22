"use client";

import React from "react";
import { Link } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface ProfileNavigationProps {
  currentPath: string;
}

const ProfileNavigation: React.FC<ProfileNavigationProps> = ({ currentPath }) => {
  return (
    <div className="flex justify-center mb-8">
      <ToggleGroup type="single" value={currentPath} className="bg-muted-foreground/10 rounded-full p-1 shadow-inner">
        <ToggleGroupItem value="/profile" asChild className={cn(
          "px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200",
          currentPath === "/profile" ? "bg-primary text-primary-foreground shadow-md" : "bg-transparent text-foreground hover:bg-muted-foreground/20"
        )}>
          <Link to="/profile">My Profile</Link>
        </ToggleGroupItem>
        <ToggleGroupItem value="/profile/survey" asChild className={cn(
          "px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200",
          currentPath === "/profile/survey" ? "bg-primary text-primary-foreground shadow-md" : "bg-transparent text-foreground hover:bg-muted-foreground/20"
        )}>
          <Link to="/profile/survey">Survey</Link>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ProfileNavigation;