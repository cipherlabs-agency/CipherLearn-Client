"use client"

import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { DashboardDock } from "@/components/layout/DashboardDock"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { isTokenExpired, checkAndClearExpiredToken } from "@/redux/slices/auth/authSlice"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

import { DockPreferencesProvider } from "@/context/DockPreferencesContext"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { token, tokenExpiry } = useAppSelector((state) => state.auth)
    const dispatch = useAppDispatch()
    const router = useRouter()
    const [isClient, setIsClient] = useState(false)

    const handleExpiredToken = useCallback(() => {
        dispatch(checkAndClearExpiredToken())
        router.push("/login")
    }, [dispatch, router])

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (isClient) {
            if (!token || isTokenExpired(token)) {
                handleExpiredToken()
            }
        }
    }, [isClient, token, handleExpiredToken])

    useEffect(() => {
        if (!isClient || !token || !tokenExpiry) return

        const timeUntilExpiry = tokenExpiry - Date.now()

        if (timeUntilExpiry <= 0) {
            handleExpiredToken()
        }

        const timeoutId = setTimeout(() => {
            handleExpiredToken()
        }, timeUntilExpiry)

        return () => clearTimeout(timeoutId)
    }, [isClient, token, tokenExpiry, handleExpiredToken])

    useEffect(() => {
        if (!isClient || !token) return

        const intervalId = setInterval(() => {
            if (isTokenExpired(token)) {
                handleExpiredToken()
            }
        }, 60000)

        return () => clearInterval(intervalId)
    }, [isClient, token, handleExpiredToken])

    if (!isClient || !token || isTokenExpired(token)) {
        return null
    }

    return (
        <DockPreferencesProvider>
            <div className="flex min-h-screen w-full bg-background">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto pb-32">
                        <div className="p-5 md:p-7 max-w-[1600px] mx-auto animate-fade-in">
                            {children}
                        </div>
                    </main>
                </div>
                <DashboardDock />
            </div>
        </DockPreferencesProvider>
    )
}
