import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import Login from "./pages/Login";
import AdminZone from "./pages/AdminZone";
import AdminEventWorkbench from "./pages/AdminEventWorkbench";
import AdminPeopleHub from "./pages/AdminPeopleHub";
import AdminInbox from "./pages/AdminInbox";
import AdminRepertoireZone from "./pages/AdminRepertoireZone";
import CurrentEventPage from "./pages/CurrentEventPage";
import EventFeedback from "./pages/EventFeedback";
import SessionHub from "./pages/SessionHub";
import { SessionContextProvider } from "./integrations/supabase/auth";
import Layout from "./components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import ScrollToTop from "./components/ScrollToTop";

import ProfileLayoutPage from "./pages/ProfileLayoutPage";
import ProfileDetails from "./components/profile/ProfileDetails";
import SurveyPage from "./pages/SurveyPage";
import LearnMore from "./pages/LearnMore";
import SongSuggestionsPage from "./pages/SongSuggestionsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <ScrollToTop />
          <SessionContextProvider>
            <Routes>
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/resources" element={<Layout><Resources /></Layout>} />
              <Route path="/sessions" element={<Layout><SessionHub /></Layout>} />
              <Route path="/events" element={<Layout><Events /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/current-event" element={<Layout><CurrentEventPage /></Layout>} />
              <Route path="/learn-more" element={<Layout><LearnMore /></Layout>} />
              <Route path="/song-suggestions" element={<Layout><SongSuggestionsPage /></Layout>} />
              <Route path="/feedback" element={<Layout><EventFeedback /></Layout>} />

              <Route path="/profile" element={<Layout><ProfileLayoutPage /></Layout>}>
                <Route index element={<ProfileDetails />} />
                <Route path="survey" element={<SurveyPage />} />
              </Route>

              <Route path="/admin" element={<Layout><AdminZone /></Layout>} />
              <Route path="/admin/events" element={<Layout><AdminEventWorkbench /></Layout>} />
              <Route path="/admin/events/:id" element={<Layout><AdminEventWorkbench /></Layout>} />
              <Route path="/admin/people" element={<Layout><AdminPeopleHub /></Layout>} />
              <Route path="/admin/inbox" element={<Layout><AdminInbox /></Layout>} />
              <Route path="/admin/repertoire" element={<Layout><AdminRepertoireZone /></Layout>} />

              {/* Retired routes → redirects */}
              <Route path="/admin/marketing" element={<Navigate to="/admin/events" replace />} />
              <Route path="/admin/marketing-plan" element={<Navigate to="/admin/events" replace />} />
              <Route path="/admin/events/new" element={<Navigate to="/admin/events?new=1" replace />} />
              <Route path="/admin/members" element={<Navigate to="/admin/people" replace />} />
              <Route path="/admin/survey-data" element={<Navigate to="/admin/people?tab=survey" replace />} />
              <Route path="/admin/interest-submissions" element={<Navigate to="/admin/people?tab=leads" replace />} />
              <Route path="/admin/announcements" element={<Navigate to="/admin/inbox" replace />} />
              <Route path="/admin/issue-reports" element={<Navigate to="/admin/inbox?tab=issue-reports" replace />} />
              <Route path="/admin/feedback" element={<Navigate to="/admin/events" replace />} />
              <Route path="/admin/growth" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/june-poll" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/session-hub-guide" element={<Navigate to="/admin" replace />} />

              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;