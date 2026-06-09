"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AiMarketingToolsCard from "@/components/admin/AiMarketingToolsCard";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import {
  Users, BarChart3, TrendingUp, Lightbulb, Rocket, ShieldCheck,
  ArrowRight, MessageSquareQuote, BookOpen, Music, Megaphone,
  BellRing, Calendar, Mail, Search, Sparkles, LayoutDashboard,
  MessageSquare, LineChart, Send
} from "lucide-react";

interface AdminTool {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
  badge?: string;
  label?: string;
  highlight?: boolean;
  category: string;
}

const AdminZone: React.FC = () => {
  const { user, profile } = useSession();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const adminTools: AdminTool[] = [
    {
      title: "Global Broadcast",
      description: "Get a deduplicated BCC list of all members, interest leads, and ticket buyers.",
      icon: <Send className="h-6 w-6 text-primary" />,
      onClick: () => setIsEmailModalOpen(true),
      highlight: true,
      badge: "Broadcast",
      category: "Communications"
    },
    {
      title: "Announcements",
      description: "Create and manage updates that appear on member dashboards.",
      icon: <BellRing className="h-6 w-6 text-primary" />,
      link: "/admin/announcements",
      label: "Manage Updates",
      category: "Communications"
    },
    {
      title: "Feedback Analysis",
      description: "Review post-session feedback. See what people loved and what needs refining.",
      icon: <MessageSquareQuote className="h-6 w-6 text-primary" />,
      link: "/admin/feedback",
      label: "Analyze Feedback",
      category: "Communications"
    },
    {
      title: "Repertoire Studio",
      description: "Brainstorm songs, save research links, and access your custom Repertoire AI.",
      icon: <Music className="h-6 w-6 text-primary" />,
      link: "/admin/repertoire",
      badge: "Creative",
      category: "Content"
    },
    {
      title: "Session Hub Guide",
      description: "Learn how to link resources to events and manage lesson notes.",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      link: "/admin/session-hub-guide",
      label: "Read Guide",
      category: "Content"
    },
    {
      title: "Survey Insights",
      description: "Analyze aggregated feedback and understand community preferences.",
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      link: "/admin/survey-data",
      label: "View Insights",
      category: "Content"
    },
    {
      title: "Growth Strategy",
      description: "High-impact missions to scale Resonance. Track your 1-year vision.",
      icon: <Rocket className="h-6 w-6 text-primary" />,
      link: "/admin/growth",
      badge: "Priority",
      category: "Growth"
    },
    {
      title: "Marketing & Finance",
      description: "Track ticket sales, log expenses, and manage flash sale promotions.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      link: "/admin/marketing",
      label: "View Dashboard",
      category: "Growth"
    },
    {
      title: "Event Command",
      description: "Outreach trackers, AI prompt generators, and real-time execution.",
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      link: "/admin/marketing-plan",
      label: "Open Command Center",
      category: "Growth"
    },
    {
      title: "Member Directory",
      description: "View profiles, update roles, and sync data with Kit.com.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "/admin/members",
      label: "Manage Members",
      category: "Management"
    },
    {
      title: "June Rehearsal Poll",
      description: "Track availability for the June show and copy the broadcast email.",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      link: "/admin/june-poll",
      badge: "Active Poll",
      category: "Management"
    }
  ];

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return adminTools;
    const q = searchQuery.toLowerCase();
    return adminTools.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, AdminTool[]> = {};
    filteredTools.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTools]);

  const categoryOrder = ["Communications", "Content", "Growth", "Management"];

  return (
    <AdminPageLayout
      title="Command Center"
      description={`Welcome back${profile?.first_name ? `, ${profile.first_name}` : ''}. Oversee your community and track your growth.`}
      badge="Administrator Access"
    >
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">Live Overview</h2>
        </div>
        <AdminDashboardOverview />
      </section>

      <div className="relative w-full max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl font-bold shadow-sm border-primary/10 focus-visible:ring-primary"
        />
      </div>

      {categoryOrder.map(category => {
        const tools = groupedTools[category];
        if (!tools?.length) return null;
        return (
          <section key={category} className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">{category}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {tools.map((tool, i) => (
                <div
                  key={`${category}-${i}`}
                  className={cn(
                    "relative flex flex-col p-10 rounded-[2.5rem] border-2 transition-all duration-500 group",
                    tool.highlight
                      ? "bg-primary/5 border-primary/20 shadow-2xl"
                      : "bg-card border-primary/5 hover:border-primary/20 hover:shadow-2xl"
                  )}
                >
                  {tool.badge && (
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
                  {tool.onClick ? (
                    <Button
                      onClick={tool.onClick}
                      size="lg"
                      className="mt-auto w-full h-14 font-black rounded-xl shadow-lg"
                      variant={tool.highlight ? "default" : "secondary"}
                    >
                      {tool.label || "Open Tool"} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="mt-auto w-full h-14 font-black rounded-xl shadow-lg" variant={tool.highlight ? "default" : "secondary"}>
                      <Link to={tool.link || "#"}>
                        {tool.label || "Open Tool"} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
              {category === "Growth" && <AiMarketingToolsCard />}
            </div>
          </section>
        );
      })}

      {filteredTools.length === 0 && (
        <div className="py-20 text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
          <p className="text-xl font-bold text-muted-foreground font-lora">No tools match "{searchQuery}"</p>
        </div>
      )}

      <EmailMembersModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      <footer className="text-center pt-16 border-t border-border/50 pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          Resonance Admin System v2.0
        </p>
      </footer>
    </AdminPageLayout>
  );
};

export default AdminZone;
