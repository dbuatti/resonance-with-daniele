"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-24 md:mt-32 border-t border-border/60 bg-background/80">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-lg font-bold font-lora">Resonance</p>
            <p className="text-sm text-muted-foreground">A community choir in Armadale, Melbourne</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
            <Link to="/next" className="hover:text-foreground">Book a session</Link>
            <Link to="/learn-more" className="hover:text-foreground">Learn more</Link>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground">
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
            <a href="https://danielebuatti.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Daniele Buatti
            </a>
          </div>
        </div>
        <div className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Resonance. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
