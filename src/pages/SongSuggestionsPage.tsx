"use client";

import React from "react";
import SongSuggestionForm from "@/components/dashboard/SongSuggestionForm";
import SongVotingList from "@/components/dashboard/SongVotingList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SongSuggestionsPage: React.FC = () => {
  return (
    <div className="py-8 md:py-12 space-y-8 px-4">
      <h1 className="text-4xl font-bold text-center font-lora">Song Suggestions & Voting</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Suggest new songs for the choir to learn and vote on your favorites!
      </p>
      <div className="max-w-4xl mx-auto space-y-6"> {/* Changed to a single column layout */}
        <SongVotingList /> {/* This will now be the main, large card at the top */}
        <SongSuggestionForm /> {/* This will be directly below it */}
      </div>
    </div>
  );
};

export default SongSuggestionsPage;