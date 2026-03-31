"use client"
import { App, } from "konsta/react"

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    return <App theme="ios">
        {children}
    </App>
}