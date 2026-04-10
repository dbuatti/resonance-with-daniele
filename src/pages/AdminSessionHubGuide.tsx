"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Folder, Calendar, StickyNote, CheckCircle2, ArrowRight, Music, Eye } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AdminSessionHubGuide: React.FC = () => {
  return (
    <div className="py-8 space-y-12 max-w-4xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <BookOpen className="h-3 w-3" />
          <span>Admin Documentation</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Managing the Session Hub</h1>
        <p className="text-xl text-muted-foreground font-medium">
          A step-by-step guide on how to organize materials and notes for your members.
        </p>
      </header>

      <div className="space-y-8">
        {/* Step 1: Linking Folders */}
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Folder className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black font-lora">1. Linking Resources to Events</CardTitle>
                <CardDescription className="text-primary-foreground/70 font-medium">How to make files appear under a specific session.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              The Session Hub automatically pulls resources from folders that are "linked" to an event.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="bg-primary/10 p-2 rounded-lg text-primary font-black">A</div>
                <p className="font-bold">Go to the <a href="/resources" className="text-primary underline">Resources Page</a> and click "Edit" on a folder (or create a new one).</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="bg-primary/10 p-2 rounded-lg text-primary font-black">B</div>
                <p className="font-bold">In the Folder Dialog, look for the <span className="text-primary">"Link to Event"</span> dropdown.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="bg-primary/10 p-2 rounded-lg text-primary font-black">C</div>
                <p className="font-bold">Select the corresponding event and save. All <span className="italic">Published</span> resources in that folder will now appear in that session's section in the Hub.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Adding Notes */}
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-accent text-accent-foreground p-8">
            <div className="flex items-center gap-4">
              <div className="bg-black/10 p-3 rounded-2xl">
                <StickyNote className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black font-lora">2. Adding Your Lesson Notes</CardTitle>
                <CardDescription className="text-accent-foreground/70 font-medium">Sharing your personal insights with the circle.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              You can add "handwritten-style" notes to any event. These are great for reminders about phrasing, breath, or the "vibe" of a song.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <p className="font-bold">Go to the <a href="/events" className="text-primary underline">Events Page</a> and click the "Edit" icon on an event.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <p className="font-bold">Fill in the <span className="text-primary">"Lesson Notes"</span> text area. You can use multiple lines and emojis!</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                <p className="font-bold">Save the event. The notes will instantly appear in the Session Hub for all members.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-[2rem] bg-primary/5 border-2 border-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="font-black uppercase tracking-widest text-xs">The "Main Song" Badge</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              In the Event Dialog, fill in the <strong>"Main Song"</strong> field. This adds a prominent badge to that session in the Hub so members know exactly what the focus was.
            </p>
          </Card>
          <Card className="p-6 rounded-[2rem] bg-primary/5 border-2 border-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-black uppercase tracking-widest text-xs">Draft Mode</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              If you're still preparing materials, keep the resource <strong>Unpublished</strong>. It won't show up in the Session Hub until you check the "Publish" box.
            </p>
          </Card>
        </div>

        <div className="pt-12 text-center">
          <Button asChild size="lg" className="rounded-2xl font-black h-16 px-10 shadow-2xl group">
            <a href="/sessions">
              View the Session Hub <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSessionHubGuide;