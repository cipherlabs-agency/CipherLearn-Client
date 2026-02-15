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
    ChevronLeft,
    ChevronRight,
    FileUp,
    Receipt,
    Settings,
    Megaphone,
    GraduationCap,
    Calendar,
    ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navGroups = [
    {
        label: "Main",
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
    },
    {
        label: "Manage",
        items: [
            { href: "/batches", label: "Batches", icon: BookOpen },
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
        label: "Learn",
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
            className={`sticky top-0 z-40 h-screen transition-all duration-200 border-r border-border shrink-0 bg-background ${
                isCollapsed ? 'w-14' : 'w-56'
            }`}
        >
            {/* Header - Vercel compact style */}
            <div className="flex h-14 items-center justify-between px-3 border-b border-border">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center bg-foreground text-background font-semibold text-xs">
                            CL
                        </div>
                        <span className="font-semibold text-sm text-foreground">CipherLearn</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </Button>
            </div>

            {/* Navigation - Organized by groups with proper spacing */}
            <nav className="flex-1 px-2 py-3 overflow-y-auto">
                {navGroups.map((group, groupIndex) => (
                    <div key={group.label} className={groupIndex > 0 ? 'mt-4' : ''}>
                        {!isCollapsed && (
                            <div className="px-2 mb-1.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                                    {group.label}
                                </span>
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                                            isActive
                                                ? 'text-foreground bg-secondary'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
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

            {/* Footer - Logout */}
            <div className="p-2 border-t border-border">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={`w-full h-8 justify-start gap-2.5 text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
                        isCollapsed ? 'justify-center px-0' : 'px-2.5'
                    }`}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </Button>
            </div>
        </aside>
    )
}
