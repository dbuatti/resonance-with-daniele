"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  Mic2,
  Leaf,
  MessageSquare,
  Zap,
  UserPlus,
  MapPin,
  Brain,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { Textarea } from "@/components/ui/textarea";

const AdminMarketingPlanPage: React.FC = () => {
  const [brainDump, setBrainDump] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("march14_brain_dump");
    if (saved) setBrainDump(saved);
  }, []);

  const handleBrainDumpChange = (val: string) => {
    setBrainDump(val);
    localStorage.setItem("march14_brain_dump", val);
  };

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
    <div className="space-y-8 py-8 md:py-12 bg-background/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        {/* ADHD Header: Big, Clear, Visual */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full">🚀 March 14 Sprint</Badge>
              <Badge variant="outline" className="border-primary text-primary px-3 py-1 rounded-full">🤝 Relational Focus</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tight">Event Command Center</h1>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-sm border flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Countdown</p>
              <p className="text-xl font-black text-primary">72 Hours to Downbeat</p>
            </div>
          </div>
        </header>

        {/* FOCUS MODE: The "One Thing" */}
        <section className="mb-12">
          <Card className="border-4 border-primary bg-primary/5 shadow-2xl overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl">
                <Target className="h-12 w-12" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Current Focus</h2>
                <p className="text-3xl font-black font-lora">Message the 10 people who "need" to be there.</p>
                <p className="text-muted-foreground">Don't worry about the rest of the list yet. Just do this one thing.</p>
              </div>
              <Button size="lg" className="h-16 px-8 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 group">
                Done! <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Content & Strategy */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Relational Outreach */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black font-lora flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" /> 1. Human Connections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-none shadow-lg bg-card border-l-4 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">The 10 People Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">Identify 10 specific people. Message them personally. No templates.</p>
                    <div className="flex flex-wrap gap-2">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-xl border-2 border-primary/10 flex items-center justify-center text-xs font-black text-primary/30 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-card border-l-4 border-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Community Nodes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {["Neha & Brad", "The Sangha", "November Crew"].map((node) => (
                      <div key={node} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-xs font-bold">{node}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Templates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black font-lora flex items-center gap-2">
                <Mic2 className="h-6 w-6 text-primary" /> 2. Copy & Paste
              </h2>
              
              <div className="space-y-4">
                <Card className="border-none shadow-lg bg-card overflow-hidden">
                  <div className="bg-muted/50 px-6 py-3 flex justify-between items-center border-b">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Instagram className="h-3 w-3" /> Instagram Caption
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black" onClick={() => copyToClipboard(authenticCaption, "Instagram Caption")}>
                      <Copy className="h-3 w-3 mr-1" /> COPY
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {authenticCaption}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-card overflow-hidden">
                  <div className="bg-muted/50 px-6 py-3 flex justify-between items-center border-b">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Template
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black" onClick={() => copyToClipboard(authenticEmail, "Email Template")}>
                      <Copy className="h-3 w-3 mr-1" /> COPY
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {authenticEmail}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Inhabiting the Room */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black font-lora flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" /> 3. The Room
              </h2>
              <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-3xl overflow-hidden">
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">The Mantra</p>
                    <p className="text-3xl font-lora italic font-bold">"Forget the marketing. Focus on the circle."</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <p className="font-black text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Physical
                      </p>
                      <ul className="text-sm space-y-3 font-medium">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Chairs in a tight circle</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Printed scores ready</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Tea station set up</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <p className="font-black text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Heart className="h-4 w-4" /> Emotional
                      </p>
                      <ul className="text-sm space-y-3 font-medium">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> 10 mins of silence first</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Greet everyone by name</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Lead from the body</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column: Interactive Tools */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-8">
              
              {/* BRAIN DUMP: ADHD Essential */}
              <Card className="border-none shadow-xl bg-yellow-50 dark:bg-yellow-950/20 border-l-8 border-yellow-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Brain className="h-5 w-5" /> Brain Dump
                  </CardTitle>
                  <CardDescription className="text-yellow-600/70 dark:text-yellow-400/60">
                    Offload distracting thoughts here so you can stay focused.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Random ideas, things to remember later, distractions..." 
                    className="min-h-[150px] bg-background/50 border-yellow-200 focus-visible:ring-yellow-400"
                    value={brainDump}
                    onChange={(e) => handleBrainDumpChange(e.target.value)}
                  />
                </CardContent>
              </Card>

              <MarketingChecklist />
              
              <Card className="border-none shadow-lg bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" /> The "Why"
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm italic text-muted-foreground leading-relaxed">
                  "Being Alive is a North Star. It's the demand to feel something real. Sleep is the peace of letting go. We need both."
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