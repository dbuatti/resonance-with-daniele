"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AdminWorkbenchShell from "@/components/admin/AdminWorkbenchShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Music, CalendarDays, Users, Inbox, Star, MessageSquareQuote,
  ArrowRight, Search, Heart, Frown, ExternalLink
} from "lucide-react";
import { parseISO } from "date-fns";

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

  const adminTools = useMemo<AdminTool[]>(() => [
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
      title: "Events",
      description: "Build, market, and review every session. Checklists, outreach, finance, and feedback in one place.",
      icon: <CalendarDays className="h-6 w-6 text-primary" />,
      link: "/admin/events",
      label: "Open Events Hub",
      category: "Hubs"
    },
    {
      title: "People",
      description: "Manage members, review survey insights, and convert interest leads.",
      icon: <Users className="h-6 w-6 text-primary" />,
      link: "/admin/people",
      label: "Open People Hub",
      category: "Hubs"
    },
    {
      title: "Inbox",
      description: "Publish announcements and triage issue reports from the community.",
      icon: <Inbox className="h-6 w-6 text-primary" />,
      link: "/admin/inbox",
      label: "Open Inbox",
      category: "Hubs"
    },
    {
      title: "Repertoire Studio",
      description: "Brainstorm songs, save research links, and track top community suggestions.",
      icon: <Music className="h-6 w-6 text-primary" />,
      link: "/admin/repertoire",
      badge: "Creative",
      category: "Hubs"
    }
  ], [setIsEmailModalOpen]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return adminTools;
    const q = searchQuery.toLowerCase();
    return adminTools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery, adminTools]);

  const { data: recentFeedback } = useQuery({
    queryKey: ["commandCenterRecentFeedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_feedback")
        .select(`*, events (title, date)`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin,
  });

  const feedbackStats = useMemo(() => {
    if (!recentFeedback || recentFeedback.length === 0) return null;
    const total = recentFeedback.length;
    const scored = recentFeedback.filter((f) => f.recommend_score);
    const avgScore = scored.length ? scored.reduce((acc, f) => acc + f.recommend_score, 0) / scored.length : 0;
    const feelings: Record<string, number> = {};
    recentFeedback.forEach((f) => {
      if (f.overall_feeling) feelings[f.overall_feeling] = (feelings[f.overall_feeling] || 0) + 1;
    });
    const topFeeling = Object.entries(feelings).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    return { total, avgScore, topFeeling };
  }, [recentFeedback]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, AdminTool[]> = {};
    filteredTools.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTools]);

  const categoryOrder = ["Hubs", "Communications"];

  return (
    <AdminWorkbenchShell
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

      {categoryOrder.map((category) => {
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

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Community Feedback</h2>
          </div>
          {feedbackStats && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-full font-black border-primary/20 bg-primary/5 text-primary px-3 py-1">
                <Star className="h-3 w-3 mr-1 fill-current" /> {feedbackStats.avgScore.toFixed(1)} avg NPS
              </Badge>
              <Badge variant="outline" className="rounded-full font-black border-primary/20 bg-primary/5 text-primary px-3 py-1">
                {feedbackStats.total} recent responses
              </Badge>
            </div>
          )}
        </div>
        {recentFeedback && recentFeedback.length > 0 ? (
          <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Event</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Feeling</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Score</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Loved</TableHead>
                      <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Improvements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFeedback.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-10 py-4">
                          {f.events ? (
                            <Link to={`/admin/events/${f.event_id}?tab=feedback`} className="flex flex-col gap-0.5 group">
                              <span className="font-black font-lora text-sm group-hover:text-primary transition-colors">{f.events.title}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{parseISO(f.events.date).toLocaleDateString()}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground font-medium text-sm">Unknown event</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest">{f.overall_feeling}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-black text-primary"><Star className="h-3 w-3 fill-current" /> {f.recommend_score ?? "—"}</div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[220px] truncate italic text-muted-foreground">{f.enjoyed_most}</TableCell>
                        <TableCell className="text-right pr-10 text-xs max-w-[220px] truncate italic text-destructive">{f.improvements || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-[2rem] bg-muted/10">
            <MessageSquareQuote className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-muted-foreground font-lora">No feedback collected yet.</p>
          </div>
        )}
      </section>

      <EmailMembersModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </AdminWorkbenchShell>
  );
};

export default AdminZone;