"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic2, Heart, Sparkles, Users } from "lucide-react";

const VoicePhilosophy: React.FC = () => {
  const traits = [
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: "Warm & Expressive",
      description: "An inviting, human quality that draws people in immediately. It’s a voice you feel more than just hear."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "Flexible & Nuanced",
      description: "Gliding from soft, intimate phrasing to powerful, theatrical bursts with a natural, lived-in ease."
    },
    {
      icon: <Mic2 className="h-6 w-6 text-primary" />,
      title: "Grounded Resonance",
      description: "Every note is connected to the body. It’s not just about pitch; it’s about personality, intention, and empathy."
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Human Connection",
      description: "Embracing the subtle textures and shifts that make a voice authentic. Storytelling and connecting, all in one."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30 rounded-3xl overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-lora">The Power of the Human Voice</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In a world of mechanical perfection, we celebrate the lived, resonant humanity that only a real voice can carry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {traits.map((trait, i) => (
            <Card key={i} className="border-none shadow-md bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {trait.icon}
                </div>
                <CardTitle className="text-xl font-bold font-lora">{trait.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {trait.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary text-primary-foreground rounded-2xl shadow-xl text-center">
          <p className="text-xl md:text-2xl font-lora italic leading-relaxed">
            "AI can imitate, but it doesn’t carry the human experience. My work is about helping you find the voice that speaks *to* people, not just sings *at* them."
          </p>
          <p className="mt-4 font-bold uppercase tracking-widest text-sm opacity-80">— Daniele Buatti</p>
        </div>
      </div>
    </section>
  );
};

export default VoicePhilosophy;