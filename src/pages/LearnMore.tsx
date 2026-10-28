"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mic, Users, Heart, ArrowRight, ArrowLeft } from "lucide-react";
import VoicePhilosophy from "@/components/landing/VoicePhilosophy";

const LearnMore: React.FC = () => {
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
    <div className="space-y-24 py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <Button asChild variant="ghost" className="mb-8 -ml-2 hover:bg-primary/5">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <section className="text-center space-y-8 mb-24 md:mb-32">
          <h1 className="text-5xl md:text-8xl font-black font-lora text-foreground tracking-tighter leading-none">
            Find your <br /> <span className="text-primary">resonance.</span>
          </h1>
          <p className="text-xl md:text-3xl max-w-3xl mx-auto text-muted-foreground leading-relaxed font-medium">
            A community choir that's all about the joy of singing together.
          </p>
          <div className="relative inline-block mt-12">
            <div className="absolute -inset-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
            <img
              src="/images/choir-session-3.jpg"
              alt="Resonance Choir Session"
              className="relative w-56 h-56 md:w-72 md:h-72 rounded-full object-cover shadow-2xl border-8 border-white dark:border-gray-900"
            />
          </div>
        </section>

        <VoicePhilosophy />

        <section className="space-y-20 mt-32">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black font-lora text-foreground tracking-tight">
              What to expect
            </h2>
            <p className="text-lg text-muted-foreground font-medium">A typical session looks like this.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-8 items-start group">
                <div className="flex-shrink-0 bg-primary/5 p-6 rounded-[2rem] group-hover:scale-110 transition-transform duration-500">
                  {step.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black font-lora">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center space-y-10 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16 md:py-24 rounded-3xl md:rounded-[4rem] shadow-2xl mt-24 md:mt-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 space-y-6 px-4">
            <h2 className="text-4xl md:text-7xl font-black font-lora tracking-tighter">
              Ready to sing?
            </h2>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90 font-medium leading-relaxed">
              If this sounds like your kind of thing, we'd love to have you join us in Armadale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-16 px-10 text-xl font-black rounded-2xl shadow-2xl group" asChild>
                <a href="/next">
                  Book Your Spot <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10 h-16 px-10 text-xl font-black rounded-2xl" asChild>
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LearnMore;