"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Mail } from "lucide-react";

const FooterSection: React.FC = () => {
  return (
    <footer className="bg-card text-foreground py-12 border-t border-border">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="text-xl font-bold mb-4">Resonance with Daniele</h3>
          <p className="text-muted-foreground">
            A joyful, welcoming space I've created for anyone who loves to sing.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <nav className="flex flex-col space-y-2 items-center md:items-start">
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
              <Link to="/resources">Resources</Link>
            </Button>
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
              <Link to="/events">Events</Link>
            </Button>
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
              <Link to="/login">Login</Link>
            </Button>
          </nav>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Connect</h3>
          <div className="flex justify-center md:justify-start space-x-4 mb-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
              <a href="https://www.facebook.com/danielebuatti" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-6 w-6" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
              <a href="https://www.instagram.com/daniele.buatti/" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-6 w-6" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
              <a href="mailto:resonancewithdaniele@gmail.com">
                <Mail className="h-6 w-6" />
              </a>
            </Button>
          </div>
          <p className="text-muted-foreground">Email: resonancewithdaniele@gmail.com</p>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Resonance with Daniele. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default FooterSection;