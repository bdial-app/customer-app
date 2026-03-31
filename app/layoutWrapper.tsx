"use client"
import { App, Navbar } from "konsta/react"

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    return <App>
        <Navbar title="My App" />
        {children}
    </App>
}