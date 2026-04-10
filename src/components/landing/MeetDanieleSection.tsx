"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const MeetDanieleSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="max-w-6xl mx-auto text-center px-4">
        <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight mb-12">Hi, I'm Daniele</h2>
        <div className="max-w-4xl mx-auto p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="relative flex-shrink-0">
            <img
              src="/images/daniele-buatti-headshot.jpeg"
              alt="Daniele Buatti"
              className="w-56 h-56 rounded-full object-cover shadow-xl border-4 border-background"
            />
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div className="text-left space-y-6">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-black font-lora mb-2">Daniele Buatti</CardTitle>
              <CardDescription className="text-lg md:text-xl text-primary font-bold">
                Vocal Coach and Musical Director
              </CardDescription>
            </div>
            <div className="p-0 space-y-4 text-muted-foreground text-lg leading-relaxed font-medium">
              <p>
                I believe that singing should feel good. My approach is all about helping you find a natural, easy way to use your voice that feels authentic to you.
              </p>
              <p>
                In our sessions, I focus on creating a warm and relaxed environment where we can focus on the music and the connection between us. It's not just about hitting the right notes; it's about the joy of singing together.
              </p>
              <div className="pt-4">
                <Button variant="link" className="p-0 h-auto text-primary font-black text-lg hover:underline group" asChild>
                  <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">
                    See more of my work <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetDanieleSection;