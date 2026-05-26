import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Track from "@/pages/public/Track";

import Dashboard from "@/pages/user/Dashboard";
import Complaints from "@/pages/user/Complaints";
import ComplaintNew from "@/pages/user/ComplaintNew";
import ComplaintDetail from "@/pages/user/ComplaintDetail";
import Profile from "@/pages/user/Profile";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminComplaints from "@/pages/admin/Complaints";
import AdminUsers from "@/pages/admin/Users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <AppLayout><Component {...rest} /></AppLayout>;
}

function AdminRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to="/dashboard" />;
  return <AppLayout><Component {...rest} /></AppLayout>;
}

function Home() {
  const { isAuthenticated } = useAuth();
  return <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/track" component={Track} />
      
      {/* User Routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/complaints" component={() => <ProtectedRoute component={Complaints} />} />
      <Route path="/complaints/new" component={() => <ProtectedRoute component={ComplaintNew} />} />
      <Route path="/complaints/:id" component={() => <ProtectedRoute component={ComplaintDetail} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/complaints" component={() => <AdminRoute component={AdminComplaints} />} />
      <Route path="/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRouter />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
