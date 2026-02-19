"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    FileText,
    Video,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    FileUp,
    Receipt,
    Settings,
    Megaphone,
    GraduationCap,
    Calendar,
    ClipboardCheck,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const navGroups = [
    {
        label: null,
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
    },
    {
        label: "Classroom",
        items: [
            { href: "/batches", label: "Classes", icon: BookOpen },
            { href: "/students", label: "Students", icon: Users },
            { href: "/teachers", label: "Teachers", icon: GraduationCap },
            { href: "/attendance", label: "Attendance", icon: ClipboardList },
            { href: "/fees", label: "Fees", icon: Receipt },
        ]
    },
    {
        label: "Schedule",
        items: [
            { href: "/lectures", label: "Lectures", icon: Calendar },
            { href: "/tests", label: "Tests", icon: ClipboardCheck },
        ]
    },
    {
        label: "Resources",
        items: [
            { href: "/assignments", label: "Assignments", icon: FileUp },
            { href: "/notes", label: "Notes", icon: FileText },
            { href: "/videos", label: "Videos", icon: Video },
            { href: "/announcements", label: "Announcements", icon: Megaphone },
        ]
    },
    {
        label: "Account",
        items: [
            { href: "/settings", label: "Settings", icon: Settings },
        ]
    }
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.push("/login")
    }

    return (
        <aside
            className={cn(
                "sticky top-0 z-40 h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out",
                "bg-sidebar border-r border-sidebar-border",
                isCollapsed ? "w-[68px]" : "w-[240px]"
            )}
        >
            {/* Brand Header */}
            <div className={cn(
                "flex h-16 items-center border-b border-sidebar-border shrink-0",
                isCollapsed ? "px-4 justify-center" : "px-4 justify-between"
            )}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Teacher-friendly logo mark */}
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-primary shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor"/>
                                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="currentColor" opacity="0.7"/>
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-[14px] text-foreground tracking-tight leading-none">
                                CipherLearn
                            </span>
                            <p className="text-[12px] text-muted-foreground leading-none mt-0.5 font-medium">
                                Teaching Platform
                            </p>
                        </div>
                    </div>
                )}

                {isCollapsed && (
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary shadow-sm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor"/>
                            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="currentColor" opacity="0.7"/>
                        </svg>
                    </div>
                )}

                {!isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Expand button when collapsed */}
            {isCollapsed && (
                <div className="px-3 pt-3">
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mx-auto"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {/* Group Label */}
                        {group.label && !isCollapsed && (
                            <div className="px-2 mb-2">
                                <span className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    {group.label}
                                </span>
                            </div>
                        )}

                        {/* Group divider when collapsed */}
                        {group.label && isCollapsed && groupIndex > 0 && (
                            <div className="border-t border-sidebar-border mx-1 mb-2" />
                        )}

                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={isCollapsed ? item.label : undefined}
                                        className={cn(
                                            "flex items-center rounded-lg transition-all duration-150 font-medium",
                                            isCollapsed
                                                ? "h-9 w-9 justify-center mx-auto"
                                                : "gap-3 px-3 py-2.5 text-[13.5px]",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "shrink-0",
                                            isCollapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]",
                                            isActive && "text-primary-foreground"
                                        )} />
                                        {!isCollapsed && (
                                            <span className="truncate">{item.label}</span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer — Logout */}
            <div className={cn(
                "p-3 border-t border-sidebar-border shrink-0"
            )}>
                <button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center rounded-lg transition-all duration-150 font-medium text-[13.5px]",
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/8",
                        isCollapsed
                            ? "h-9 w-9 justify-center mx-auto"
                            : "gap-3 px-3 py-2.5"
                    )}
                    title={isCollapsed ? "Sign out" : undefined}
                >
                    <LogOut className={cn("shrink-0", isCollapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]")} />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    )
}
