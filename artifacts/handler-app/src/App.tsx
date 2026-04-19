import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { StoreProvider, useStore } from "@/lib/store";
import { Shell } from "@/components/handler/Shell";
import VenuePicker from "@/pages/VenuePicker";
import Intake from "@/pages/Intake";
import Custody from "@/pages/Custody";
import Release from "@/pages/Release";
import Settings from "@/pages/Settings";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient();

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#C6F24E",
    colorBackground: "#0B0F19",
    colorInputBackground: "rgba(11,15,25,0.6)",
    colorText: "hsl(210, 40%, 98%)",
    colorTextSecondary: "hsl(215, 20%, 65%)",
    colorInputText: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(215, 20%, 65%)",
    borderRadius: "0.875rem",
    fontFamily: "Inter, system-ui, sans-serif",
    fontFamilyButtons: "Inter, system-ui, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "rounded-3xl w-full overflow-hidden border border-white/10 bg-steel/40 backdrop-blur-md shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(210, 40%, 98%)", fontWeight: 800 },
    headerSubtitle: { color: "hsl(215, 20%, 75%)" },
    socialButtonsBlockButtonText: { color: "hsl(210, 40%, 98%)" },
    formFieldLabel: { color: "hsl(215, 20%, 75%)" },
    footerActionLink: { color: "#C6F24E" },
    footerActionText: { color: "hsl(215, 20%, 75%)" },
    dividerText: { color: "hsl(215, 20%, 65%)" },
    identityPreviewEditButton: { color: "#C6F24E" },
    formFieldSuccessText: { color: "#C6F24E" },
    alertText: { color: "hsl(0, 90%, 80%)" },
    logoBox: "mb-4",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "!border-white/10 !bg-obsidian/40 hover:!bg-obsidian/60",
    formButtonPrimary:
      "!bg-lime !text-obsidian hover:!bg-lime-hover !font-bold",
    formFieldInput:
      "!bg-obsidian/60 !border-white/10 !text-white placeholder:!text-slate",
    footerAction: "",
    dividerLine: "!bg-white/10",
    alert: "!bg-red-500/10 !border-red-500/30",
    otpCodeFieldInput: "!bg-obsidian/60 !border-white/10 !text-white",
    formFieldRow: "",
    main: "",
  },
};

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-obsidian text-paper font-sans bg-gradient-mesh flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/intake`}
      />
    </AuthShell>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/intake`}
      />
    </AuthShell>
  );
}

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
  const { ready, signedIn, session, venues } = useStore();
  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-obsidian text-slate font-mono text-sm">
        Loading…
      </div>
    );
  }
  if (!signedIn) return <Redirect to="/sign-in" />;
  if (!session || venues.length === 0) return <VenuePicker />;
  return <AuthedRoutes />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Handler sign-in",
            subtitle: "Sign in to open a custody shift",
          },
        },
        signUp: {
          start: {
            title: "Create a handler account",
            subtitle: "Get added to your venue and start tagging items",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <StoreProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route>
              {/* Anything else: gate decides between sign-in redirect, venue picker, and the app */}
              <Show when="signed-in">
                <Gate />
              </Show>
              <Show when="signed-out">
                <Redirect to="/sign-in" />
              </Show>
            </Route>
          </Switch>
        </StoreProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
