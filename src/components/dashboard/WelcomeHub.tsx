"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Music, Mic2, Users, Camera } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const WelcomeHub: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
          console.error("Error fetching profile for WelcomeHub:", error);
        } else if (data) {
          setProfile(data);
        }
        setLoadingProfile(false);
      } else {
        setProfile(null);
        setLoadingProfile(false);
      }
    };

    if (!loadingUserSession) {
      fetchProfile();
    }
  }, [user, loadingUserSession]);

  if (loadingUserSession || loadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
        <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 animate-fade-in-up">
          <CardHeader>
            <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-6" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "there";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 animate-fade-in-up">
        <CardHeader>
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
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <CalendarDays className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <span><span className="font-semibold text-foreground">Rehearsals & Events:</span> See the calendar, RSVP, and get updates in real time.</span>
            </li>
            <li className="flex items-start gap-2">
              <Music className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <span><span className="font-semibold text-foreground">Songs & Resources:</span> Access sheet music, audio tracks, and video tutorials to guide your practice.</span>
            </li>
            <li className="flex items-start gap-2">
              <Mic2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <span><span className="font-semibold text-foreground">Vocal Exercises & Warm-Ups:</span> Explore exercises to strengthen, release, and resonate your voice.</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <span><span className="font-semibold text-foreground">Community & Connection:</span> Chat, share, and celebrate with fellow singers.</span>
            </li>
            <li className="flex items-start gap-2">
              <Camera className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <span><span className="font-semibold text-foreground">Performance Highlights & Media:</span> Relive moments from past concerts or see what’s coming next.</span>
            </li>
          </ul>
          <p>
            No matter your experience — whether you’ve sung in choirs before or simply love singing in the shower — this is your safe, welcoming, and fun space to grow your voice and connect with others. I celebrate all voices and all identities, and everyone is invited to shine their unique light here.
          </p>
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