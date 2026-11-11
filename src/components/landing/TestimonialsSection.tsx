"use client";

import React from "react";
import { Quote } from "lucide-react";

const featured = {
  quote: "I loved doing the big circle at the end to sing together. It was so nice to hear it all come together and I felt so connected to the music and the harmonies.",
  author: "Past Participant",
  role: "Resonance Member",
};

const testimonials = [
  {
    quote: "I enjoyed the open, fun, inclusive and relaxed atmosphere. Beautiful arrangement and fantastic people. Amazing organisation!",
    author: "Past Participant",
  },
  {
    quote: "The fluidity of the session was great. I loved the creative process, the movement, and the breathing and relaxation too.",
    author: "Past Participant",
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 md:mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Voices
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05]">
            What singers say
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <img
              src="/images/gallery-1.jpg"
              alt="Choir members singing together in harmony"
              loading="lazy"
              className="w-full h-[280px] md:h-[360px] lg:h-[460px] object-cover rounded-2xl"
            />
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <Quote className="h-9 w-9 md:h-11 md:w-11 text-primary/30 mb-5" />
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-lora italic leading-snug text-foreground mb-6">
              “{featured.quote}”
            </blockquote>
            <p className="text-base font-bold">
              {featured.author}
              <span className="block text-sm font-medium text-muted-foreground">{featured.role}</span>
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-8">
              {testimonials.map((t) => (
                <div key={t.quote} className="space-y-3">
                  <blockquote className="text-base leading-relaxed text-foreground/80">
                    “{t.quote}”
                  </blockquote>
                  <p className="text-xs font-bold text-muted-foreground">— {t.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
