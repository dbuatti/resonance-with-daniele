"use client";

import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Resources: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6 py-8">
        <h1 className="text-4xl font-bold text-center font-lora animate-fade-in-up">Choir Resources</h1>
        <p className="text-lg text-center text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          This is where you'll find all the sheet music, practice tracks, and other materials I've prepared for the choir.
        </p>

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
    </Layout>
  );
};

export default Resources;