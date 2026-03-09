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
  Leaf,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Zap,
  UserPlus,
  MapPin
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { Progress } from "@/components/ui/progress";

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

  const communityGroupLocal = `Hi neighbors! 🌿

I’m Daniele, and I run a pop-up choir called Resonance right here in Armadale. 

We’re gathering this Saturday morning (10am) at the Armadale Baptist Church to sing two incredible songs: Sondheim’s "Being Alive" and Eric Whitacre’s "Sleep."

It’s not a traditional choir — there are no auditions and no ongoing commitment. It’s just a space for anyone who loves to sing to come together and create a really powerful sound for a few hours. Whether you haven't sung since primary school or you sing every day, you’re so welcome.

If you’re looking for a bit of connection and a joyful start to your weekend, I’d love to see you there.

Details and tickets here: https://events.humanitix.com/resonance-melbourne-march-2026`;

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">March 14 Sprint</Badge>
              <Badge variant="outline" className="border-primary text-primary">Relational Strategy</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-lora">Event Command Center</h1>
            <p className="text-lg text-muted-foreground">Project managing the transition from "Selling" to "Holding Space."</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
              <Clock className="h-4 w-4" /> 72 Hours to Downbeat
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Saturday, March 14 | 10:00 AM</p>
          </div>
        </header>

        {/* 1. The 72-Hour Sprint Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-lora mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> The 72-Hour Sprint
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { day: "Wednesday", focus: "Personal Outreach", icon: <Users className="h-4 w-4" />, desc: "Message the 10 people who 'need' to be there." },
              { day: "Thursday", focus: "Community Nodes", icon: <MessageSquare className="h-4 w-4" />, desc: "Reach out to Sangha, Neha, and Brad." },
              { day: "Friday", focus: "Final Invitation", icon: <Instagram className="h-4 w-4" />, desc: "One authentic story. No hype, just heart." },
              { day: "Saturday", focus: "Presence", icon: <Leaf className="h-4 w-4" />, desc: "Inhabit the room. Forget the marketing." },
            ].map((step, i) => (
              <Card key={i} className="border-none shadow-md bg-muted/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{step.day}</span>
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">{step.icon}</div>
                  </div>
                  <p className="font-bold text-sm">{step.focus}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Strategy & Content */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* 2. Relational Outreach Tracker */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" /> Relational Outreach
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-none shadow-lg bg-primary/5 border-l-4 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">The 10 People Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>Identify 10 specific people who would benefit from this room. Message them personally.</p>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary/40">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-accent/5 border-l-4 border-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Community Nodes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Neha & Brad</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> The Sangha</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> November Crew</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 3. Content Templates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <Mic2 className="h-6 w-6 text-primary" /> Authentic Voice Templates
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

            {/* 4. Operational Prep: Inhabiting the Room */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" /> Inhabiting the Room
              </h2>
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">The Goal</p>
                    <p className="text-2xl font-lora italic">"Forget the marketing. Focus on the circle."</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <p className="font-bold text-sm">Physical Setup</p>
                      <ul className="text-xs space-y-1 opacity-80">
                        <li>• Chairs in a tight, warm circle</li>
                        <li>• Printed scores (not just digital)</li>
                        <li>• Water and tea station ready</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-sm">Emotional Setup</p>
                      <ul className="text-xs space-y-1 opacity-80">
                        <li>• 10 mins of silence before doors open</li>
                        <li>• Greet every single person by name</li>
                        <li>• Lead from the body, not the head</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column: Interactive Checklist & Goals */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-8">
              
              {/* Meaningful Goals */}
              <Card className="border-none shadow-lg bg-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" /> Meaningful Goals
                  </CardTitle>
                  <CardDescription>Beyond just ticket numbers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "10 New Faces in the room", progress: 40 },
                    { label: "5 Deep Conversations during break", progress: 0 },
                    { label: "1 Moment of Total Silence after 'Sleep'", progress: 0 },
                  ].map((goal, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{goal.label}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5 bg-accent/20" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <MarketingChecklist />
              
              <Card className="border-none shadow-lg bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" /> The "Why" Reminder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm italic text-muted-foreground leading-relaxed">
                  "Being Alive isn't just a song — it's a North Star. It's about the demand to feel something real. Sleep is the opposite — it's about the peace of finally letting go. We need both."
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