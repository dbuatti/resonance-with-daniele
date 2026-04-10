"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, Headphones, Mic2, Users, Leaf } from "lucide-react";

const ResourcesBenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: <Sheet className="h-8 w-8 text-primary" />,
      title: "Sheet Music & Audio Tracks",
      description: "Access all your practice materials in one convenient place.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Supportive Community",
      description: "Connect with fellow singers and share your musical journey.",
    },
    {
      icon: <Headphones className="h-8 w-8 text-primary" />,
      title: "Performance Opportunities",
      description: "Showcase your talent in concerts and pop-up events.",
    },
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Mindful Breathing & Body Awareness",
      description: "Develop a deeper connection to your voice through breathwork and body awareness exercises.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted text-foreground">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight text-center mb-16">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center p-8 shadow-lg rounded-[2rem] border-none bg-card">
              <CardHeader className="flex flex-col items-center pb-4">
                <div className="bg-primary/10 p-4 rounded-2xl mb-4">
                  {benefit.icon}
                </div>
                <CardTitle className="text-2xl font-black font-lora leading-tight">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground font-medium leading-relaxed">
                {benefit.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <Card className="p-10 shadow-xl rounded-[2.5rem] bg-card border-l-8 border-primary">
            <CardContent className="text-xl md:text-2xl italic font-medium text-muted-foreground leading-relaxed">
              “I enjoyed the open, fun, inclusive and relaxed atmosphere. Beautiful arrangement and fantastic people.”
              <p className="mt-6 font-black text-foreground not-italic text-sm uppercase tracking-widest">— Past Participant</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResourcesBenefitsSection;