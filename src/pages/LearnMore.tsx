"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Mic, Users, Heart, CalendarDays } from "lucide-react";

const LearnMore: React.FC = () => {
  return (
    <div className="space-y-12 py-8 md:py-12 px-4"> {/* Added px-4 for consistent padding */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold font-lora text-foreground">
          🎶 Learn More About Resonance with Daniele
        </h1>
        <p className="text-lg md::text-xl max-w-3xl mx-auto text-muted-foreground">
          Welcome! Resonance with Daniele is a community choir that’s all about joy, connection, and the magic of voices joining together. You don’t need to read music or have choir experience — if you love singing (even just in the shower or car), you’ll fit right in.
        </p>
        <p className="text-lg md::text-xl max-w-3xl mx-auto text-muted-foreground">
          I created this space so people could gather, feel safe to sing freely, and experience the uplifting energy of creating music with community.
        </p>
        <img
          src="/images/daniele-buatti-headshot.jpeg"
          alt="Daniele Buatti"
          className="w-48 h-48 rounded-full object-cover shadow-lg mx-auto mt-8"
        />
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-lora text-foreground">
          What Happens at a Choir Session?
        </h2>
        <p className="text-lg text-center max-w-2xl mx-auto text-muted-foreground mb-8">
          Here’s a little snapshot of what you can expect:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 text-center shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Warm Welcome</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We gather, settle in, and connect in a friendly atmosphere.
            </CardContent>
          </Card>
          <Card className="p-6 text-center shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Mic className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Gentle Warm-ups</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Fun, playful exercises to get everyone comfortable and ready to sing.
            </CardContent>
          </Card>
          <Card className="p-6 text-center shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Learn the Song</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              I’ll guide the group step by step, so no one’s left behind.
            </CardContent>
          </Card>
          <Card className="p-6 text-center shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Sing in Harmony</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              That special moment when voices blend as one, creating beautiful music.
            </CardContent>
          </Card>
        </div>
        <p className="text-center text-muted-foreground mt-6">
          Optional: Sometimes we grab a coffee, a drink, or just have a laugh together afterwards.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-lora text-foreground">
          Why Join?
        </h2>
        <p className="text-lg text-center max-w-2xl mx-auto text-muted-foreground mb-8">
          People come to choir for all sorts of reasons — maybe one of these resonates with you:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Relieve Stress</CardTitle>
            <CardDescription className="text-muted-foreground">
              Recharge after a long week through the therapeutic power of singing.
            </CardDescription>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Meet New Friends</CardTitle>
            <CardDescription className="text-muted-foreground">
              Feel part of a welcoming community and connect with like-minded people.
            </CardDescription>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Improve Your Voice</CardTitle>
            <CardDescription className="text-muted-foreground">
              Grow your vocal skills in a supportive, pressure-free environment.
            </CardDescription>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl border-l-4 border-primary">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Joy of Harmony</CardTitle>
            <CardDescription className="text-muted-foreground">
              Experience the thrill of singing in harmony, even if you're a beginner.
            </CardDescription>
          </Card>
        </div>
        <p className="text-lg text-center max-w-3xl mx-auto text-primary font-semibold mt-8">
          And most importantly: everyone is welcome. Resonance is LGBTQIA+ inclusive, beginner-friendly, and open to all voices.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-lora text-foreground">
          FAQs
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="p-6 shadow-lg rounded-xl">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Do I need to be a “good singer”?</CardTitle>
            <CardContent className="p-0 text-muted-foreground">
              Not at all. If you can sing along to the radio, you’ll be just fine! My focus is on joy and connection, not perfection.
            </CardContent>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl">
            <CardTitle className="text-xl font-semibold font-lora mb-2">What's the commitment?</CardTitle>
            <CardContent className="p-0 text-muted-foreground">
              My choir runs once a month and is designed for flexibility. You can drop in for sessions that fit your schedule, with no long-term commitment required. Come when you can!
            </CardContent>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl">
            <CardTitle className="text-xl font-semibold font-lora mb-2">Will there be performances?</CardTitle>
            <CardContent className="p-0 text-muted-foreground">
              Sometimes, yes — but joining performances is always optional. The main goal is to enjoy the process of singing together.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center space-y-6 bg-primary text-primary-foreground py-16 rounded-xl shadow-lg">
        <h2 className="text-3xl md:text-4xl font-bold font-lora">
          Ready to Give It a Try?
        </h2>
        <p className="text-lg md:text-xl max-w-2xl mx-auto">
          If this sounds like your kind of vibe, we’d love to have you join us.
        </p>
        <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
          <Link to="/events">
            <CalendarDays className="mr-2 h-5 w-5" /> See Upcoming Choir Dates
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default LearnMore;