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
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05] mb-3">
            No experience necessary
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Three simple steps to joining the harmony.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.slice(0, 3).map((step, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-lora">{step.title}</h3>
              </div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;