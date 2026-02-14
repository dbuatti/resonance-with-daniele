"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, ClipboardList, ArrowRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const SetupChecklistCard: React.FC = () => {
  const { user, loading, isProfileCompleted, isSurveyCompleted, incompleteTasksCount } = useSession();

  if (loading || !user) return null;

  const totalTasks = 2;
  const completedTasks = totalTasks - incompleteTasksCount;
  const progressValue = (completedTasks / totalTasks) * 100;

  if (incompleteTasksCount === 0) {
    return (
      <Card className="bg-green-500/10 border-none shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-full text-white shadow-lg shadow-green-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-green-700 dark:text-green-400">Setup Complete!</h3>
            <p className="text-sm text-green-600/80 dark:text-green-400/60">You're all set to enjoy the full choir experience.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-none bg-primary/5 dark:bg-primary/10 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-lora flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Getting Started
          </CardTitle>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            {completedTasks}/{totalTasks} Done
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={progressValue} className="h-2 bg-primary/10" />
        </div>

        <div className="space-y-3">
          {/* Profile Task */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-xl transition-colors",
            isProfileCompleted ? "bg-muted/50" : "bg-background shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              {isProfileCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isProfileCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                Complete Profile
              </span>
            </div>
            {!isProfileCompleted && (
              <Button variant="ghost" size="sm" className="h-8 text-primary font-bold group" asChild>
                <Link to="/profile">
                  Start <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Survey Task */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-xl transition-colors",
            isSurveyCompleted ? "bg-muted/50" : "bg-background shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              {isSurveyCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isSurveyCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                Take Member Survey
              </span>
            </div>
            {!isSurveyCompleted && (
              <Button variant="ghost" size="sm" className="h-8 text-primary font-bold group" asChild>
                <Link to="/profile/survey">
                  Start <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupChecklistCard;