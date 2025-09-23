"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VoiceTypeSelectorProps {
  value: string[] | null;
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const voiceTypes = [
  { name: "Soprano", color: "bg-pink-500 hover:bg-pink-600" },
  { name: "Alto", color: "bg-purple-500 hover:bg-purple-600" },
  { name: "Tenor", color: "bg-blue-500 hover:bg-blue-600" },
  { name: "Bass", color: "bg-green-500 hover:bg-green-600" },
  { name: "Transitioning", color: "bg-yellow-500 hover:bg-yellow-600" },
  { name: "Unsure", color: "bg-gray-500 hover:bg-gray-600" },
  { name: "Flexible", color: "bg-indigo-500 hover:bg-indigo-600" },
];

const VoiceTypeSelector: React.FC<VoiceTypeSelectorProps> = ({ value, onChange, disabled }) => {
  const selectedVoiceTypes = value || [];

  const handleToggle = (voiceType: string) => {
    if (disabled) return;

    const newSelection = selectedVoiceTypes.includes(voiceType)
      ? selectedVoiceTypes.filter((v) => v !== voiceType)
      : [...selectedVoiceTypes, voiceType];
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Your Voice Type(s)
      </p>
      <div className="flex flex-wrap gap-2">
        {voiceTypes.map((type) => {
          const isSelected = selectedVoiceTypes.includes(type.name);
          return (
            <Button
              key={type.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleToggle(type.name)}
              disabled={disabled}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isSelected
                  ? `${type.color} text-white border-transparent shadow-md`
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSelected && <Check className="h-4 w-4 mr-2" />}
              {type.name}
            </Button>
          );
        })}
      </div>
      {selectedVoiceTypes.length === 0 && (
        <p className="text-xs text-muted-foreground">Select one or more voice types that describe your range.</p>
      )}
    </div>
  );
};

export default VoiceTypeSelector;