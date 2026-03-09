"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Mail, BellRing, Users, BarChart3, Settings, TrendingUp, Lightbulb, Rocket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";

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
        <p className="text-lg text-muted-foreground">Loading admin access...</p>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center shadow-lg rounded-xl border-destructive/20 border-2">
          <CardHeader className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold font-lora">Access Denied</CardTitle>
            <CardDescription className="text-muted-foreground">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className={cn(buttonVariants({ variant: "default" }))}>
              Go to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminTools = [
    {
      title: "Growth Strategy",
      description: "High-impact missions to scale Resonance over the next year.",
      icon: <Rocket className="h-6 w-6 text-primary" />,
      link: "/admin/growth",
      label: "View Missions",
      highlight: true
    },
    {
      title: "Member Management",
      description: "View all member profiles, manage roles, and edit details.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "/admin/members",
      label: "Manage Members"
    },
    {
      title: "Marketing & Finance",
      description: "Track expenses, ticket sales, and manage flash sale promos.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "/admin/marketing",
      label: "View Dashboard"
    },
    {
      title: "March 14 Plan",
      description: "View the specific marketing strategy and captions for this Saturday.",
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      link: "/admin/marketing-plan",
      label: "View Strategy"
    },
    {
      title: "Survey Insights",
      description: "Analyze aggregated data and feedback from member surveys.",
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      link: "/admin/survey-data",
      label: "View Survey Data"
    },
    {
      title: "Announcements",
      description: "Create and manage important updates for the choir community.",
      icon: <BellRing className="h-6 w-6 text-primary" />,
      link: "/admin/announcements",
      label: "Manage Announcements"
    }
  ];

  return (
    <div className="space-y-10 py-8 md:py-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold font-lora tracking-tight">
          Admin Command Center
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome back, Daniele. Here you can oversee all aspects of the Resonance community.
        </p>
      </header>

      <AdminDashboardOverview />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminTools.map((tool, i) => (
          <Card key={i} className={cn(
            "shadow-lg rounded-2xl border-none bg-card hover:shadow-xl transition-all duration-300 group",
            tool.highlight && "ring-2 ring-primary ring-offset-4"
          )}>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <CardTitle className="text-xl font-bold font-lora">{tool.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-bold" variant={tool.highlight ? "default" : "secondary"}>
                <Link to={tool.link}>{tool.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminZone;