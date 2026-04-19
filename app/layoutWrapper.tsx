"use client";
import { App } from "konsta/react";
import { AppProvider } from "./context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <App theme="ios">{children}</App>
        </AppProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};
