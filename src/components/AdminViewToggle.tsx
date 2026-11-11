"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

interface AdminViewToggleProps {
  collapsed?: boolean;
}

const AdminViewToggle: React.FC<AdminViewToggleProps> = ({ collapsed = false }) => {
  const { user, loading, isAdminView, toggleAdminView } = useSession();

  if (loading || !user || !user.is_admin) {
    return null;
  }

  if (collapsed) {
    return (
      <Button
        onClick={toggleAdminView}
        variant={isAdminView ? "outline" : "default"}
        size="icon"
        className="h-9 w-9 rounded-lg shrink-0"
        aria-label={isAdminView ? "Exit Admin Console" : "Open Admin Console"}
      >
        {isAdminView ? <LogOut className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
      </Button>
    );
  }

  if (isAdminView) {
    return (
      <Button
        onClick={toggleAdminView}
        variant="outline"
        className="w-full h-11 gap-2 rounded-xl font-bold border-dashed border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <LogOut className="h-4 w-4" /> Exit Admin Console
      </Button>
    );
  }

  return (
    <Button
      onClick={toggleAdminView}
      className="w-full h-11 gap-2 rounded-xl font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Shield className="h-4 w-4" /> Open Admin Console
    </Button>
  );
};

export default AdminViewToggle;
