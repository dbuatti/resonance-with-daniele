"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Mail, BellRing, Users, BarChart3, Settings, TrendingUp, Lightbulb, Rocket, ShieldCheck, ArrowRight, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AiMarketingToolsCard from "@/components/admin/AiMarketingToolsCard";
import { Badge } from "@/components/ui/badge";

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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-base font-medium text-muted-foreground">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center shadow-xl rounded-2xl border-destructive/20 border-2">
          <CardHeader className="flex flex-col items-center">
            <div className="bg-destructive/10 p-3 rounded-full mb-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-black font-lora">Access Denied</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground mt-1">
              You do not have permission to access the Command Center.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button asChild size="lg" className="w-full rounded-xl font-bold">
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminTools = [
    {
      title: "Growth Strategy",
      description: "High-impact missions to scale Resonance. Track your 1-year vision and local SEO progress.",
      icon: <Rocket className="h-5 w-5 text-primary" />,
      link: "/admin/growth",
      label: "View Missions",
      highlight: true,
      badge: "Priority"
    },
    {
      title: "Feedback Analysis",
      description: "Review post-session feedback. See what people loved and what needs refining for next time.",
      icon: <MessageSquareQuote className="h-5 w-5 text-primary" />,
      link: "/admin/feedback",
      label: "Analyze Feedback",
      highlight: true,
      badge: "New"
    },
    {
      title: "Member Directory",
      description: "Manage your community. View profiles, update roles, and sync data with Kit.com.",
      icon: <Users className="h-5 w-5 text-primary" />,
      link: "/admin/members",
      label: "Manage Members"
    },
    {
      title: "Marketing & Finance",
      description: "The engine room. Track ticket sales, log expenses, and manage flash sale promotions.",
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      link: "/admin/marketing",
      label: "View Dashboard"
    },
    {
      title: "Event Command",
      description: "Real-time execution for upcoming sessions. Outreach trackers and AI prompt generators.",
      icon: <Lightbulb className="h-5 w-5 text-primary" />,
      link: "/admin/marketing-plan",
      label: "Open Command Center"
    },
    {
      title: "Survey Insights",
      description: "Understand your singers. Analyze aggregated feedback and community preferences.",
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      link: "/admin/survey-data",
      label: "View Insights"
    },
    {
      title: "Announcements",
      description: "Keep the circle informed. Create and manage updates that appear on member dashboards.",
      icon: <BellRing className="h-5 w-5 text-primary" />,
      link: "/admin/announcements",
      label: "Manage Updates"
    }
  ];

  return (
    <div className="space-y-10 py-6 md:py-10 max-w-7xl mx-auto px-4">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-1">
          <ShieldCheck className="h-3 w-3" />
          <span>Administrator Access</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-lora tracking-tighter leading-none">
          Command Center
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Welcome back, Daniele. Oversee your community and track your growth from one central hub.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-2xl font-black font-lora tracking-tight">Live Overview</h2>
        </div>
        <AdminDashboardOverview />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-2xl font-black font-lora tracking-tight">Management Tools</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTools.map((tool, i) => (
            <Card key={i} className={cn(
              "relative flex flex-col shadow-md rounded-2xl border-none bg-card transition-all duration-500 group hover:shadow-xl hover:-translate-y-0.5 overflow-hidden",
              tool.highlight && "ring-2 ring-primary/10"
            )}>
              {tool.highlight && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px]">
                    {tool.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  {tool.icon}
                </div>
                <CardTitle className="text-xl font-black font-lora leading-tight">{tool.title}</CardTitle>
                <CardDescription className="text-sm font-medium leading-relaxed pt-1">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <Button asChild size="sm" className="w-full h-10 font-black rounded-xl shadow-md group-hover:shadow-lg transition-all" variant={tool.highlight ? "default" : "secondary"}>
                  <Link to={tool.link}>
                    {tool.label} <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          
          <AiMarketingToolsCard />
        </div>
      </section>

      <footer className="text-center pt-8 border-t border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
          Resonance Admin System v2.0
        </p>
      </footer>
    </div>
  );
};

export default AdminZone;