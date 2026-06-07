import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Logger } from "@/lib/logger";

// Register global listeners for unhandled errors
window.addEventListener("error", (event) => {
  // Ignore script loading errors without specific error objects (usually third-party scripts/extensions)
  if (!event.error && event.message === "Script error.") return;
  
  Logger.error(event.error || new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const errorObj = reason instanceof Error ? reason : new Error(String(reason));
  
  Logger.error(errorObj, {
    info: "Unhandled promise rejection",
    reason: typeof reason === "object" ? JSON.stringify(reason) : String(reason),
  });
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

