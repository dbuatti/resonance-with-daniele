"use client";

import React from "react";

const VideoSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-muted text-foreground text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora animate-fade-in-up">Experience the Joy of Singing</h2>
        <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Placeholder for the video. Please replace the 'src' with your actual video URL. */}
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=y_y_y_y_y_y_y_y" // Placeholder: Replace with your video URL
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
        <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          See our choir in action and get a glimpse of the vibrant community we've built.
        </p>
      </div>
    </section>
  );
};

export default VideoSection;