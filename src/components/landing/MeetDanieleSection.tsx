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
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora">Meet Daniele</h2>
        <Card className="max-w-4xl mx-auto p-8 md:p-12 shadow-2xl rounded-3xl border-none bg-muted/20 flex flex-col md:flex-row items-center gap-10">
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
              <CardTitle className="text-3xl font-bold mb-2 font-lora">Daniele Buatti</CardTitle>
              <CardDescription className="text-xl text-primary font-medium">
                Vocal Coach, Musical Director, and Space Holder
              </CardDescription>
            </div>
            <CardContent className="p-0 space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                Daniele’s approach to singing is something you <span className="text-foreground font-semibold italic">feel</span> more than just hear. As a vocal coach and musical director, he brings a warm, expressive, and deeply human quality to every room he leads.
              </p>
              <p>
                His philosophy is grounded in the body—focusing on natural resonance, lived-in ease, and the subtle textures that make a voice authentic. He believes singing isn't just about hitting notes; it's about storytelling and genuine connection.
              </p>
              <div className="pt-4">
                <Button variant="link" className="p-0 h-auto text-primary font-bold text-lg hover:underline group" asChild>
                  <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">
                    Learn more about Daniele's work <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default MeetDanieleSection;