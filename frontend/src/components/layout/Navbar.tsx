"use client"

import { Bell, Search, Menu, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppSelector } from "@/redux/hooks"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
}

function getFormattedDate() {
    return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function Navbar() {
    const { user } = useAppSelector((state) => state.auth)
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const displayName = user?.name || "Teacher"
    const initials = getInitials(displayName)
    const greeting = getGreeting()
    const todayDate = getFormattedDate()

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex h-16 items-center px-5 gap-4">

                {/* Left: Greeting section */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="text-[15px] font-semibold text-foreground leading-tight truncate">
                            {greeting}, <span className="text-primary">{displayName.split(" ")[0]}</span>
                        </span>
                        <span className="hidden sm:block text-xs text-muted-foreground font-medium">
                            {todayDate}
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <form className="hidden md:flex w-[220px]">
                        <Input
                            type="search"
                            placeholder="Search anything..."
                            className="h-9 text-[13px] bg-secondary border-border"
                            icon={<Search className="h-3.5 w-3.5" />}
                        />
                    </form>

                    {/* Mobile search button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
                    </Button>

                    {/* Theme toggle */}
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {theme === "dark"
                                ? <Sun className="h-4 w-4" />
                                : <Moon className="h-4 w-4" />
                            }
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    )}

                    {/* Notification bell */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <Bell className="h-4 w-4" />
                        {/* Notification dot */}
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent border-2 border-background" />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* Divider */}
                    <div className="h-5 w-px bg-border hidden sm:block" />

                    {/* User avatar */}
                    <Button
                        variant="ghost"
                        className="h-9 px-2 gap-2.5 hover:bg-secondary hidden sm:flex"
                    >
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[13.5px] font-bold text-primary-foreground shrink-0 shadow-sm">
                            {initials}
                        </div>
                        <div className="hidden lg:flex flex-col items-start">
                            <span className="text-[13px] font-semibold text-foreground leading-tight">
                                {displayName.split(" ")[0]}
                            </span>
                            <span className="text-[12px] text-muted-foreground leading-tight capitalize">
                                {user?.role?.toLowerCase() || "teacher"}
                            </span>
                        </div>
                    </Button>

                    {/* Mobile menu */}
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground">
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
