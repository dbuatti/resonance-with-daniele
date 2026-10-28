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
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Community
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05]">
            Moments of harmony
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {images.slice(0, 3).map((image, i) => (
            <img
              key={i}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="w-full h-[260px] md:h-[320px] object-cover rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-lg"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityGallery;