"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, Headphones, Mic2, Users, Leaf } from "lucide-react"; // Import Leaf icon

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
      icon: <Leaf className="h-8 w-8 text-primary" />, // New icon for mindfulness
      title: "Mindful Breathing & Body Awareness",
      description: "Develop a deeper connection to your voice through breathwork and body awareness exercises.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted text-foreground">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-lora animate-fade-in-up">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center p-6 shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
              <CardHeader className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  {benefit.icon}
                </div>
                <CardTitle className="text-xl font-semibold font-lora">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {benefit.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8 shadow-lg rounded-xl bg-card border-l-4 border-primary animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <CardContent className="text-lg italic text-muted-foreground">
              “I’ve never sung in a choir before, but this felt welcoming and so fun!”
              <p className="mt-4 font-semibold text-foreground not-italic">— Chloe, Participant</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResourcesBenefitsSection;