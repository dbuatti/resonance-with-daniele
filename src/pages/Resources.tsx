"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess } from "@/utils/toast"; // Assuming you have a toast utility

const Resources: React.FC = () => {
  const { user } = useSession();

  const handleAddResource = () => {
    showSuccess("Add Resource functionality coming soon!");
    // In a real app, this would open a dialog or navigate to a form
  };

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-4xl font-bold text-center font-lora animate-fade-in-up">Choir Resources</h1>
      <p className="text-lg text-center text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        This is where you'll find all the sheet music, practice tracks, and other materials I've prepared for the choir.
      </p>

      <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {user ? ( // Only show "Add New Resource" button if user is logged in
          <Button onClick={handleAddResource}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
          </Button>
        ) : (
          <p className="text-md text-muted-foreground">Log in to access more resources and features.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="font-lora">Sheet Music</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Upload and organise all your sheet music here.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="font-lora">Practice Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Share audio tracks for members to practice with.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="font-lora">Rehearsal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Keep track of important notes from rehearsals.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resources;