"use client"
import { App, Navbar } from "konsta/react"
import { NextIntlClientProvider } from "next-intl";
import { AbstractIntlMessages } from "next-intl";

export const LayoutWrapper = ({ 
  children, 
  locale, 
  messages 
}: { 
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) => {
  return <NextIntlClientProvider locale={locale} messages={messages}>
        <App>
            <Navbar title="My App" />
            {children}
        </App>
    </NextIntlClientProvider>
}