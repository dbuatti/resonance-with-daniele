import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import Login from "./pages/Login";
import AdminZone from "./pages/AdminZone";
import AdminMembers from "./pages/AdminMembers";
import AdminSurveyData from "./pages/AdminSurveyData";
import { SessionContextProvider } from "./integrations/supabase/auth";
import Layout from "./components/Layout";

// New imports for profile and survey separation
import ProfileLayoutPage from "./pages/ProfileLayoutPage"; // The new parent for profile routes
import ProfileDetails from "./components/profile/ProfileDetails"; // Renamed Profile component
import SurveyPage from "./pages/SurveyPage"; // The new survey page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/resources" element={<Layout><Resources /></Layout>} />
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            
            {/* Nested routes for Profile and Survey */}
            <Route path="/profile" element={<Layout><ProfileLayoutPage /></Layout>}>
              <Route index element={<ProfileDetails />} /> {/* Default child route for /profile */}
              <Route path="survey" element={<SurveyPage />} /> {/* Route for /profile/survey */}
            </Route>

            <Route path="/admin" element={<Layout><AdminZone /></Layout>} />
            <Route path="/admin/members" element={<Layout><AdminMembers /></Layout>} />
            <Route path="/admin/survey-data" element={<Layout><AdminSurveyData /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;