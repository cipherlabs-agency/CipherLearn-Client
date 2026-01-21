"use client"

import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { isTokenExpired, checkAndClearExpiredToken } from "@/redux/slices/auth/authSlice"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

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

    // Wait for client-side hydration to complete
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Check token on mount and redirect if expired
    useEffect(() => {
        if (isClient) {
            if (!token || isTokenExpired(token)) {
                handleExpiredToken()
            }
        }
    }, [isClient, token, handleExpiredToken])

    // Set up automatic redirect when token expires
    useEffect(() => {
        if (!isClient || !token || !tokenExpiry) return

        const timeUntilExpiry = tokenExpiry - Date.now()

        // If already expired, redirect immediately
        if (timeUntilExpiry <= 0) {
            handleExpiredToken()
            return
        }

        // Set timeout to redirect when token expires
        const timeoutId = setTimeout(() => {
            handleExpiredToken()
        }, timeUntilExpiry)

        return () => clearTimeout(timeoutId)
    }, [isClient, token, tokenExpiry, handleExpiredToken])

    // Periodic check every minute for token expiration
    useEffect(() => {
        if (!isClient || !token) return

        const intervalId = setInterval(() => {
            if (isTokenExpired(token)) {
                handleExpiredToken()
            }
        }, 60000) // Check every minute

        return () => clearInterval(intervalId)
    }, [isClient, token, handleExpiredToken])

    // Show nothing until client-side hydration is complete
    if (!isClient || !token || isTokenExpired(token)) {
        return null
    }

    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
