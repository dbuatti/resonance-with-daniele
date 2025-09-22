"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const VideoSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-muted text-foreground text-center">
      <div className="max-w-4xl mx-auto px-4"> {/* Added px-4 for consistency */}
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora">Experience the Joy of Singing</h2>
        <div className="relative w-full mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl">
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src="/images/choir-video.mp4"
            controls
            loop
            muted
            playsInline
            preload="metadata"
            title="Resonance with Daniele Choir Video"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto">
          See our choir in action and get a glimpse of the vibrant community we've built.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link to="/events">Join Our Next Session</Link>
        </Button>
      </div>
    </section>
  );
};

export default VideoSection;