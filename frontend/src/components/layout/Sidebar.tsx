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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/batches", label: "Batches", icon: BookOpen },
    { href: "/students", label: "Students", icon: Users },
    { href: "/attendance", label: "Attendance", icon: ClipboardList },
    { href: "/assignments", label: "Assignments", icon: FileUp },
    { href: "/notes", label: "Notes", icon: FileText },
    { href: "/videos", label: "Videos", icon: Video },
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
            className={`sticky top-0 z-40 h-screen transition-all duration-300 border-r shrink-0 bg-primary ${
                isCollapsed ? 'w-16' : 'w-64'
            }`}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-accent text-accent-foreground font-bold text-sm shadow-lg shadow-accent/20">
                            CI
                        </div>
                        <span className="font-bold text-lg text-white">CipherLearn</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
                                isActive
                                    ? 'text-white bg-white/10'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                            
                            <item.icon 
                                className={`h-5 w-5 shrink-0 transition-all ${
                                    isActive ? 'text-accent' : 'group-hover:text-white'
                                }`}
                            />
                            {!isCollapsed && (
                                <span className="truncate">{item.label}</span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer - Logout */}
            <div className="p-3 border-t border-white/10">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={`w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-destructive/20 transition-all ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </Button>
            </div>
        </aside>
    )
}
