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
  TrendingUp,
  Camera,
  Video,
  Users
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
      <div className="max-w-6xl mx-auto px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Strategy & Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. The Hook */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </section>

            {/* 2. Content Templates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <Copy className="h-6 w-6 text-primary" /> Copy-Paste Templates
              </h2>
              
              <Card className="border-none shadow-lg bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram Caption
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(flashSaleCaption, "Instagram Caption")}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground bg-background p-4 rounded-lg border">
                    {flashSaleCaption}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email Template
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(emailTemplate, "Email Template")}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground bg-background p-4 rounded-lg border">
                    {emailTemplate}
                  </pre>
                </CardContent>
              </Card>
            </section>

            {/* 3. Content for the NEXT one (Day of Strategy) */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-lora flex items-center gap-2">
                <Camera className="h-6 w-6 text-primary" /> Content for the NEXT Choir
              </h2>
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The best marketing for the next event happens <strong>during</strong> this one. Don't forget to capture:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg"><Video className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-sm font-bold">The "Wall of Sound"</p>
                        <p className="text-xs text-muted-foreground">Record the final 30 seconds of 'Being Alive' from the back of the room.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg"><Users className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-sm font-bold">The "Post-Sing" Glow</p>
                        <p className="text-xs text-muted-foreground">Quick video of people laughing/chatting during the break.</p>
                      </div>
                    </div>
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
                    <TrendingUp className="h-5 w-5 text-primary" /> Paid Ad Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-bold">Targeting:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Armadale + 10km radius</li>
                      <li>Interests: Musical Theatre, Sondheim</li>
                      <li>Budget: $20/day (Wed-Fri)</li>
                    </ul>
                  </div>
                  <Separator />
                  <p className="text-xs italic text-muted-foreground">
                    "Social Proof" is key. A boosted post makes the event look established even with low initial sales.
                  </p>
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