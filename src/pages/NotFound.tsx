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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center shadow-lg rounded-xl border-2 border-muted-foreground/20">
        <CardHeader className="flex flex-col items-center">
          <Frown className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-4xl font-bold mb-2 font-lora">404 - Page Not Found</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Oops! The page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="mt-6">
            <Link to="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;