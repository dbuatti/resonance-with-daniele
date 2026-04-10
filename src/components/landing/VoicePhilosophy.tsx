"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic2, Heart, Sparkles, Users } from "lucide-react";

const VoicePhilosophy: React.FC = () => {
  const traits = [
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: "Simple and Human",
      description: "Singing is a natural human experience. I focus on making it feel easy and accessible for everyone."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "Natural Ease",
      description: "We work on using your voice in a way that feels comfortable and relaxed, without any strain."
    },
    {
      icon: <Mic2 className="h-6 w-6 text-primary" />,
      title: "Real Connection",
      description: "Group singing is about more than just music; it's about the connection we feel when we sing together."
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Your Own Voice",
      description: "I want to help you find your own authentic sound, rather than trying to sound like someone else."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30 rounded-3xl overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-lora">What I believe about singing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Singing is for everyone. It's a simple, powerful way to connect with ourselves and each other.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {traits.map((trait, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 bg-card rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {trait.icon}
                </div>
                <h3 className="text-xl font-bold font-lora">{trait.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {trait.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary text-primary-foreground rounded-2xl shadow-xl text-center">
          <p className="text-xl md:text-2xl font-lora italic leading-relaxed">
            "My goal is to help you find the voice that feels most like you, and to experience the joy of sharing that with others."
          </p>
          <p className="mt-4 font-bold uppercase tracking-widest text-sm opacity-80">— Daniele Buatti</p>
        </div>
      </div>
    </section>
  );
};

export default VoicePhilosophy;