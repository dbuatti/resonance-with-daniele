"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BellRing, Users, BarChart3, TrendingUp, Lightbulb, Rocket, ShieldCheck, ArrowRight, MessageSquareQuote, BookOpen, Zap, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AiMarketingToolsCard from "@/components/admin/AiMarketingToolsCard";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";

const AdminZone: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      navigate("/");
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

  const adminTools = [
    {
      title: "Growth Strategy",
      description: "High-impact missions to scale Resonance. Track your 1-year vision and local SEO progress.",
      icon: <Rocket className="h-6 w-6 text-primary" />,
      link: "/admin/growth",
      highlight: true,
      badge: "Priority"
    },
    {
      title: "Session Hub Guide",
      description: "Learn how to link resources to events and manage your personal lesson notes for members.",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      link: "/admin/session-hub-guide",
      label: "Read Guide"
    },
    {
      title: "Feedback Analysis",
      description: "Review post-session feedback. See what people loved and what needs refining for next time.",
      icon: <MessageSquareQuote className="h-6 w-6 text-primary" />,
      link: "/admin/feedback",
      label: "Analyze Feedback"
    },
    {
      title: "Member Directory",
      description: "Manage your community. View profiles, update roles, and sync data with Kit.com.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "/admin/members",
      label: "Manage Members"
    },
    {
      title: "Marketing & Finance",
      description: "The engine room. Track ticket sales, log expenses, and manage flash sale promotions.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "/admin/marketing",
      label: "View Dashboard"
    },
    {
      title: "Event Command",
      description: "Real-time execution for upcoming sessions. Outreach trackers and AI prompt generators.",
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      link: "/admin/marketing-plan",
      label: "Open Command Center"
    },
    {
      title: "Survey Insights",
      description: "Understand your singers. Analyze aggregated feedback and community preferences.",
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      link: "/admin/survey-data",
      label: "View Insights"
    },
    {
      title: "Announcements",
      description: "Keep the circle informed. Create and manage updates that appear on member dashboards.",
      icon: <BellRing className="h-6 w-6 text-primary" />,
      link: "/admin/announcements",
      label: "Manage Updates"
    }
  ];

  return (
    <div className="py-2 space-y-12">
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <ShieldCheck className="h-3 w-3" />
          <span>Administrator Access</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">
          Command Center
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
          Welcome back, Daniele. Oversee your community and track your growth.
        </p>
      </header>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">Live Overview</h2>
        </div>
        <AdminDashboardOverview />
      </section>

      <section className="space-y-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">Management Tools</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {adminTools.map((tool, i) => (
            <div key={i} className={cn(
              "relative flex flex-col p-10 rounded-[2.5rem] border-2 transition-all duration-500 group",
              tool.highlight ? "bg-primary/5 border-primary/20 shadow-2xl" : "bg-card border-primary/5 hover:border-primary/20 hover:shadow-2xl"
            )}>
              {tool.highlight && (
                <div className="absolute top-8 right-8">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px]">
                    {tool.badge}
                  </Badge>
                </div>
              )}
              <div className="bg-primary/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                {tool.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-black font-lora leading-tight mb-3">{tool.title}</h3>
              <p className="text-base font-medium text-muted-foreground leading-relaxed mb-10">
                {tool.description}
              </p>
              <Button asChild size="lg" className="mt-auto w-full h-14 font-black rounded-xl shadow-lg" variant={tool.highlight ? "default" : "secondary"}>
                <Link to={tool.link}>
                  {tool.label || "Open Tool"} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          ))}
          
          <AiMarketingToolsCard />
        </div>
      </section>

      <footer className="text-center pt-16 border-t border-border/50 pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          Resonance Admin System v2.0
        </p>
      </footer>
    </div>
  );
};

export default AdminZone;