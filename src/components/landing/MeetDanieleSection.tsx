"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";
const MeetDanieleSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <img
              src="/images/daniele-buatti-headshot.jpeg"
              alt="Daniele Buatti"
              className="w-full h-[320px] md:h-[420px] lg:h-[520px] object-cover rounded-lg"
            />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              About
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05]">
              Daniele Buatti
            </h2>
            <p className="text-lg text-muted-foreground">Musical Director & Vocal Coach</p>
            <div className="space-y-4 text-base md:text-lg text-foreground/90 leading-relaxed max-w-2xl">
              <p>
                I believe singing should feel good. My approach helps you find a natural, easy way to use your voice that feels authentic to you.
              </p>
              <p>
                In our sessions, I focus on creating a warm and relaxed environment where we can focus on the music and the connection between us. It's about the joy of singing together.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-lg">
              <a href="https://danielebuatti.com" target="_blank" rel="noopener noreferrer">
                See more of my work
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetDanieleSection;