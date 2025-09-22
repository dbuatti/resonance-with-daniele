"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Users, Heart, Mic, CalendarDays, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const LearnMore: React.FC = () => {
  const faqItems = [
    {
      question: "Do I need to be a “good singer”?",
      answer: "Not at all! If you can sing along to the radio, you’ll be just fine. My choir is about joy and connection, not perfection. All voices are welcome, no matter your experience level."
    },
    {
      question: "Do I have to commit every week?",
      answer: "Nope — come when you can! Resonance with Daniele is designed to be flexible. You can drop in for individual sessions, making it easy to fit into your schedule without long-term commitments."
    },
    {
      question: "Will there be performances?",
      answer: "Sometimes, yes! We occasionally have opportunities to perform in concerts or pop-up events. However, joining performances is always optional, so there's no pressure if you prefer to just sing for fun."
    },
    {
      question: "Is the choir inclusive?",
      answer: "Absolutely! Resonance with Daniele is a safe, welcoming, and inclusive space for everyone. We celebrate all voices, all backgrounds, and all identities, including our beautiful LGBTQIA+ community. Everyone is truly welcome here."
    },
  ];

  return (
    <div className="py-8 md:py-12 space-y-12">
      <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4 font-lora">
            🎶 Learn More About Resonance with Daniele
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Welcome! Resonance with Daniele is a community choir that’s all about joy, connection, and the magic of voices joining together.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-lg text-muted-foreground space-y-6 max-w-3xl mx-auto">
          <img
            src="/images/daniele-buatti-headshot.jpeg"
            alt="Daniele Buatti"
            className="w-48 h-48 rounded-full object-cover shadow-md mx-auto mb-6"
          />
          <p>
            You don’t need to read music or have choir experience — if you love singing (even just in the shower or car), you’ll fit right in.
          </p>
          <p>
            I created this space so people could gather, feel safe to sing freely, and experience the uplifting energy of community music-making.
          </p>
        </CardContent>
      </Card>

      <section className="max-w-3xl mx-auto space-y-8">
        <Card className="p-6 md:p-8 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-lora flex items-center gap-3 mb-4">
              <CalendarDays className="h-8 w-8 text-primary" /> What Happens at a Choir Session?
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Here’s a little snapshot of what you can expect:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-base">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Warm welcome</span> – we gather, settle in, and connect.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Gentle vocal warm-ups</span> – fun, playful exercises to get everyone comfortable.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Learn the song</span> – I’ll guide the group step by step, so no one’s left behind.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Sing together in harmony</span> – that special moment when voices blend as one.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Optional connection afterwards</span> – sometimes we grab a coffee, a drink, or just have a laugh together.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 md:p-8 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-lora flex items-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-primary" /> Why Join?
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              People come to choir for all sorts of reasons — maybe one of these resonates with you:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-base">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">To relieve stress and recharge</span> after a long week.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">To meet new friends</span> and feel part of a community.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">To improve your voice</span> in a supportive, pressure-free space.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">To enjoy the thrill of singing in harmony</span> — even if you’ve never sung in a choir before.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p><span className="font-semibold text-foreground">Everyone is welcome</span> — Resonance is LGBTQIA+ inclusive, beginner-friendly, and open to all voices.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 md:p-8 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-lora flex items-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary" /> FAQs
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Got questions? We've got answers!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="p-6 md:p-8 shadow-lg rounded-xl text-center bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-lora mb-4">Ready to Give It a Try?</CardTitle>
            <CardDescription className="text-lg text-primary-foreground/80">
              If this sounds like your kind of vibe, we’d love to have you join us.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link to="/events">
                <Mic className="mr-2 h-5 w-5" /> See Upcoming Choir Dates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default LearnMore;