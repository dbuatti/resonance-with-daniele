"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05] mb-4">
            Ready to sing with us?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Saturday 5 December 2026, 10am–1pm, Armadale. No auditions, no experience needed.
          </p>
          <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-lg" asChild>
            <a href="/next">
              Book your spot <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
