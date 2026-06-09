"use client";

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center shadow-xl border-none rounded-[2.5rem] animate-fade-in-up">
        <CardHeader className="flex flex-col items-center">
          <Frown className="h-20 w-20 text-primary mb-4" />
          <CardTitle className="text-5xl font-black font-lora tracking-tighter mb-2">404</CardTitle>
          <CardDescription className="text-xl text-muted-foreground font-medium">
            Page not found.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Button size="lg" className="rounded-xl font-black shadow-lg w-full" asChild>
            <Link to="/">Return Home</Link>
          </Button>
          <Button variant="outline" className="rounded-xl font-bold w-full" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;