"use client";

import React from "react";
import { UserPlus, BookOpen, Calendar, Mic } from "lucide-react";

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Sign Up",
      description: "Join the community online to stay updated on our next sessions.",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Get the Music",
      description: "I'll give you access to sheet music and practice tracks to help you learn.",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Come to a Session",
      description: "Join us for a morning of singing in Armadale. All levels are welcome.",
    },
    {
      icon: <Mic className="h-8 w-8" />,
      title: "Sing Together",
      description: "Experience the simple joy of group singing and beautiful harmonies.",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-secondary/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-lora">How it works</h2>
          <p className="text-lg text-muted-foreground">Four simple steps to join the circle.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="mb-6 w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold font-lora mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border -translate-x-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;