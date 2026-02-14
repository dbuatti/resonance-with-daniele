"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, LogOut, Loader2, Settings, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserAccountDropdownProps {
  user: any;
  profile: any;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
  incompleteTasksCount: number;
  isProfileCompleted: boolean;
  isSurveyCompleted: boolean;
}

const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  user,
  profile,
  isLoggingOut,
  logout,
  incompleteTasksCount,
  isProfileCompleted,
  isSurveyCompleted,
}) => {
  const displayName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Avatar className="h-7 w-7">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="hidden md:inline">{displayName}</span>
          {incompleteTasksCount > 0 && (
            <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold rounded-full">
              {incompleteTasksCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {incompleteTasksCount > 0 && (
          <>
            <DropdownMenuLabel className="font-bold text-destructive">
              Action Required ({incompleteTasksCount})
            </DropdownMenuLabel>
            {!isProfileCompleted && (
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center text-destructive">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Complete Profile</span>
                </Link>
              </DropdownMenuItem>
            )}
            {!isSurveyCompleted && (
              <DropdownMenuItem asChild>
                <Link to="/profile/survey" className="flex items-center text-destructive">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Complete Survey</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile/survey" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span>My Survey</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} disabled={isLoggingOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountDropdown;