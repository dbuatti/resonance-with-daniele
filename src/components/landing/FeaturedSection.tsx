"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, CalendarDays } from "lucide-react";

const FeaturedSection: React.FC = () => {
  // Placeholder for dynamic content
  const featuredEvent = {
    title: "Shine Like the Sun",
    type: "Song",
    description: "Our next session features ‘Shine Like the Sun’ — a fun, uplifting song for all levels. Join us on [date/time] at [venue].",
    ctaText: "Reserve Your Spot",
    ctaLink: "/events",
    icon: <Music className="h-8 w-8 text-primary" />,
  };

  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">Featured Highlight</h2>
        <Card className="max-w-2xl mx-auto p-8 shadow-lg rounded-xl border-2 border-primary/20">
          <CardHeader className="flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              {featuredEvent.icon}
            </div>
            <CardTitle className="text-2xl font-bold mb-2">{featuredEvent.title}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {featuredEvent.type === "Song" ? "Featured Song" : "Upcoming Event"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-md text-muted-foreground">
              {featuredEvent.description}
            </p>
            <Button size="lg" asChild>
              <Link to={featuredEvent.ctaLink}>
                {featuredEvent.ctaText}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FeaturedSection;