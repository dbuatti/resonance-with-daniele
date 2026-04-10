"use client";

import React from "react";

const CommunityGallery: React.FC = () => {
  const images = [
    {
      src: "/images/gallery-1.jpg",
      alt: "Choir members singing together in harmony",
      caption: "Finding the harmony"
    },
    {
      src: "/images/gallery-2.jpg",
      alt: "Daniele leading a vocal exercise",
      caption: "Joyful connection"
    },
    {
      src: "/images/gallery-3.jpg",
      alt: "The choir circle in Armadale",
      caption: "The Resonance circle"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black font-lora tracking-tight">Community in Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            A glimpse into our monthly sessions at Armadale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {images.map((image, i) => (
            <div key={i} className="group relative overflow-hidden rounded-[2rem] shadow-xl aspect-[4/5]">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                <p className="text-white font-bold text-xl font-lora">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityGallery;