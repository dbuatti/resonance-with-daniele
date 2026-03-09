"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Zap, 
  Instagram, 
  Mail, 
  MessageSquare, 
  Music, 
  Target, 
  Copy, 
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AdminMarketingPlanPage: React.FC = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  const flashSaleCaption = `FLASH SALE ⚡️ 48 HOURS ONLY!

Resonance returns this Saturday and I want the room VIBRATING. 

Whether you’re a Sondheim fanatic or just need a morning of pure choral peace, this is for you. We’re tackling:
🔥 Being Alive (Sondheim) - The ultimate anthem.
🌙 Sleep (Eric Whitacre) - Pure vocal magic.

Use code: SING20 for 20% off General Admission.
Ends Friday 1pm!

🎟 Link in bio to grab your spot.
#resonancechoir #melbournechoir #sondheim #popupchoir`;

  const emailTemplate = `Subject: 48-Hour Flash Sale: Let's sing "Being Alive" this Saturday! 🎶

Hi there,

It’s been a little while since our last pop-up choir, and I’d love to see the November crew back in the circle this Saturday, March 14 (10am–1pm) at Armadale Baptist Church.

We’re diving into two extraordinary pieces: the powerhouse energy of Sondheim’s "Being Alive" and the breathtaking stillness of Eric Whitacre’s "Sleep."

To celebrate our return, I’m opening up a 48-hour Flash Sale for my past singers.

Use code SING20 at checkout for 20% off.
(Valid until Friday 1:00 PM)

Grab your spot here: https://events.humanitix.com/resonance-melbourne-march-2026

Let's make some noise together!

— Daniele`;

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">March 14 Strategy</Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-lora">The "Last Push" Plan</h1>
            <p className="text-lg text-muted-foreground">Goal: Convert interest into 40+ additional tickets by Friday night.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Clock className="h-4 w-4" /> 72 Hours Remaining
          </div>
        </header>

        {/* 1. The Hook */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" /> The Hook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-bold text-xl">"Power vs. Peace"</p>
              <p className="text-sm opacity-80">Contrast the high-energy Sondheim ending with the ethereal Whitacre harmonies. Sell the emotional journey.</p>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5" /> The Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-bold text-xl">Code: SING20</p>
              <p className="text-sm opacity-80">20% off General Admission. Creates a "Why now?" moment for people on the fence.</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-primary/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <TrendingUp className="h-5 w-5" /> The Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-bold text-xl text-foreground">Local & Niche</p>
              <p className="text-sm text-muted-foreground">Target Armadale (10km) + Musical Theatre fans + Past attendees.</p>
            </CardContent>
          </Card>
        </section>

        {/* 2. The Content Calendar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> 72-Hour Execution Roadmap
          </h2>
          
          <div className="space-y-4">
            {/* Wednesday */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Wednesday: The Launch</CardTitle>
                  <Badge variant="outline">High Priority</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase flex items-center gap-1"><Mail className="h-3 w-3" /> Direct Email</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(emailTemplate, "Email Template")}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Send to the 21 past attendees. Personal, warm, and includes the discount.</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase flex items-center gap-1"><Instagram className="h-3 w-3" /> Main Feed Post</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(flashSaleCaption, "Instagram Caption")}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Use the church photo. Boost this post ($15/day) targeting Armadale + Musical Theatre.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thursday */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Thursday: The Deep Dive</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-full"><Instagram className="h-5 w-5 text-purple-600" /></div>
                  <div className="space-y-1">
                    <p className="font-bold">Instagram Stories: "Why these songs?"</p>
                    <p className="text-sm text-muted-foreground">Video of you at the keys. Play the "Being Alive" chords. Explain that "Sleep" was written to be sung in a space exactly like Armadale Baptist. Use a Link Sticker: "Claim 20% Off".</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Friday */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Friday: The Final Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-2 rounded-full"><MessageSquare className="h-5 w-5 text-red-600" /></div>
                    <div className="space-y-1">
                      <p className="font-bold">Facebook Community Groups</p>
                      <p className="text-sm text-muted-foreground">Post in "Melbourne Musicians" & "Armadale Community". "Last few spots for tomorrow morning! No auditions, just Sondheim and good vibes."</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-2 rounded-full"><Clock className="h-5 w-5 text-red-600" /></div>
                    <div className="space-y-1">
                      <p className="font-bold">Story: "Sale Ends at 1pm"</p>
                      <p className="text-sm text-muted-foreground">Urgency post. "Final 3 hours to use code SING20. The circle is looking great—can't wait to hear these harmonies tomorrow!"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Paid Ad Strategy */}
        <Card className="mt-12 border-none shadow-2xl bg-gradient-to-br from-background to-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" /> Paid Ad Strategy (The "Boost")
            </CardTitle>
            <CardDescription>Spend $45–$60 total to reach ~5,000 local people.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Targeting</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> <strong>Location:</strong> Armadale + 10km radius</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> <strong>Interests:</strong> Musical Theatre, Choral Music, Sondheim</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> <strong>Age:</strong> 25 – 65</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Budget</h4>
                <div className="p-4 bg-background rounded-xl border shadow-sm">
                  <p className="text-2xl font-bold text-primary">$20 / day</p>
                  <p className="text-sm text-muted-foreground">Run for 3 days (Wed-Fri)</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Why Boost?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Because you only have 6 tickets sold, the "Social Proof" of a boosted post makes the event look established. It ensures that even if people don't follow you, they see the "Pop-Up" opportunity in their neighborhood.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMarketingPlanPage;