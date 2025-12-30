import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-provider";
import { CustomBanner } from "@/components/custom-banner";
import Dashboard from "@/pages/dashboard";
import Demo from "@/pages/demo";
import Test from "@/pages/test";
import NotFound from "@/pages/not-found";
import ResetPassword from "@/pages/reset-password";
import StatsPage from "@/pages/stats";
import VoiceRemindersPage from "@/pages/voice-reminders";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/demo" component={Demo} />
      <Route path="/test" component={Test} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/voice-reminders" component={VoiceRemindersPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <CustomBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;