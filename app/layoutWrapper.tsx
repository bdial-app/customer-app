"use client"
import { App, } from "konsta/react"
import { AppProvider } from "./context/AppContext"

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <AppProvider>
            <App theme="ios">
                {children}
            </App>
        </AppProvider>
    )
}