import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { StoreProvider, useStore } from "@/lib/store";
import { Shell } from "@/components/handler/Shell";
import Login from "@/pages/Login";
import Intake from "@/pages/Intake";
import Custody from "@/pages/Custody";
import Release from "@/pages/Release";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function AuthedRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={() => <Redirect to="/intake" />} />
        <Route path="/intake" component={Intake} />
        <Route path="/custody" component={Custody} />
        <Route path="/release" component={Release} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function Gate() {
  const { session } = useStore();
  if (!session) return <Login />;
  return <AuthedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Gate />
          </WouterRouter>
        </StoreProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
