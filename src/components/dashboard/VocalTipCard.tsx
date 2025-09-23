"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const vocalTips = [
  "Remember to warm up your voice for 5-10 minutes before singing!",
  "Stay hydrated! Water is your vocal cords' best friend.",
  "Practice mindful breathing. Inhale deeply from your diaphragm.",
  "Listen actively to other voices in the choir to blend better.",
  "Don't be afraid to make mistakes; they're part of learning!",
  "Sing with confidence, even if you feel unsure. Your voice is unique!",
  "Relax your jaw and shoulders to allow for a more open sound.",
  "Try humming gently to find your resonance before singing loudly.",
  "Record yourself singing and listen back to identify areas for improvement.",
  "Focus on the lyrics and emotion to connect with the song's story.",
];

const VocalTipCard: React.FC = () => {
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    // Get a random tip on component mount
    const randomIndex = Math.floor(Math.random() * vocalTips.length);
    setCurrentTip(vocalTips[randomIndex]);
  }, []);

  return (
    <Card className="shadow-lg rounded-xl border-l-4 border-accent">
      <CardHeader>
        <CardTitle className="text-xl font-lora flex items-center gap-2 text-accent-foreground">
          <Lightbulb className="h-6 w-6 text-accent" /> Vocal Tip of the Day
        </CardTitle>
        <CardDescription className="text-muted-foreground">A little something to help your singing journey.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base italic text-foreground">{currentTip}</p>
      </CardContent>
    </Card>
  );
};

export default VocalTipCard;