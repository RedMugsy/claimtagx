import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

// No-op if no PostHog key OR no prior consent. CookieBanner enables it after Accept.
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
