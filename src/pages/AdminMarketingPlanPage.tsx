"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Instagram, 
  Mail, 
  Music, 
  Target, 
  Copy, 
  Clock,
  TrendingUp,
  Camera,
  Video,
  Users,
  Mic2,
  Leaf
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarketingChecklist from "@/components/admin/MarketingChecklist";

const AdminMarketingPlanPage: React.FC = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  const authenticCaption = `We're back this Saturday. 10am, Armadale Baptist Church.

Two songs that couldn't be more different — and somehow belong together.

Being Alive. The one that demands everything from you.
Sleep. The one that asks you to let go.

If you've been meaning to come, this is the one. Use SING20 for 20% off until Friday.

Link in bio. Come sing with us. 🌿`;

  const authenticEmail = `Subject: Let's sing "Being Alive" this Saturday! 🎶

Hi there,

It’s been a little while since our last pop-up choir, and I’d love to see the November crew back in the circle this Saturday, March 14 (10am–1pm) at Armadale Baptist Church.

We’re diving into two extraordinary pieces: the powerhouse energy of Sondheim’s "Being Alive" and the breathtaking stillness of Eric Whitacre’s "Sleep."

I’m opening up a 20% discount for my past singers to help get the room full of familiar voices.

Use code SING20 at checkout.
(Valid until Friday 1:00 PM)

Grab your spot here: https://events.humanitix.com/resonance-melbourne-march-2026

I'd love to see you there.

— Daniele`;

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">March 14 Strategy: Authentic Invitation</Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-lora">The "Personal Connection" Plan</h1>
            <p className="text-lg text-muted-foreground">Focus: Inviting people into a meaningful experience, not selling a product.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Clock className="h-4 w-4" /> 72 Hours Remaining
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Strategy & Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. The Philosophy */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-primary text-primary-foreground border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" /> The Emotional Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-bold text-xl">"Power vs. Peace"</p>
                  <p className="text-sm opacity-80">Contrast the screaming aliveness of Sondheim against the total surrender of Whitacre. Sell the meaning, not the ticket.</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary text-secondary-foreground border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-primary" /> The Invitation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-bold text-xl">Personal & Direct</p>
                  <p className="text-sm opacity-80">Reach out to the "November crew" and specific individuals who need this room right now.</p>
                </CardContent>
              </Card>
            </section>

            {/* 2. Content Templates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <Mic2 className="h-6 w-6 text-primary" /> Your Actual Voice
              </h2>
              
              <Card className="border-none shadow-lg bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram Caption (Minimalist)
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(authenticCaption, "Instagram Caption")}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground bg-background p-4 rounded-lg border italic">
                    {authenticCaption}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email to Past Attendees
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(authenticEmail, "Email Template")}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground bg-background p-4 rounded-lg border italic">
                    {authenticEmail}
                  </pre>
                </CardContent>
              </Card>
            </section>

            {/* 3. The "Why" Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" /> The "Why" Behind the Songs
              </h2>
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share something true about why you chose these songs *right now*.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-background rounded-xl border border-primary/10 italic text-sm">
                      "Being Alive isn't just a Sondheim song — it's a North Star in musical form. It's about the demand to feel something real. Sleep is the opposite — it's about the peace of finally letting go. We need both."
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tip: Record a 30-second video or voice note saying this. It's worth more than any polished graphic.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column: Interactive Checklist */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-8">
              <MarketingChecklist />
              
              <Card className="border-none shadow-lg bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Relational Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-bold">The "10 People" Rule:</p>
                    <p className="text-muted-foreground">
                      Instead of broad ads, message 10 specific people who you know would benefit from being in the room. No template — just a personal "I think you should come."
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-bold">Community Outreach:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Personal note to the November crew</li>
                      <li>Message to your Sangha</li>
                      <li>Direct outreach to Neha/Brad</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMarketingPlanPage;