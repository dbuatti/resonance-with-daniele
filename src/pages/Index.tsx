"use client";

import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center space-y-8 py-16"> {/* Increased vertical padding */}
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          Resonance with Daniele
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your central hub for all things choir-related: resources, events, and important announcements.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link to="/resources">Explore Resources</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/events">View Upcoming Events</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pt-8">
          <Card className="shadow-lg rounded-xl"> {/* Added shadow-lg and rounded-xl */}
            <CardHeader>
              <CardTitle>Easy Resource Access</CardTitle>
              <CardDescription>Find sheet music, practice tracks, and notes in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No more searching through emails or scattered files. Everything you need is here.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl"> {/* Added shadow-lg and rounded-xl */}
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