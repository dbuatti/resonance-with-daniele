"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
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

// Define the Profile interface (can be imported if available globally)
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
}

interface SurveyMetricsCardProps {
  profiles: Profile[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

const SurveyMetricsCard: React.FC<SurveyMetricsCardProps> = ({ profiles }) => {
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
    p.suggestions
  );
  const totalResponses = profilesWithResponses.length;
  const surveyCompletionRate = totalProfiles > 0 ? ((totalResponses / totalProfiles) * 100).toFixed(1) : "0.0";

  if (totalResponses === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
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

  // Helper to aggregate data for charts
  const aggregateData = (field: keyof Profile, isMultiSelect: boolean = false) => {
    const counts: { [key: string]: number } = {};
    profilesWithResponses.forEach(profile => { // Use profilesWithResponses for aggregation
      if (isMultiSelect && Array.isArray(profile[field])) {
        (profile[field] as string[]).forEach(item => {
          counts[item] = (counts[item] || 0) + 1;
        });
      } else if (profile[field] !== null && profile[field] !== undefined) { // Check for null/undefined
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

  const howHeardData = aggregateData("how_heard");
  const motivationData = aggregateData("motivation", true);
  const attendedSessionData = aggregateData("attended_session");
  const singingExperienceData = aggregateData("singing_experience");
  const sessionFrequencyData = aggregateData("session_frequency");
  const preferredTimeData = aggregateData("preferred_time");
  const musicGenresData = aggregateData("music_genres", true);
  const inclusivityImportanceData = aggregateData("inclusivity_importance");

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

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-lora">Survey Metrics & Insights</CardTitle>
        <CardDescription className="text-muted-foreground">
          Overview of member survey responses ({totalResponses} out of {totalProfiles} members have responded).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Overall Engagement</CardTitle>
            <CardContent className="p-0 space-y-2 text-muted-foreground">
              <div>Total Members: <Badge variant="secondary">{totalProfiles}</Badge></div>
              <div>Members with Responses: <Badge variant="secondary">{totalResponses}</Badge></div>
              <div>Survey Completion Rate: <Badge variant="secondary">{surveyCompletionRate}%</Badge></div>
              <div>Avg. Motivations Selected: <Badge variant="secondary">{averageMotivationSelections}</Badge></div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">How Heard About Us</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={howHeardData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Motivation for Joining</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={motivationData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Attended Session?</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendedSessionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {attendedSessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Singing Experience Level</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={singingExperienceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Preferred Session Frequency</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionFrequencyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Preferred Session Time</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={preferredTimeData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[4]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Music Genres Enjoyed</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={musicGenresData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[5]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <CardTitle className="text-xl font-lora mb-4">Inclusivity Importance</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={inclusivityImportanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Bar dataKey="value" fill={COLORS[6]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
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