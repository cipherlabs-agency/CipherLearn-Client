"use client"

import { Settings } from "lucide-react"
import { DangerZone } from "@/components/settings/DangerZone"
import { useAppSelector } from "@/redux/hooks"

export default function SettingsPage() {
    const { user } = useAppSelector((state) => state.auth)

    // Only show danger zone for admins
    const isAdmin = user?.role === 'ADMIN'

    return (
        <div className="space-y-12 py-10 px-8 max-w-[1000px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium">
                        Manage your account and application preferences.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Settings className="h-5 w-5" />
                    <span className="text-sm font-medium">
                        {user?.role || 'User'}
                    </span>
                </div>
            </div>

            {/* General Settings Section */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">General</h2>
                    <p className="text-sm text-muted-foreground">
                        Basic account and display settings.
                    </p>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="px-6 py-5 border-b border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-foreground">Account Information</h3>
                                <p className="text-sm text-muted-foreground">Your profile details</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{user?.name}</span>
                                <span className="mx-2">·</span>
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-foreground">Role</h3>
                                <p className="text-sm text-muted-foreground">Your current access level</p>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
                                {user?.role || 'STUDENT'}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone - Admin Only */}
            {isAdmin && (
                <section className="pt-8">
                    <DangerZone />
                </section>
            )}
        </div>
    )
}
