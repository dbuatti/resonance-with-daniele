"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "I haven't sung in years, and I was so nervous. Daniele made me feel completely at ease. The sound we made together was breathtaking.",
    author: "Sarah M.",
    role: "First-time Participant"
  },
  {
    quote: "The energy in the room is infectious. It's not just about the music; it's about the connection with everyone else in the circle.",
    author: "James L.",
    role: "Regular Member"
  },
  {
    quote: "Daniele has a way of bringing out the best in every voice. I leave every session feeling uplifted and inspired.",
    author: "Elena R.",
    role: "Community Member"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold font-lora">What Our Singers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a community built on joy, support, and the shared love of music.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-none shadow-xl bg-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-1 text-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic leading-relaxed text-foreground/90">
                  "{t.quote}"
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="font-bold text-primary">{t.author}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;