"use client";

import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center space-y-8 py-16">
        <img
          src="/images/daniele-buatti-headshot.jpeg"
          alt="Daniele Buatti"
          className="w-48 h-48 rounded-full object-cover shadow-lg mb-4"
        />
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          Welcome to the Resonance with Daniele Hub!
        </h1>
        <p className="text-2xl font-semibold text-primary">
          🎶 Sing. Connect. Shine. 🎶
        </p>

        <div className="max-w-3xl text-lg text-muted-foreground space-y-6 text-left">
          <p>
            Welcome! I’m Daniele Buatti, and I’m thrilled to share this space with you. I’ve been working in musical theatre, vocal coaching, and music direction for years, and I believe in the transformative power of singing — not just as performance, but as connection, expression, and joy.
          </p>
          <p>
            This hub is your go-to space for everything choir-related:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><span className="font-semibold text-foreground">Rehearsals & Events:</span> See our calendar, RSVP, and get updates in real time.</li>
            <li><span className="font-semibold text-foreground">Songs & Resources:</span> Access sheet music, audio tracks, and video tutorials to guide your practice.</li>
            <li><span className="font-semibold text-foreground">Vocal Exercises & Warm-Ups:</span> Explore exercises to strengthen, release, and resonate your voice.</li>
            <li><span className="font-semibold text-foreground">Community & Connection:</span> Chat, share, and celebrate with fellow singers.</li>
            <li><span className="font-semibold text-foreground">Performance Highlights & Media:</span> Relive moments from past concerts or see what’s coming next.</li>
          </ul>
          <p>
            No matter your experience — whether you’ve sung in choirs before or simply love singing in the shower — this is your safe, welcoming, and fun space to grow your voice and connect with others. We celebrate all voices and all identities, and everyone is invited to shine their unique light here.
          </p>
          <p className="font-semibold">
            💡 Learn more about me and my work:{" "}
            <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              DanieleBuatti.com
            </a>
          </p>
          <p className="text-right font-semibold text-foreground">
            — Daniele
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button size="lg" asChild>
            <Link to="/resources">Explore Resources</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/events">View Upcoming Events</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pt-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Easy Resource Access</CardTitle>
              <CardDescription>Find sheet music, practice tracks, and notes in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No more searching through emails or scattered files. Everything you need is here.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Stay Informed</CardTitle>
              <CardDescription>Keep track of all rehearsals, performances, and social events.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Direct links to Humanitix events make booking and sharing simple.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;