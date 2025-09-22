"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Sparkles } from "lucide-react";

const AboutChoirSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-lora">About My Choir</h2>

        <div className="max-w-3xl mx-auto text-lg text-muted-foreground space-y-6 mb-12">
          <p>
            Led by me, Daniele Buatti, a musical director and vocal coach with years of experience in musical theatre and performance, my choir is all about connecting through music. I celebrate all voices, all backgrounds, and all identities.
          </p>
        </div>

        {/* Image of Daniele conducting */}
        <img
          src="/images/daniele-conduct.jpeg"
          alt="Daniele Buatti conducting the choir"
          className="w-full max-w-3xl mx-auto rounded-xl shadow-lg mb-12 object-cover"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-6 shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">What I Believe In</CardTitle>
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

          <Card className="text-center p-6 shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">Why Join My Choir?</CardTitle>
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

          <Card className="text-center p-6 shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">My Philosophy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              I believe singing is for everyone. My focus is on creating a supportive environment where every voice can find its resonance and every member feels valued.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutChoirSection;