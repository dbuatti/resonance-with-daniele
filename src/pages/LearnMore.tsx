"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Mic, Users, Heart, CalendarDays } from "lucide-react";
import VoicePhilosophy from "@/components/landing/VoicePhilosophy";
import BackButton from "@/components/ui/BackButton";

const LearnMore: React.FC = () => {
  return (
    <div className="space-y-16 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" />
        
        <section className="text-center space-y-6 mb-20">
          <h1 className="text-4xl md:text-6xl font-bold font-lora text-foreground tracking-tight">
            🎶 Find Your Resonance
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            Resonance with Daniele is a community choir that’s all about joy, connection, and the magic of voices joining together. 
          </p>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            I created this space so people could gather, feel safe to sing freely, and experience the uplifting energy of creating music with community.
          </p>
          <img
            src="/images/daniele-buatti-headshot.jpeg"
            alt="Daniele Buatti"
            className="w-48 h-48 rounded-full object-cover shadow-2xl mx-auto mt-8 border-4 border-background"
          />
        </section>

        <VoicePhilosophy />

        <section className="space-y-12 mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center font-lora text-foreground">
            What Happens at a Choir Session?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center shadow-lg rounded-2xl border-none bg-muted/30">
              <CardHeader className="flex flex-col items-center">
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-semibold font-lora">Warm Welcome</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We gather, settle in, and connect in a friendly atmosphere.
              </CardContent>
            </Card>
            <Card className="p-6 text-center shadow-lg rounded-2xl border-none bg-muted/30">
              <CardHeader className="flex flex-col items-center">
                <Mic className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-semibold font-lora">Gentle Warm-ups</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Fun, playful exercises to get everyone comfortable and ready to sing.
              </CardContent>
            </Card>
            <Card className="p-6 text-center shadow-lg rounded-2xl border-none bg-muted/30">
              <CardHeader className="flex flex-col items-center">
                <Users className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-semibold font-lora">Learn the Song</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                I’ll guide the group step by step, so no one’s left behind.
              </CardContent>
            </Card>
            <Card className="p-6 text-center shadow-lg rounded-2xl border-none bg-muted/30">
              <CardHeader className="flex flex-col items-center">
                <Heart className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-semibold font-lora">Sing in Harmony</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                That special moment when voices blend as one, creating beautiful music.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="text-center space-y-8 bg-primary text-primary-foreground py-20 rounded-3xl shadow-2xl mt-24">
          <h2 className="text-3xl md:text-5xl font-bold font-lora">
            Ready to Give It a Try?
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            If this sounds like your kind of vibe, we’d love to have you join us.
          </p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-14 px-8 text-lg font-bold rounded-xl" asChild>
            <Link to="/events">
              <CalendarDays className="mr-2 h-5 w-5" /> See Upcoming Choir Dates
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
};

export default LearnMore;