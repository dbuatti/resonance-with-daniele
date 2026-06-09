"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";
import { ShieldCheck, Loader2, AlertCircle, Inbox } from "lucide-react";
import { showError } from "@/utils/toast";

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: Error | string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  backTo?: string;
  actions?: React.ReactNode;
  headerClassName?: string;
  className?: string;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  title,
  description,
  badge,
  badgeIcon,
  children,
  isLoading,
  loadingMessage,
  error,
  empty,
  emptyMessage,
  emptyIcon,
  backTo,
  actions,
  headerClassName,
  className,
}) => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionLoading && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, sessionLoading, navigate]);

  if (sessionLoading) {
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
    <div className={cn("py-2 space-y-10", className)}>
      {backTo && <BackButton to={backTo} />}

      <header className={cn("space-y-6", headerClassName)}>
        {(badge || badgeIcon) && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            {badgeIcon || <ShieldCheck className="h-3 w-3" />}
            {badge && <span>{badge}</span>}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-black font-lora tracking-tighter leading-none">
              {title}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            {loadingMessage && (
              <p className="text-base font-medium text-muted-foreground">{loadingMessage}</p>
            )}
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-xl font-bold text-destructive font-lora">Failed to Load</p>
            <p className="text-base text-muted-foreground">
              {typeof error === "string" ? error : error.message}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && empty && (
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            {emptyIcon || <Inbox className="h-12 w-12 text-muted-foreground/40" />}
            <p className="text-xl font-bold text-muted-foreground font-lora">
              {emptyMessage || "Nothing here yet."}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && !empty && children}
    </div>
  );
};

export default AdminPageLayout;
