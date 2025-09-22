"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Users, Heart, Mic, CalendarDays } from "lucide-react";

const LearnMore: React.FC = () => {
  return (
    <div className="py-8 md:py-12 space-y-12">
      <Card className="max-w-4xl mx-auto p-6 md:p-10 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-bold font-lora mb-4">
            Learn More About Resonance with Daniele
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the joy of singing in a welcoming, flexible community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-10">
            {/* 1. What Is Resonance with Daniele? */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold font-lora text-foreground">What Is Resonance with Daniele?</h2>
              <img
                src="/images/daniele-buatti-headshot.jpeg"
                alt="Daniele Buatti"
                className="w-48 h-48 rounded-full object-cover shadow-md mx-auto mb-6"
              />
              <div className="max-w-2xl mx-auto text-lg text-muted-foreground space-y-4">
                <p>
                  Welcome! Resonance with Daniele is a community choir that's all about joy, connection, and the magic of voices joining together. You don't need to read music or have choir experience — if you love singing (even just in the shower or car), you'll fit right in.
                </p>
                <p>
                  I created this space so people could gather, feel safe to sing freely, and experience the uplifting energy of community music-making.
                </p>
              </div>
            </div>

            <Separator />

            {/* 2. What Happens at a Choir Session? */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">What Happens at a Choir Session?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Users className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Arrival & Welcome</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    We gather, settle in, and connect with fellow singers.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Mic className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Gentle Warm-ups</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    Fun, playful exercises to get everyone comfortable and ready to sing.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <CheckCircle className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Learning the Song</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    I'll guide the group step by step, breaking down harmonies so everyone can join in.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardHeader className="flex flex-row items-center space-x-4 p-0 mb-4">
                    <Heart className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold font-lora">Singing Together</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    That special moment when voices blend as one, creating beautiful harmony.
                  </CardContent>
                </Card>
              </div>
              <p className="text-center text-md text-muted-foreground mt-6">
                Optional: Sometimes we grab a coffee, a drink, or just have a laugh together afterwards!
              </p>
            </div>

            <Separator />

            {/* 3. Why Join? (Benefits) */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">Why Join?</h2>
              <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
                People come to choir for all sorts of reasons — maybe one of these resonates with you:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  "To relieve stress and recharge after a long week",
                  "To meet new friends & feel part of a community",
                  "To improve your voice in a supportive, pressure-free space",
                  "To enjoy the thrill of singing in harmony — even if you've never sung in a choir before",
                  "No auditions, no pressure – just pure singing joy",
                  "Everyone is welcome — LGBTQIA+ inclusive, beginner-friendly, open to all voices",
                ].map((benefit, index) => (
                  <Card key={index} className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
                    <CardContent className="p-0 text-lg text-muted-foreground">
                      {benefit}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* 4. FAQ Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-lora text-center text-foreground">FAQs</h2>
              <div className="max-w-2xl mx-auto space-y-4">
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Do I need to be a good singer?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Not at all. If you can sing in the shower, you'll fit right in!
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Do I have to commit every week?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Nope — come when you can. It's designed to be flexible.
                  </CardContent>
                </Card>
                <Card className="p-6 shadow-sm rounded-lg border">
                  <CardTitle className="text-xl font-semibold font-lora mb-2">Will there be performances?</CardTitle>
                  <CardContent className="p-0 text-muted-foreground">
                    Sometimes, yes — but joining performances is always optional.
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* 5. Upcoming Sessions / How to Join */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold font-lora text-foreground">Ready to Give It a Try?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                If this sounds like your kind of vibe, we'd love to have you join us.
              </p>
              <Button size="lg" asChild>
                <Link to="/events">
                  <CalendarDays className="mr-2 h-5 w-5" /> See Upcoming Choir Dates
                </Link>
              </Button>
              <p className="text-md text-muted-foreground mt-4">
                Come sing, connect, and shine with us ✨
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnMore;