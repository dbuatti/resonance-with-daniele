"use client";

import React from "react";

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
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Voices
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05]">
            What singers say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {testimonials.slice(0, 2).map((t, i) => (
            <div key={i} className="space-y-4">
              <blockquote className="text-lg md:text-xl leading-relaxed">
                “{t.quote}”
              </blockquote>
              <p className="text-sm text-muted-foreground">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;