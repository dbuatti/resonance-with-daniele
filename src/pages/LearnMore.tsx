"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LearnMore: React.FC = () => {
  return (
    <div className="py-8 md:py-12 space-y-12">
      <Card className="max-w-4xl mx-auto p-6 md:p-10 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-bold font-lora mb-4">
            Learn More About Resonance with Daniele
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dive deeper into our philosophy, what we offer, and how you can be a part of our musical journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground text-lg">
          <p>
            Here at Resonance with Daniele, we believe that music is a universal language that connects us all. Our choir is a vibrant community where passion for singing meets a supportive and inclusive environment. Whether you're a seasoned vocalist or just discovering your voice, you'll find a place to belong and grow.
          </p>
          <p>
            We focus on creating joyful experiences, fostering community, and providing opportunities for everyone to express themselves through song. Our sessions are designed to be fun, engaging, and accessible, ensuring that every member feels valued and inspired.
          </p>
          <p>
            Explore our resources, join our events, and become part of a movement that celebrates the power of collective harmony.
          </p>
          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/" className="flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnMore;