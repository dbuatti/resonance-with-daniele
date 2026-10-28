"use client";

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mic, Users, Heart, ArrowRight, ArrowLeft } from "lucide-react";
import VoicePhilosophy from "@/components/landing/VoicePhilosophy";
import Footer from "@/components/Footer";

const LearnMore: React.FC = () => {
  useEffect(() => {
    document.title = "Learn More | Resonance Choir Armadale — Daniele Buatti";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Learn about Resonance, a welcoming pop-up choir in Armadale, Melbourne. No auditions, no experience needed — just joyful singing with Daniele Buatti."
      );
    }
  }, []);

  const steps = [
    {
      icon: <CheckCircle className="h-12 w-12 text-primary" />,
      title: "A Warm Welcome",
      description: "We start by gathering and settling in. It's a friendly, low-pressure environment where everyone is welcome."
    },
    {
      icon: <Mic className="h-12 w-12 text-primary" />,
      title: "Gentle Warm-ups",
      description: "We do some simple exercises to get your body and voice ready to sing comfortably."
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Learning the Song",
      description: "I'll guide the group through the harmonies step by step. You don't need to be able to read music."
    },
    {
      icon: <Heart className="h-12 w-12 text-primary" />,
      title: "Singing Together",
      description: "The best part is when all the voices come together in harmony. It's a powerful and uplifting experience."
    }
  ];

  return (
    <div className="space-y-24 py-16 md:py-24 bg-background">
      {/* Hero */}
      <section className="relative text-center space-y-8 mb-20 md:mb-24">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-lora text-foreground tracking-tighter leading-none">
          Find your <br /> <span className="text-primary">resonance.</span>
        </h1>
        <p className="text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto text-muted-foreground leading-relaxed font-medium">
          A community choir that's all about the joy of singing together.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-lg" asChild>
            <a href="/next">Book Your Spot</a>
          </Button>
        </div>
        <div className="relative inline-block mt-6">
          <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
          <img
            src="/images/choir-session-3.jpg"
            alt="Resonance Choir Session"
            className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full object-cover shadow-xl"
          />
        </div>
      </section>

      <VoicePhilosophy />

      {/* What to expect - 4 step journey */}
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-lora tracking-tight mb-4">
            What to expect
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            A gentle journey through a typical session.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-5 md:gap-6">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {React.cloneElement(step.icon, { className: "h-6 w-6 md:h-7 md:w-7 text-primary" })}
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl md:text-2xl font-bold font-lora">{step.title}</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA - edge-to-edge */}
      <section className="py-16 md:py-24 md:bg-[#f8f0f3] relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-lora tracking-tight">
              Ready to sing?
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-foreground/80">
              Sessions in Armadale · No experience needed · All welcome
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-lg group" asChild>
                <a href="/next">
                  Book Your Spot <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
          <Button size="lg" variant="ghost" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg" asChild>
            <Link to="/">
              Back to Home
            </Link>
          </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LearnMore;
