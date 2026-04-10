"use client";

import React from "react";
import SongSuggestionForm from "@/components/dashboard/SongSuggestionForm";
import SongVotingList from "@/components/dashboard/SongVotingList";
import BackButton from "@/components/ui/BackButton";

const SongSuggestionsPage: React.FC = () => {
  return (
    <div className="py-8 space-y-12">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Song Suggestions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Suggest new songs for the choir to learn and vote on your favorites!
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <SongVotingList />
        </div>
        
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <SongSuggestionForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongSuggestionsPage;