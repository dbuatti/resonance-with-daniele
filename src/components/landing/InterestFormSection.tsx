"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const interestFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  mobile: z.string().optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

type InterestFormData = z.infer<typeof interestFormSchema>;

const InterestFormSection: React.FC = () => {
  const form = useForm<InterestFormData>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      mobile: "",
      email: "",
    },
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (data: InterestFormData) => {
    try {
      const { error } = await supabase.from("interest_submissions").insert({
        first_name: data.first_name,
        last_name: data.last_name,
        mobile: data.mobile || null,
        email: data.email,
      });

      if (error) {
        if (error.code === '23505') { // Unique violation code
          showError("You've already expressed interest with this email!");
        } else {
          console.error("Error submitting interest form:", error);
          showError("Failed to submit interest. Please try again.");
        }
      } else {
        showSuccess("Thank you for your interest! We'll be in touch.");
        form.reset();
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Unexpected error during interest form submission:", error);
      showError("An unexpected error occurred: " + error.message);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-16 md:py-24 bg-muted text-foreground">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-6 md:p-8 shadow-lg rounded-xl text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold font-lora">Thank You!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Your interest has been recorded. We'll reach out to you soon with more details about Resonance with Daniele.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">In the meantime, feel free to explore the rest of the site!</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-muted text-foreground">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-6 md:p-8 shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-lora">Stay Up-to-Date on the Choir!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Express your interest to receive updates on upcoming sessions, events, and news.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Mobile (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="04XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full md:col-span-2 mt-4" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Express My Interest"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default InterestFormSection;