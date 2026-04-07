"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { parse, isValid, isBefore, startOfDay } from "date-fns";

interface LegacyFeedbackImporterProps {
  eventId: string;
}

const LegacyFeedbackImporter: React.FC<LegacyFeedbackImporterProps> = ({ eventId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all events to allow intelligent matching
  const { data: allEvents } = useQuery({
    queryKey: ["allEventsForMatching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, date, title")
        .order("date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const parseLegacyDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    const standardDate = new Date(dateStr);
    if (isValid(standardDate)) return standardDate.toISOString();

    const formats = [
      "dd/MM/yyyy HH:mm:ss",
      "yyyy/MM/dd HH:mm:ss",
      "dd/MM/yyyy h:mm:ss a",
      "M/d/yyyy H:mm:ss",
    ];

    for (const fmt of formats) {
      const parsed = parse(dateStr.split(' GMT')[0], fmt, new Date());
      if (isValid(parsed)) return parsed.toISOString();
    }
    return new Date().toISOString();
  };

  // Helper to find the event that happened on or most recently before the feedback
  const findMatchingEventId = (timestamp: string): string => {
    if (!allEvents || allEvents.length === 0) return eventId;

    const feedbackDate = new Date(timestamp);
    
    // Filter for events that happened on or before the feedback date
    const possibleEvents = allEvents
      .filter(e => {
        const eventDate = new Date(e.date);
        return startOfDay(eventDate) <= startOfDay(feedbackDate);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return the most recent one, or fallback to the currently selected event
    return possibleEvents[0]?.id || eventId;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error("CSV file is empty");

        const parseCSVLine = (line: string) => {
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
          return values.map(val => val?.replace(/^"|"$/g, "").trim() || "");
        };

        const headers = parseCSVLine(lines[0]);
        
        const h = {
          timestamp: headers.findIndex(h => h.toLowerCase().includes("timestamp")),
          feeling: headers.findIndex(h => h.includes("How did the session feel")),
          enjoyed: headers.findIndex(h => h.includes("What did you enjoy most")),
          improvements: headers.findIndex(h => h.includes("What could be improved")),
          timeSlot: headers.findIndex(h => h.includes("10am–1pm time slot")),
          repertoire: headers.findIndex(h => h.includes("repertoire would you enjoy")),
          price: headers.findIndex(h => h.includes("price point feels right")),
          nextMonth: headers.findIndex(h => h.includes("another session in")),
          bestTimes: headers.findIndex(h => h.includes("times generally work best")),
          regular: headers.findIndex(h => h.includes("attending Resonance regularly")),
          frequency: headers.findIndex(h => h.includes("How often would you attend")),
          score: headers.findIndex(h => h.includes("recommend this session")),
          comments: headers.findIndex(h => h.includes("Anything else you’d like to share")),
          howHeard: headers.findIndex(h => h.includes("How did you hear")),
        };

        const feedbackToInsert = lines.slice(1)
          .filter(line => line.trim() !== "")
          .map(line => {
            const v = parseCSVLine(line);
            const timestamp = parseLegacyDate(v[h.timestamp]);
            const matchedEventId = findMatchingEventId(timestamp);
            
            const nextMonthArr = v[h.nextMonth] ? v[h.nextMonth].split(",").map(s => s.trim()) : [];
            const bestTimesArr = v[h.bestTimes] ? v[h.bestTimes].split(",").map(s => s.trim()) : [];

            return {
              event_id: matchedEventId,
              user_id: null,
              overall_feeling: v[h.feeling] || "Neutral",
              enjoyed_most: v[h.enjoyed] || "",
              improvements: v[h.improvements] || null,
              time_slot_rating: v[h.timeSlot] || "Perfect",
              future_repertoire: v[h.repertoire] || null,
              price_point: v[h.price] || "Other",
              interest_next_month: nextMonthArr,
              best_times_ongoing: bestTimesArr,
              regular_attendance_interest: v[h.regular] || "Maybe",
              attendance_frequency: v[h.frequency] || "Occasionally",
              recommend_score: parseInt(v[h.score]) || 10,
              how_heard: v[h.howHeard] || null,
              additional_comments: v[h.comments] || null,
              created_at: timestamp,
            };
          });

        const { error } = await supabase.from("event_feedback").insert(feedbackToInsert);
        if (error) throw error;

        showSuccess(`Successfully imported ${feedbackToInsert.length} responses and matched them to events!`);
        queryClient.invalidateQueries({ queryKey: ["eventFeedbackData"] });
        queryClient.invalidateQueries({ queryKey: ["adminDashboardCounts"] });
        setIsOpen(false);
      } catch (err: any) {
        console.error("Import error:", err);
        showError("Failed to import CSV: " + err.message);
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  }, [eventId, queryClient, allEvents]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl font-bold border-primary/20 text-primary">
          <Upload className="mr-2 h-4 w-4" /> Import Legacy CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-lora">Intelligent Feedback Importer</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3 border border-primary/10">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This importer will automatically match each response to the correct event based on the date it was submitted.
            </p>
          </div>
          <div
            {...getRootProps()}
            className={`border-4 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40"
            }`}
          >
            <input {...getInputProps()} />
            {isImporting ? (
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            ) : (
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            )}
            <p className="text-lg font-bold mt-4">
              {isDragActive ? "Drop the CSV here" : "Drag & drop Google Forms CSV"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Only .csv files from your Google Form are supported.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegacyFeedbackImporter;