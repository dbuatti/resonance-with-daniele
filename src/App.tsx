import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } = from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import Login from "./pages/Login";
import { SessionContextProvider } from "./integrations/supabase/auth";
import React from "react"; // Import React for Fragment

const queryClient = new QueryClient();

const App = () => (
  <React.Fragment> {/* This Fragment is the single element returned by the App component */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider> {/* TooltipProvider is the single child of QueryClientProvider */}
        <BrowserRouter> {/* BrowserRouter is the single child of TooltipProvider */}
          <SessionContextProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/resources" element={<Resources />} />
              <Route path="/events" element={<Events />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    {/* Toaster and Sonner are now siblings to the entire provider chain, at the top level */}
    <Toaster />
    <Sonner />
  </React.Fragment>
);

export default App;