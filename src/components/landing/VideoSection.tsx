"use client";

import React from "react";

const VideoSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-muted text-foreground text-center">
      <div className="px-4"> {/* Removed container mx-auto */}
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora">Experience the Joy of Singing</h2>
        <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl">
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
      </div>
    </section>
  );
};

export default VideoSection;