"use client"

import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardCheck,
    Receipt,
    Settings,
} from "lucide-react"
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock"

const dockItems = [
    {
        label: "Home",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        label: "Classes",
        icon: BookOpen,
        href: "/batches",
    },
    {
        label: "Attendance",
        icon: ClipboardCheck,
        href: "/attendance",
    },
    {
        label: "Fees",
        icon: Receipt,
        href: "/fees",
    },
    {
        label: "Students",
        icon: Users,
        href: "/students",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
    },
]

export function DashboardDock() {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-full">
            <Dock
                magnification={80}
                distance={140}
                panelHeight={70}
                className="items-end pb-3 px-4 mx-auto rounded-2xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-2xl shadow-black/5"
            >
                {dockItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                        <DockItem
                            key={item.href}
                            className="aspect-square rounded-full cursor-pointer bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm"
                            onClick={() => router.push(item.href)}
                        >
                            <DockLabel>{item.label}</DockLabel>
                            <DockIcon>
                                <item.icon
                                    className={`h-full w-full p-1 transition-colors ${
                                        isActive
                                            ? "text-primary"
                                            : "text-neutral-600 dark:text-neutral-300"
                                    }`}
                                />
                            </DockIcon>
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                            )}
                        </DockItem>
                    )
                })}
            </Dock>
        </div>
    )
}
