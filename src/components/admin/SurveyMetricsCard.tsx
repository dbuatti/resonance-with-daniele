"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  how_heard: string | null;
  motivation: string[] | null;
  attended_session: boolean | null;
  singing_experience: string | null;
  session_frequency: string | null;
  preferred_time: string | null;
  music_genres: string[] | null;
  choir_goals: string | null;
  inclusivity_importance: string | null;
  suggestions: string | null;
  updated_at: string;
  voice_type: string[] | null;
}

interface SurveyMetricsCardProps {
  profiles: Profile[];
  loading: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c", "#d3a4de"];

const SurveyMetricsCard: React.FC<SurveyMetricsCardProps> = ({ profiles, loading }) => {
  const totalProfiles = profiles.length;
  const profilesWithResponses = profiles.filter(p => 
    p.how_heard || 
    (p.motivation && p.motivation.length > 0) ||
    p.attended_session !== null ||
    p.singing_experience ||
    p.session_frequency ||
    p.preferred_time ||
    (p.music_genres && p.music_genres.length > 0) ||
    p.choir_goals ||
    p.inclusivity_importance ||
    p.suggestions ||
    (p.voice_type && p.voice_type.length > 0)
  );
  const totalResponses = profilesWithResponses.length;
  const surveyCompletionRate = totalProfiles > 0 ? ((totalResponses / totalProfiles) * 100).toFixed(1) : "0.0";

  const latestUpdate = profilesWithResponses.reduce((latest: Date | null, profile) => {
    if (profile.updated_at) {
      const profileDate = new Date(profile.updated_at);
      if (!latest || profileDate > latest) {
        return profileDate;
      }
    }
    return latest;
  }, null);

  const formattedLatestUpdate = latestUpdate ? latestUpdate.toLocaleString() : "N/A";

  const aggregateData = (field: keyof Profile, isMultiSelect: boolean = false) => {
    const counts: { [key: string]: number } = {};
    profilesWithResponses.forEach(profile => {
      if (isMultiSelect && Array.isArray(profile[field])) {
        (profile[field] as string[]).forEach(item => {
          counts[item] = (counts[item] || 0) + 1;
        });
      } else if (profile[field] !== null && profile[field] !== undefined) {
        const value = String(profile[field]);
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return Object.keys(counts).map(name => ({
      name,
      value: counts[name],
      percentage: ((counts[name] / totalResponses) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);
  };

  const handleCopySummary = () => {
    const sections = [
      `RESONANCE WITH DANIELE - SURVEY SUMMARY`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Total Members: ${totalProfiles}`,
      `Total Responses: ${totalResponses} (${surveyCompletionRate}%)`,
      `Last Response: ${formattedLatestUpdate}`,
      `\n--- AGGREGATED DATA ---`
    ];

    const fields: { label: string, key: keyof Profile, multi?: boolean }[] = [
      { label: "How Heard", key: "how_heard" },
      { label: "Motivation", key: "motivation", multi: true },
      { label: "Attended Session", key: "attended_session" },
      { label: "Singing Experience", key: "singing_experience" },
      { label: "Preferred Frequency", key: "session_frequency" },
      { label: "Preferred Time", key: "preferred_time" },
      { label: "Music Genres", key: "music_genres", multi: true },
      { label: "Inclusivity Importance", key: "inclusivity_importance" },
      { label: "Voice Types", key: "voice_type", multi: true }
    ];

    fields.forEach(field => {
      const data = aggregateData(field.key, field.multi);
      if (data.length > 0) {
        sections.push(`\n[${field.label}]`);
        data.forEach(item => {
          sections.push(`- ${item.name}: ${item.value} (${item.percentage}%)`);
        });
      }
    });

    const choirGoals = profilesWithResponses.filter(p => p.choir_goals).map(p => `- ${p.first_name || "Anonymous"}: ${p.choir_goals}`);
    if (choirGoals.length > 0) {
      sections.push(`\n--- CHOIR GOALS ---`);
      sections.push(...choirGoals);
    }

    const suggestions = profilesWithResponses.filter(p => p.suggestions).map(p => `- ${p.first_name || "Anonymous"}: ${p.suggestions}`);
    if (suggestions.length > 0) {
      sections.push(`\n--- SUGGESTIONS ---`);
      sections.push(...suggestions);
    }

    navigator.clipboard.writeText(sections.join('\n'));
    showSuccess("Survey summary copied to clipboard!");
  };

  if (loading) {
    return (
      <Card className="w-full p-6 shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (totalResponses === 0) {
    return (
      <Card className="w-full p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">Survey Metrics</CardTitle>
          <CardDescription>No survey responses available yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Once members start filling out the survey, their responses will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  const howHeardData = aggregateData("how_heard");
  const motivationData = aggregateData("motivation", true);
  const attendedSessionData = aggregateData("attended_session");
  const singingExperienceData = aggregateData("singing_experience");
  const sessionFrequencyData = aggregateData("session_frequency");
  const preferredTimeData = aggregateData("preferred_time");
  const musicGenresData = aggregateData("music_genres", true);
  const inclusivityImportanceData = aggregateData("inclusivity_importance");
  const voiceTypeData = aggregateData("voice_type", true);

  const totalMotivationSelections = profilesWithResponses.reduce((sum, p) => sum + (p.motivation?.length || 0), 0);
  const averageMotivationSelections = totalResponses > 0 ? (totalMotivationSelections / totalResponses).toFixed(1) : "0.0";

  const choirGoalsResponses = profilesWithResponses.filter(p => p.choir_goals).map(p => ({
    name: p.first_name || p.email?.split('@')[0] || "Anonymous",
    response: p.choir_goals,
  }));
  const suggestionsResponses = profilesWithResponses.filter(p => p.suggestions).map(p => ({
    name: p.first_name || p.email?.split('@')[0] || "Anonymous",
    response: p.suggestions,
  }));

  const renderChart = (data: any[], title: string, fill: string, type: 'bar' | 'pie' = 'bar') => {
    const chartMargin = { top: 5, right: 5, left: 5, bottom: 5 };

    if (data.length === 0) {
      return (
        <Card className="p-4 flex flex-col items-center justify-center h-[250px]">
          <CardTitle className="text-xl font-lora mb-4">{title}</CardTitle>
          <p className="text-muted-foreground text-center">No data available for this question yet.</p>
        </Card>
      );
    }

    return (
      <Card className="p-4">
        <CardTitle className="text-xl font-lora mb-4">{title}</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          {type === 'bar' ? (
            <BarChart data={data} margin={chartMargin}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
              <YAxis />
              <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
              <Bar dataKey="value" fill={fill} />
            </BarChart>
          ) : (
            <PieChart margin={chartMargin}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </Card>
    );
  };

  return (
    <Card className="w-full p-6 shadow-lg rounded-xl">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-3xl font-bold font-lora">Survey Metrics & Insights</CardTitle>
          <CardDescription className="text-muted-foreground">
            Overview of member survey responses ({totalResponses} out of {totalProfiles} members have responded). Last updated: {formattedLatestUpdate}
          </CardDescription>
        </div>
        <Button onClick={handleCopySummary} variant="outline" className="flex items-center gap-2 font-bold">
          <Copy className="h-4 w-4" /> Copy Text Summary
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <Card className="p-4 border-l-4 border-primary">
          <CardTitle className="text-xl font-lora mb-4">Overall Engagement</CardTitle>
          <CardContent className="p-0 space-y-2 text-muted-foreground">
            <div>Total Members: <Badge variant="secondary">{totalProfiles}</Badge></div>
            <div>Members with Responses: <Badge variant="secondary">{totalResponses}</Badge></div>
            <div>Survey Completion Rate: <Badge variant="secondary">{surveyCompletionRate}%</Badge></div>
            <div>Avg. Motivations Selected: <Badge variant="secondary">{averageMotivationSelections}</Badge></div>
          </CardContent>
        </Card>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderChart(howHeardData, "How Heard About Us", COLORS[0])}
          {renderChart(motivationData, "Motivation for Joining", COLORS[1])}
          {renderChart(attendedSessionData, "Attended Session?", COLORS[2], 'pie')}
          {renderChart(singingExperienceData, "Singing Experience Level", COLORS[3])}
          {renderChart(sessionFrequencyData, "Preferred Session Frequency", COLORS[4])}
          {renderChart(preferredTimeData, "Preferred Session Time", COLORS[5])}
          {renderChart(musicGenresData, "Music Genres Enjoyed", COLORS[6])}
          {renderChart(inclusivityImportanceData, "Inclusivity Importance", COLORS[7])}
          {renderChart(voiceTypeData, "Voice Type Distribution", COLORS[8])}
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Choir Goals</CardTitle>
            <CardDescription className="mb-2">Individual responses from members:</CardDescription>
            {choirGoalsResponses.length > 0 ? (
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {choirGoalsResponses.map((item, index) => (
                    <li key={index}>
                      <span className="font-semibold text-foreground">{item.name}:</span> {item.response}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No choir goals submitted yet.</p>
            )}
          </Card>
          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Suggestions</CardTitle>
            <CardDescription className="mb-2">Individual suggestions from members:</CardDescription>
            {suggestionsResponses.length > 0 ? (
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {suggestionsResponses.map((item, index) => (
                    <li key={index}>
                      <span className="font-semibold text-foreground">{item.name}:</span> {item.response}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No suggestions submitted yet.</p>
            )}
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyMetricsCard;