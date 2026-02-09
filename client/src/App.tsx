import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Pin from "@/pages/pin";
import Dashboard from "./pages/dashboard";
import DailyFigures from "./pages/daily-figures";
import CashingUp from "./pages/cashing-up";
import Bookkeeping from "./pages/bookkeeping";
import Reports from "./pages/reports";
import Documents from "./pages/documents";
import Admin from "./pages/admin";
import BonusPerformance from "./pages/bonus-performance";
import { AuthProvider, useAuth } from "@/state/auth";

function GuardedRoute(props: {
  path: string;
  component: React.ComponentType<any>;
  requirePin?: boolean;
}) {
  const { session } = useAuth();
  const Comp = props.component;

  if (!session.isAuthenticated) return <Redirect to="/login" />;
  if (props.requirePin !== false && !session.staffPinVerified)
    return <Redirect to="/pin" />;
  return <Route path={props.path} component={Comp} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/pin" component={Pin} />

      <GuardedRoute path="/" component={Dashboard} />
      <GuardedRoute path="/daily-figures" component={DailyFigures} />
      <GuardedRoute path="/cashing-up" component={CashingUp} />
      <GuardedRoute path="/bookkeeping" component={Bookkeeping} />
      <GuardedRoute path="/reports" component={Reports} />
      <GuardedRoute path="/documents" component={Documents} />
      <GuardedRoute path="/admin" component={Admin} />
      <GuardedRoute path="/bonus-performance" component={BonusPerformance} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
