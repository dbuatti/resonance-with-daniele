import { lazy, Suspense, type ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider } from "./integrations/supabase/auth";
import Layout from "./components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoadingFallback from "./components/PageLoadingFallback";

// Eagerly-loaded foundation pages (first paint / navigation-critical).
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazily-loaded routes — keeps the initial bundle small.
const Resources = lazy(() => import("./pages/Resources"));
const Events = lazy(() => import("./pages/Events"));
const Login = lazy(() => import("./pages/Login"));
const AdminZone = lazy(() => import("./pages/AdminZone"));
const AdminEventWorkbench = lazy(() => import("./pages/AdminEventWorkbench"));
const AdminPeopleHub = lazy(() => import("./pages/AdminPeopleHub"));
const AdminInbox = lazy(() => import("./pages/AdminInbox"));
const AdminRepertoireZone = lazy(() => import("./pages/AdminRepertoireZone"));
const CurrentEventPage = lazy(() => import("./pages/CurrentEventPage"));
const EventFeedback = lazy(() => import("./pages/EventFeedback"));
const SessionHub = lazy(() => import("./pages/SessionHub"));
const ProfileLayoutPage = lazy(() => import("./pages/ProfileLayoutPage"));
const ProfileDetails = lazy(() => import("./components/profile/ProfileDetails"));
const SurveyPage = lazy(() => import("./pages/SurveyPage"));
const LearnMore = lazy(() => import("./pages/LearnMore"));
const SongSuggestionsPage = lazy(() => import("./pages/SongSuggestionsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Wraps a page in the shared chrome (Layout) and its own Suspense boundary, so
 * navigating between lazily-loaded routes only swaps the page content — the
 * sidebar/nav stay mounted instead of flashing out and back in.
 */
const Page = ({ children }: { children: ReactNode }) => (
  <Layout>
    <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary>
            <SessionContextProvider>
              <Routes>
                <Route path="/" element={<Page><Index /></Page>} />
                <Route path="/resources" element={<Page><Resources /></Page>} />
                <Route path="/sessions" element={<Page><SessionHub /></Page>} />
                <Route path="/events" element={<Page><Events /></Page>} />
                <Route path="/login" element={<Page><Login /></Page>} />
                <Route path="/current-event" element={<Page><CurrentEventPage /></Page>} />
                <Route path="/learn-more" element={<Page><LearnMore /></Page>} />
                <Route path="/song-suggestions" element={<Page><SongSuggestionsPage /></Page>} />
                <Route path="/feedback" element={<Page><EventFeedback /></Page>} />

                <Route path="/profile" element={<Page><ProfileLayoutPage /></Page>}>
                  <Route
                    index
                    element={
                      <Suspense fallback={<PageLoadingFallback label="Loading profile..." />}>
                        <ProfileDetails />
                      </Suspense>
                    }
                  />
                  <Route
                    path="survey"
                    element={
                      <Suspense fallback={<PageLoadingFallback label="Loading survey..." />}>
                        <SurveyPage />
                      </Suspense>
                    }
                  />
                </Route>

                <Route path="/admin" element={<Page><AdminZone /></Page>} />
                <Route path="/admin/events" element={<Page><AdminEventWorkbench /></Page>} />
                <Route path="/admin/events/:id" element={<Page><AdminEventWorkbench /></Page>} />
                <Route path="/admin/people" element={<Page><AdminPeopleHub /></Page>} />
                <Route path="/admin/inbox" element={<Page><AdminInbox /></Page>} />
                <Route path="/admin/repertoire" element={<Page><AdminRepertoireZone /></Page>} />

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

                <Route path="*" element={<Page><NotFound /></Page>} />
              </Routes>
            </SessionContextProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
