"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";
import { ShieldCheck } from "lucide-react";
import { showError } from "@/utils/toast";

interface AdminWorkbenchShellProps {
  title: string;
  description?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  left?: React.ReactNode;
  backTo?: string;
  className?: string;
  children: React.ReactNode;
}

const AdminWorkbenchShell: React.FC<AdminWorkbenchShellProps> = ({
  title,
  description,
  badge,
  badgeIcon,
  actions,
  toolbar,
  left,
  backTo,
  className,
  children,
}) => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: Administrator access required.");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-base font-medium text-muted-foreground">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) return null;

  return (
    <div className={cn("w-full space-y-8", className)}>
      <header className="space-y-5">
        {backTo && <BackButton to={backTo} />}

        {(badge || badgeIcon) && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            {badgeIcon || <ShieldCheck className="h-3 w-3" />}
            {badge && <span>{badge}</span>}
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 min-w-0">
            <h1 className="text-3xl md:text-5xl font-black font-lora tracking-tighter leading-none">
              {title}
            </h1>
            {description && (
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </header>

      {toolbar && <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">{toolbar}</div>}

      {left ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[20rem_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar pr-1">
            {left}
          </aside>
          <div className="min-w-0 w-full">{children}</div>
        </div>
      ) : (
        <div className="w-full">{children}</div>
      )}
    </div>
  );
};

export default AdminWorkbenchShell;