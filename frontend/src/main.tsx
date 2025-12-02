import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./lib/wagmi";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

// Suppress non-critical browser extension errors
if (typeof window !== 'undefined') {
  // Catch and suppress authorization errors from browser extensions
  const originalError = window.console.error;
  window.console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    // Suppress common browser extension authorization errors
    if (
      errorMessage.includes('has not been authorized yet') ||
      errorMessage.includes('source') && errorMessage.includes('authorized')
    ) {
      // Silently ignore these extension-related errors
      return;
    }
    // Log other errors normally
    originalError.apply(console, args);
  };

  // Also catch unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.toString() || '';
    if (
      errorMessage.includes('has not been authorized yet') ||
      errorMessage.includes('source') && errorMessage.includes('authorized')
    ) {
      // Prevent these extension errors from showing in console
      event.preventDefault();
      return;
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);
