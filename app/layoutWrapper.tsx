"use client";
import { App } from "konsta/react";
import { AppProvider } from "./context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { NotificationProvider } from "./context/NotificationContext";
import { AppToast } from "./components/app-toast";
import { hydrateAuth } from "@/store/slices/authSlice";

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <NotificationProvider>
            <App theme="ios">
              <AppToast />
              {children}
            </App>
          </NotificationProvider>
        </AppProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};
