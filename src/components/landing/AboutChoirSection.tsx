"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Sparkles } from "lucide-react";

const AboutChoirSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-lora">About My Choir</h2>

        <div className="max-w-3xl mx-auto text-lg text-muted-foreground space-y-6 mb-12">
          <p>
            Led by me, Daniele Buatti, my choir is all about the magic that happens when voices join together. Whether you're a total beginner or a seasoned singer looking for a no-pressure way to enjoy complex harmonies, there's a place for you here.
          </p>
        </div>

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
                <li>Improve your vocal skills</li>
                <li>Connect with like-minded people</li>
                <li>Enjoy fun, stress-free rehearsals</li>
                <li>Experience that "incredible sound"</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg rounded-xl">
            <CardHeader className="flex flex-col items-center">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold font-lora">My Philosophy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              I believe singing is for everyone. My focus is on creating a supportive environment where every voice—from Soprano to Bass—can find its resonance.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutChoirSection;