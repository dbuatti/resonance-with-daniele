"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Music, Mic2, Users, Camera, Link as LinkIcon, FileText, User as UserIcon, Settings, ClipboardList } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
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
}

interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
  humanitix_link?: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
}

const WelcomeHub: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [isSurveyCompleted, setIsSurveyCompleted] = useState(false);

  useEffect(() => {
    const fetchProfileAndSurvey = async () => {
      if (user) {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url, how_heard, motivation, attended_session, singing_experience, session_frequency, preferred_time, music_genres, choir_goals, inclusivity_importance, suggestions")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
          console.error("Error fetching profile for WelcomeHub:", error);
        } else if (data) {
          setProfile(data);
          // Check if key survey fields are filled to determine completion
          const completed = data.how_heard !== null ||
                            (data.motivation !== null && data.motivation.length > 0) ||
                            data.attended_session !== null ||
                            data.singing_experience !== null ||
                            data.session_frequency !== null ||
                            data.preferred_time !== null ||
                            (data.music_genres !== null && data.music_genres.length > 0) ||
                            data.choir_goals !== null ||
                            data.inclusivity_importance !== null ||
                            data.suggestions !== null;
          setIsSurveyCompleted(completed);
        } else {
          setIsSurveyCompleted(false); // No profile data means survey is not completed
        }
        setLoadingProfile(false);
      } else {
        setProfile(null);
        setLoadingProfile(false);
        setIsSurveyCompleted(false);
      }
    };

    const fetchUpcomingEvent = async () => {
      setLoadingEvent(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", format(new Date(), "yyyy-MM-dd")) // Only future events
        .order("date", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Error fetching upcoming event:", error);
      } else if (data && data.length > 0) {
        setUpcomingEvent(data[0]);
      }
      setLoadingEvent(false);
    };

    const fetchRecentResources = async () => {
      setLoadingResources(true);
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, url")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching recent resources:", error);
      } else {
        setRecentResources(data || []);
      }
      setLoadingResources(false);
    };

    if (!loadingUserSession) {
      fetchProfileAndSurvey();
      fetchUpcomingEvent();
      fetchRecentResources();
    }
  }, [user, loadingUserSession]);

  if (loadingUserSession || loadingProfile || loadingEvent || loadingResources) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in-up">
        <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="text-center">
            <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-6" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card className="shadow-md border border-border p-4 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
              <Card className="shadow-md border border-border p-4 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
            </div>
            <Skeleton className="h-10 w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "there";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in-up">
      <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="text-center">
          <img
            src="/images/daniele-buatti-headshot.jpeg"
            alt="Daniele Buatti"
            className="w-32 h-32 rounded-full object-cover shadow-md mx-auto mb-6"
          />
          <CardTitle className="text-4xl md:text-5xl font-extrabold text-center text-primary mb-4 font-lora">
            Welcome, {firstName} to the Resonance with Daniele Hub!
          </CardTitle>
          <p className="text-center text-xl md:text-2xl font-semibold text-foreground mb-6 font-lora">
            🎶 Sing. Connect. Shine. 🎶
          </p>
        </CardHeader>
        <CardContent className="text-lg text-muted-foreground space-y-6">
          <p>
            Welcome! I’m Daniele Buatti, and I’m thrilled to share this space with you. I’ve been working in musical theatre, vocal coaching, and music direction for years, and I believe in the transformative power of singing — not just as performance, but as connection, expression, and joy.
          </p>
          <p>
            This hub is your go-to space for everything choir-related:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground text-xl font-lora">Rehearsals & Events</h3>
                <p className="text-base">See the calendar, RSVP, and get updates in real time.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Music className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground text-xl font-lora">Songs & Resources</h3>
                <p className="text-base">Access sheet music, audio tracks, and video tutorials to guide your practice.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mic2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground text-xl font-lora">Vocal Exercises & Warm-Ups</h3>
                <p className="text-base">Explore exercises to strengthen, release, and resonate your voice.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground text-xl font-lora">Community & Connection</h3>
                <p className="text-base">Chat, share, and celebrate with fellow singers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground text-xl font-lora">Performance Highlights & Media</h3>
                <p className="text-base">Relive moments from past concerts or see what’s coming next.</p>
              </div>
            </div>
          </div>

          <p className="mt-6">
            No matter your experience — whether you’ve sung in choirs before or simply love singing in the shower — this is your safe, welcoming, and fun space to grow your voice and connect with others. I celebrate all voices and all identities, and everyone is invited to shine their unique light here.
          </p>

          {!isSurveyCompleted && (
            <Card className="bg-accent/10 border-accent text-accent-foreground p-6 shadow-md rounded-xl mt-8 animate-fade-in-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
                <CardTitle className="text-xl font-lora flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-accent" /> Complete Your Survey!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <p className="text-base">
                  Help me tailor the choir experience to your needs and preferences by filling out a quick market research survey. It only takes a few minutes!
                </p>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full" asChild>
                  <Link to="/profile">
                    <Settings className="mr-2 h-4 w-4" /> Go to Profile & Survey
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Upcoming Event Card */}
            <Card className="shadow-md border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-lora flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" /> Next Event
                </CardTitle>
                <CardDescription>Your next opportunity to sing!</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvent ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{upcomingEvent.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(upcomingEvent.date), "PPP")}
                      {upcomingEvent.location && ` at ${upcomingEvent.location}`}
                    </p>
                    {upcomingEvent.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{upcomingEvent.description}</p>
                    )}
                    <Button size="sm" className="w-full mt-2" asChild>
                      <Link to={upcomingEvent.humanitix_link || "/events"}>
                        {upcomingEvent.humanitix_link ? "View Details" : "View All Events"}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No upcoming events.</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link to="/events">View all events</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Resources Card */}
            <Card className="shadow-md border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-lora flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Recent Resources
                </CardTitle>
                <CardDescription>Fresh materials to help you practice.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentResources.length > 0 ? (
                  <ul className="space-y-3">
                    {recentResources.map((resource) => (
                      <li key={resource.id} className="flex items-start gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            {resource.title}
                          </a>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <Link to="/resources">View all resources</Link>
                    </Button>
                  </ul>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No recent resources.</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link to="/resources">View all resources</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/profile">
                <Settings className="mr-2 h-5 w-5" /> Manage My Profile
              </Link>
            </Button>
          </div>

          <p className="text-center">
            💡 Learn more about me and my work:{" "}
            <Button variant="link" className="p-0 h-auto text-primary hover:underline" asChild>
              <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">
                DanieleBuatti.com
              </a>
            </Button>
          </p>
          <p className="text-right font-semibold text-foreground text-xl mt-8 font-lora">
            — Daniele
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeHub;