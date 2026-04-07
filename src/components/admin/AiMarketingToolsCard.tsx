"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink, Sparkles, MessageSquare } from "lucide-react";

const AiMarketingToolsCard: React.FC = () => {
  const tools = [
    {
      name: "Claude AI (Marketing)",
      url: "https://claude.ai/chat/db2ec2c5-2e7b-4758-a1d0-3539837eefbc",
      description: "Best for copywriting and tone of voice.",
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      name: "Gemini AI (Strategy)",
      url: "https://gemini.google.com/app/10a491e5fa44a97f",
      description: "Best for data analysis and planning.",
      icon: <Sparkles className="h-4 w-4" />
    }
  ];

  return (
    <Card className="shadow-lg rounded-2xl border-none bg-card hover:shadow-xl transition-all duration-300 group">
      <CardHeader>
        <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold font-lora">AI Marketing Assistants</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Quick access to your custom AI marketing chats for safe keeping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tools.map((tool, i) => (
          <Button 
            key={i} 
            variant="outline" 
            className="w-full justify-between h-auto py-3 px-4 rounded-xl border-primary/10 hover:bg-primary/5 hover:border-primary/30 group/btn"
            asChild
          >
            <a href={tool.url} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg group-hover/btn:bg-primary/10 transition-colors">
                  {tool.icon}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{tool.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/btn:text-primary transition-colors" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default AiMarketingToolsCard;