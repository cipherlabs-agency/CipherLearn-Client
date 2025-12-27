"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Video,
    FileText,
    Layers,
    GraduationCap,
    ChevronLeft,
    Settings,
    LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/redux/hooks";
import { logoutLocal } from "@/redux/slices/auth/authSlice";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
    { icon: Layers, label: "Batches", href: "/batches" },
    { icon: Video, label: "Videos", href: "/videos" },
    { icon: FileText, label: "Notes", href: "/notes" },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const dispatch = useAppDispatch()

    // Determine if a link is active. Handle root dashboard path specifically.
    const isActive = (href: string) => {
        if (href === "/dashboard") {
            // if we are on /dashboard or exactly /dashboard/, it is active. 
            // Depending on routing, maybe we are at /. 
            // Assuming app/(dashboard)/page.tsx maps to /. or /dashboard?
            // The plan implies / is landing logic or dashboard. 
            // Usually dashboard is /dashboard. 
            // Let's assume dashboard root is /dashboard for now.
            return pathname === href
        }
        return pathname.startsWith(href)
    }

    return (
        <aside
            className={cn(
                "relative flex flex-col border-r bg-card transition-[width] duration-300 ease-in-out h-screen sticky top-0 left-0 z-40",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 border-b">
                <div className={cn("flex items-center gap-2 font-bold text-xl text-primary transition-all overflow-hidden whitespace-nowrap", isCollapsed && "w-0 opacity-0")}>
                    <div className="bg-indigo-600 p-1 rounded-md shrink-0">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span>CipherLearn</span>
                </div>
                {isCollapsed && (
                    <div className="mx-auto bg-indigo-600 p-2 rounded-md shrink-0">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                )}

                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isCollapsed && (
                <div className="flex justify-center py-2 absolute top-3 right-[-12px] z-50">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 rounded-full border shadow-md"
                        onClick={() => setIsCollapsed(false)}
                    >
                        <ChevronLeft className="h-3 w-3 rotate-180" />
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive(item.href) ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) && "text-primary")} />
                            {!isCollapsed && (
                                <span className="truncate">{item.label}</span>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="border-t p-2 space-y-1">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    <Settings className="h-5 w-5" />
                    {!isCollapsed && (
                        <span>Settings</span>
                    )}
                </Link>
                <button
                    onClick={() => {
                        dispatch(logoutLocal())
                        window.location.href = "/login"
                    }}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-600 text-muted-foreground",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && (
                        <span>Logout</span>
                    )}
                </button>
            </div>
        </aside>
    )
}
