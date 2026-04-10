"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote as QuoteIcon } from "lucide-react";

const testimonials = [
  {
    quote: "I loved doing the big circle at the end to sing together. It was so nice to hear it all come together and I felt so connected to the music and the harmonies.",
    author: "Past Participant",
    role: "Resonance Member"
  },
  {
    quote: "I enjoyed the open, fun, inclusive and relaxed atmosphere. Beautiful arrangement and fantastic people. Amazing organisation!",
    author: "Past Participant",
    role: "Resonance Member"
  },
  {
    quote: "The fluidity of the session was great. I loved the creative process, the movement, and the breathing and relaxation too.",
    author: "Past Participant",
    role: "Resonance Member"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-lora">What Our Singers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a community built on joy, support, and the shared love of music.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-none shadow-xl bg-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1 text-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <QuoteIcon className="h-8 w-8 text-primary/10" />
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