"use client";

import React from "react";

const CommunityGallery: React.FC = () => {
  // Using 3 random photos from the provided attachments
  const images = [
    "/images/pasted-image-2026-04-10T00-32-59-054Z-1.jpeg",
    "/images/pasted-image-2026-04-10T00-32-59-054Z-10.jpeg",
    "/images/pasted-image-2026-04-10T00-32-59-054Z-21.jpeg",
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {images.map((src, i) => (
            <div 
              key={i} 
              className="relative group overflow-hidden rounded-[2rem] shadow-xl aspect-[4/3] border-4 border-white dark:border-gray-800 hover-lift"
            >
              <img
                src={src}
                alt={`Resonance choir rehearsal moment ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityGallery;