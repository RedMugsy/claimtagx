import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import PricingPage from "@/pages/Pricing";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import GDPR from "@/pages/legal/GDPR";
import DPA from "@/pages/legal/DPA";
import Cookies from "@/pages/legal/Cookies";
import AUP from "@/pages/legal/AUP";
import Refund from "@/pages/legal/Refund";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/price" component={PricingPage} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/gdpr" component={GDPR} />
      <Route path="/dpa" component={DPA} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/aup" component={AUP} />
      <Route path="/refund" component={Refund} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="flex min-h-screen flex-col bg-obsidian text-paper font-sans">
            <Nav />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <CookieBanner />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
