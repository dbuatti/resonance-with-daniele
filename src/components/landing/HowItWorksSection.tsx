"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, BookOpen, Calendar, Mic } from "lucide-react";

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      title: "Sign Up",
      description: "Join online in seconds and become part of my vibrant community.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Access Resources",
      description: "Get instant access to sheet music, audio tracks, video tutorials, and warm-ups.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Attend Rehearsals",
      description: "Join my weekly sessions or one-off pop-up events, tailored for all levels.",
    },
    {
      icon: <Mic className="h-8 w-8 text-primary" />,
      title: "Sing & Shine",
      description: "Perform in concerts or simply enjoy the pure joy of singing in community.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted text-foreground">
      <div> {/* Removed px-4 */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-lora">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="text-center p-6 shadow-lg rounded-xl">
              <CardHeader className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  {step.icon}
                </div>
                <CardTitle className="text-xl font-semibold font-lora">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {step.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;