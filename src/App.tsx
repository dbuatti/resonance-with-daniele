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
import AdminInterestSubmissions from "./pages/AdminInterestSubmissions";
import AdminAnnouncementsPage from "./pages/AdminAnnouncementsPage";
import AdminIssueReportsPage from "./pages/AdminIssueReportsPage";
import AdminMarketingDashboard from "./pages/AdminMarketingDashboard";
import AdminMarketingPlanPage from "./pages/AdminMarketingPlanPage";
import AdminGrowthStrategy from "./pages/AdminGrowthStrategy";
import AdminEventFeedback from "./pages/AdminEventFeedback";
import AdminSessionHubGuide from "./pages/AdminSessionHubGuide";
import AdminEventWizard from "./pages/AdminEventWizard";
import AdminEventCommandCenter from "./pages/AdminEventCommandCenter";
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
              <Route path="/admin/members" element={<Layout><AdminMembers /></Layout>} />
              <Route path="/admin/survey-data" element={<Layout><AdminSurveyData /></Layout>} />
              <Route path="/admin/interest-submissions" element={<Layout><AdminInterestSubmissions /></Layout>} />
              <Route path="/admin/announcements" element={<Layout><AdminAnnouncementsPage /></Layout>} />
              <Route path="/admin/issue-reports" element={<Layout><AdminIssueReportsPage /></Layout>} />
              <Route path="/admin/marketing" element={<Layout><AdminMarketingDashboard /></Layout>} />
              <Route path="/admin/marketing-plan" element={<Layout><AdminMarketingPlanPage /></Layout>} />
              <Route path="/admin/growth" element={<Layout><AdminGrowthStrategy /></Layout>} />
              <Route path="/admin/feedback" element={<Layout><AdminEventFeedback /></Layout>} />
              <Route path="/admin/session-hub-guide" element={<Layout><AdminSessionHubGuide /></Layout>} />
              <Route path="/admin/events/new" element={<Layout><AdminEventWizard /></Layout>} />
              <Route path="/admin/events/:id" element={<Layout><AdminEventCommandCenter /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;