"use client";

import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link as LinkIcon } from "lucide-react";

const Events: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-center">Upcoming Events</h1>
        <p className="text-lg text-center text-muted-foreground">
          Stay up-to-date with all our choir's performances, rehearsals, and social gatherings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">
                Spring Concert
              </CardTitle>
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Date: May 15, 2025</p>
              <p className="text-sm text-muted-foreground">Location: Grand Auditorium</p>
              <Button asChild className="w-full">
                <a href="https://humanitix.com/your-event-link" target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" /> View on Humanitix
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">
                Weekly Rehearsal
              </CardTitle>
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Date: Every Tuesday</p>
              <p className="text-sm text-muted-foreground">Location: Community Hall</p>
              <Button variant="outline" className="w-full" disabled>
                No Humanitix Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium">
                Summer Gala
              </CardTitle>
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Date: July 20, 2025</p>
              <p className="text-sm text-muted-foreground">Location: City Gardens</p>
              <Button asChild className="w-full">
                <a href="https://humanitix.com/another-event-link" target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" /> View on Humanitix
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Events;