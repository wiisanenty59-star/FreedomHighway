import { AuthProvider } from "@/lib/auth";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MapPage from "@/pages/map";
import Locations from "@/pages/locations";
import LocationDetail from "@/pages/location-detail";
import LocationNew from "@/pages/location-new";
import Forum from "@/pages/forum";
import ForumCategory from "@/pages/forum-category";
import ForumThread from "@/pages/forum-thread";
import ForumNew from "@/pages/forum-new";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <ProtectedRoute>
          <Layout><Home /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/map">
        <ProtectedRoute>
          <Layout><MapPage /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/locations">
        <ProtectedRoute>
          <Layout><Locations /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/locations/new">
        <ProtectedRoute>
          <Layout><LocationNew /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/locations/:id">
        <ProtectedRoute>
          <Layout><LocationDetail /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/forum">
        <ProtectedRoute>
          <Layout><Forum /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/forum/new">
        <ProtectedRoute>
          <Layout><ForumNew /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/forum/:categorySlug">
        <ProtectedRoute>
          <Layout><ForumCategory /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/forum/thread/:id">
        <ProtectedRoute>
          <Layout><ForumThread /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <Layout><Admin /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile/:username">
        <ProtectedRoute>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
