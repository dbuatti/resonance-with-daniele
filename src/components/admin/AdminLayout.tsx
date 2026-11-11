"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import AdminSidebar from "./AdminSidebar";
import BackToTopButton from "@/components/BackToTopButton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Shield } from "lucide-react";
import { showError } from "@/utils/toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xl font-black font-lora text-primary animate-pulse">Finding the resonance...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-md z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-muted transition-colors" />
            <div className="hidden md:flex ml-auto items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/10">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Admin Console</span>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 pt-4 md:pt-6 pb-8">
            <div className="w-full animate-fade-in-up">
              {children}
            </div>
          </main>
        </div>
      </div>
      <BackToTopButton />
    </SidebarProvider>
  );
};

export default AdminLayout;
