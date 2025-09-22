"use client";

import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Resources: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6 py-8"> {/* Added vertical padding */}
        <h1 className="text-4xl font-bold text-center">Choir Resources</h1>
        <p className="text-lg text-center text-muted-foreground">
          This is where you'll find all the sheet music, practice tracks, and other materials for the choir.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Sheet Music</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Upload and organise all your sheet music here.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Practice Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Share audio tracks for members to practice with.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Rehearsal Notes</CardTitle>
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