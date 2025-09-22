"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MeetDanieleSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora animate-fade-in-up">Meet Daniele</h2>
        <Card className="max-w-3xl mx-auto p-8 shadow-lg rounded-xl flex flex-col md:flex-row items-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <img
            src="/images/daniele-buatti-headshot.jpeg"
            alt="Daniele Buatti"
            className="w-48 h-48 rounded-full object-cover shadow-md flex-shrink-0"
          />
          <div className="text-left">
            <CardTitle className="text-2xl font-bold mb-2 font-lora">Daniele Buatti</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mb-4">
              Vocal Coach, Musical Director, and Lifelong Music Lover
            </CardDescription>
            <CardContent className="p-0 space-y-4 text-muted-foreground">
              <p>
                Daniele Buatti is a vocal coach, musical director, and lifelong music lover. With a passion for making singing accessible to everyone, Daniele leads the choir with warmth, energy, and a focus on connection through music.
              </p>
              <p>
                Her extensive experience in musical theatre and performance ensures a high-quality, yet always fun and supportive, environment for all singers.
              </p>
              <Button variant="link" className="p-0 h-auto text-primary hover:underline" asChild>
                <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">
                  Learn more about Daniele's work &rarr;
                </a>
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default MeetDanieleSection;