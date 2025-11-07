"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const SetupChecklistCard: React.FC = () => {
  const { user, loading, isProfileCompleted, isSurveyCompleted, incompleteTasksCount } = useSession();

  if (loading || !user) {
    return null; // Hide if loading or not logged in
  }

  if (incompleteTasksCount === 0) {
    return (
      <Card className="bg-green-50/50 border-l-4 border-green-600 p-6 shadow-md rounded-xl dark:bg-green-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-2">
          <CardTitle className="text-xl font-lora flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" /> Setup Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground">
          You're all set! You have full access to all choir features and personalized resources.
        </CardContent>
      </Card>
    );
  }

  const totalTasks = 2;
  const completedTasks = totalTasks - incompleteTasksCount;
  const progressValue = (completedTasks / totalTasks) * 100;

  return (
    <Card className="bg-yellow-50/50 border-l-4 border-yellow-600 p-6 shadow-md rounded-xl dark:bg-yellow-900/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
        <CardTitle className="text-xl font-lora flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <ClipboardList className="h-6 w-6" /> Setup Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Your Progress: {completedTasks} of {totalTasks} steps complete
          </p>
          <Progress value={progressValue} className="h-2 bg-yellow-200 dark:bg-yellow-800" />
        </div>

        <div className="space-y-3">
          {/* Profile Task */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfileCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <User className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={cn("text-base", isProfileCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
                Complete Profile Details
              </span>
            </div>
            {!isProfileCompleted && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/profile">Go to Profile</Link>
              </Button>
            )}
          </div>

          {/* Survey Task */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSurveyCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <ClipboardList className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={cn("text-base", isSurveyCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
                Complete Practice Survey
              </span>
            </div>
            {!isSurveyCompleted && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/profile/survey">Go to Survey</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupChecklistCard;