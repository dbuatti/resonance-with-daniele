"use client";

import React from "react";
import SongSuggestionForm from "@/components/dashboard/SongSuggestionForm";
import SongVotingList from "@/components/dashboard/SongVotingList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SongSuggestionsPage: React.FC = () => {
  return (
    <div className="py-8 md:py-12 space-y-8">
      <h1 className="text-4xl font-bold text-center font-lora">Song Suggestions & Voting</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Suggest new songs for the choir to learn and vote on your favorites!
      </p>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Song Voting List (Takes 2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <SongVotingList />
        </div>
        
        {/* Song Suggestion Form (Takes 1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <SongSuggestionForm />
        </div>
      </div>
    </div>
  );
};

export default SongSuggestionsPage;