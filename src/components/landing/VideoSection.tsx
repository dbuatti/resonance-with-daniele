"use client";

import React from "react";

const VideoSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-muted text-foreground text-center">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight mb-12">Experience the Joy of Singing</h2>
        <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-900">
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
        <p className="mt-10 text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Get a glimpse into the joyful energy of my past choir performances.
        </p>
      </div>
    </section>
  );
};

export default VideoSection;