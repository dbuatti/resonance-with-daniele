"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Sparkles } from "lucide-react";

const AboutChoirSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-lora animate-fade-in-up">About Our Choir</h2>

        <div className="max-w-3xl mx-auto text-lg text-muted-foreground space-y-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p>
            Led by Daniele Buatti, a musical director and vocal coach with years of experience in musical theatre and performance, our choir is all about connecting through music. We celebrate all voices, all backgrounds, and all identities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-6 shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="flex flex-col items-center">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">What We Believe In</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-none space-y-2">
                <li>Fun & Joyful Experiences</li>
                <li>Inclusivity & Acceptance</li>
                <li>Community & Connection</li>
                <li>Growth & Expression</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <CardHeader className="flex flex-col items-center">
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Why Join Us?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-none space-y-2">
                <li>Improve your singing skills</li>
                <li>Connect with like-minded people</li>
                <li>Enjoy fun, stress-free rehearsals</li>
                <li>Perform in concerts or pop-up events</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <CardHeader className="flex flex-col items-center">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Our Philosophy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We believe singing is for everyone. Our focus is on creating a supportive environment where every voice can find its resonance and every member feels valued.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutChoirSection;