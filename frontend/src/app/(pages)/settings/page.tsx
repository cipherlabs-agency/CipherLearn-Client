"use client"

import { Settings, RotateCcw, School, Shield, CheckCircle2, XCircle } from "lucide-react"
import { DangerZone } from "@/components/settings/DangerZone"
import { useAppSelector } from "@/redux/hooks"
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock"
import { useDockPreferences, AVAILABLE_APPS } from "@/hooks/useDockPreferences"
import { AppSelector } from "@/components/dock/AppSelector"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
    useResetTeacherPermissionsMutation,
    type TeacherPermissions,
} from "@/redux/slices/settings/settingsApi"

const PERMISSION_LABELS: Record<keyof TeacherPermissions, string> = {
    canManageLectures: "Manage Lectures",
    canUploadNotes: "Upload Notes",
    canUploadVideos: "Upload Videos",
    canManageAssignments: "Manage Assignments",
    canViewFees: "View Fees",
    canManageStudyMaterials: "Manage Study Materials",
    canSendAnnouncements: "Send Announcements",
    canViewAnalytics: "View Analytics",
    canExportData: "Export Data",
}

function SchoolProfileSection() {
    const { data: settings, isLoading } = useGetSettingsQuery()
    const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()
    const [form, setForm] = useState({
        className: "",
        classEmail: "",
        classPhone: "",
        classAddress: "",
        classWebsite: "",
    })

    useEffect(() => {
        if (settings) {
            setForm({
                className: settings.className,
                classEmail: settings.classEmail,
                classPhone: settings.classPhone,
                classAddress: settings.classAddress,
                classWebsite: settings.classWebsite,
            })
        }
    }, [settings])

    const handleSave = async () => {
        try {
            await updateSettings(form).unwrap()
            toast.success("School profile updated")
        } catch {
            toast.error("Failed to update profile")
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {[
                { key: "className", label: "Class Name", placeholder: "My Coaching Class", type: "text" },
                { key: "classEmail", label: "Contact Email", placeholder: "info@mycoaching.com", type: "email" },
                { key: "classPhone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
                { key: "classAddress", label: "Address", placeholder: "123 Main Street, City", type: "text" },
                { key: "classWebsite", label: "Website", placeholder: "https://mycoaching.com", type: "url" },
            ].map(({ key, label, placeholder, type }) => (
                <div key={key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <Label className="w-40 shrink-0 text-sm font-medium text-foreground">{label}</Label>
                    <Input
                        type={type}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="max-w-sm"
                    />
                </div>
            ))}
            <div className="px-6 py-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? "Saving…" : "Save Profile"}
                </Button>
            </div>
        </div>
    )
}

function TeacherPermissionsSection() {
    const { data: settings, isLoading } = useGetSettingsQuery()
    const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()
    const [resetPermissions, { isLoading: isResetting }] = useResetTeacherPermissionsMutation()
    const [perms, setPerms] = useState<TeacherPermissions | null>(null)

    useEffect(() => {
        if (settings) {
            setPerms(settings.teacherPermissions)
        }
    }, [settings])

    const handleToggle = (key: keyof TeacherPermissions) => {
        setPerms((prev) => prev ? { ...prev, [key]: !prev[key] } : prev)
    }

    const handleSave = async () => {
        if (!perms) return
        try {
            await updateSettings({ teacherPermissions: perms }).unwrap()
            toast.success("Teacher permissions saved")
        } catch {
            toast.error("Failed to save permissions")
        }
    }

    const handleReset = async () => {
        try {
            const result = await resetPermissions().unwrap()
            setPerms(result.teacherPermissions)
            toast.success("Permissions reset to defaults")
        } catch {
            toast.error("Failed to reset permissions")
        }
    }

    if (isLoading || !perms) {
        return (
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
                {(Object.keys(PERMISSION_LABELS) as (keyof TeacherPermissions)[]).map((key) => (
                    <div key={key} className="px-6 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            {perms[key]
                                ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                            }
                            <span className="text-sm font-medium text-foreground">
                                {PERMISSION_LABELS[key]}
                            </span>
                        </div>
                        <Switch
                            checked={perms[key]}
                            onCheckedChange={() => handleToggle(key)}
                        />
                    </div>
                ))}
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isResetting}
                    className="text-muted-foreground gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Defaults
                </Button>
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? "Saving…" : "Save Permissions"}
                </Button>
            </div>
        </div>
    )
}

function DockPreview() {
    const { preferences } = useDockPreferences();
    const visibleApps = AVAILABLE_APPS.filter(app => preferences.selectedApps.includes(app.id));

    return (
        <Dock
            magnification={preferences.magnification}
            distance={preferences.distance}
            panelHeight={preferences.panelHeight}
            baseSize={preferences.baseSize}
            className="items-end pb-3 px-4 mx-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 backdrop-blur-md shadow-xl"
        >
            {visibleApps.map((item) => (
                <DockItem
                    key={item.id}
                    className="aspect-square rounded-full cursor-default bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm"
                >
                    <DockLabel>{item.label}</DockLabel>
                    <DockIcon>
                        <item.icon className="h-full w-full p-2 text-neutral-600 dark:text-neutral-400" strokeWidth={2.5} />
                    </DockIcon>
                </DockItem>
            ))}
        </Dock>
    )
}

function DockAppsSelector() {
    const { preferences, toggleApp } = useDockPreferences();
    
    // Map visible apps to match AppSelector format
    // appselector expects AppItem { id, label, icon } which matches AVAILABLE_APPS structure
    
    return (
        <AppSelector
            apps={AVAILABLE_APPS}
            selected={preferences.selectedApps}
            onToggle={toggleApp}
            label="Pinned Apps"
        />
    )
}

function DockControls() {
    const { preferences, updatePreferences, resetPreferences } = useDockPreferences();

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <Label>Base Size</Label>
                    <span className="text-muted-foreground text-xs">{preferences.baseSize}px</span>
                </div>
                <Slider
                    defaultValue={[preferences.baseSize]}
                    value={[preferences.baseSize]}
                    max={80}
                    min={40}
                    step={2}
                    onValueChange={(vals) => updatePreferences({ baseSize: vals[0] })}
                />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <Label>Magnification</Label>
                    <span className="text-muted-foreground text-xs">{preferences.magnification}px</span>
                </div>
                <Slider
                    defaultValue={[preferences.magnification]}
                    value={[preferences.magnification]}
                    max={120}
                    min={0}
                    step={5}
                    onValueChange={(vals) => updatePreferences({ magnification: vals[0] })}
                />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <Label>Wave Spread</Label>
                    <span className="text-muted-foreground text-xs">{preferences.distance}px</span>
                </div>
                <Slider
                    defaultValue={[preferences.distance]}
                    value={[preferences.distance]}
                    max={300}
                    min={50}
                    step={10}
                    onValueChange={(vals) => updatePreferences({ distance: vals[0] })}
                />
            </div>

            <Button 
                variant="outline" 
                size="sm" 
                onClick={resetPreferences}
                className="w-full gap-2"
            >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
            </Button>
        </div>
    )
}

export default function SettingsPage() {
     const { user } = useAppSelector((state) => state.auth)

    // Only show danger zone for admins
    const isAdmin = user?.role === 'ADMIN'

    return (
        <div className="space-y-10 max-w-[1000px] mx-auto animate-in fade-in duration-500">
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

            {/* School Profile — Admin Only */}
            {isAdmin && (
                <section className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <School className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Class Profile</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Contact information and details shown to students and parents.
                        </p>
                    </div>
                    <SchoolProfileSection />
                </section>
            )}

            {/* Teacher Permissions — Admin Only */}
            {isAdmin && (
                <section className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Teacher Permissions</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Control what actions teachers can perform across the platform.
                        </p>
                    </div>
                    <TeacherPermissionsSection />
                </section>
            )}

            {/* Dock Configuration Section */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">Dock Configuration</h2>
                    <p className="text-sm text-muted-foreground">
                        Customize your navigation dock's appearance and apps.
                    </p>
                </div>

                <div className="grid gap-6 rounded-xl border border-border bg-card p-6">
                    {/* Live Preview */}
                    <div className="relative flex min-h-[200px] w-full items-end justify-center rounded-lg border border-border/50 bg-muted/20 pb-6 overflow-hidden">
                        <div className="absolute top-3 left-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Live Preview
                        </div>
                        <DockPreview />
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* App Selection */}
                        <div className="space-y-4">
                             <DockAppsSelector />
                        </div>

                        {/* Appearance Controls */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Appearance</h3>
                            <DockControls />
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

            {/* Maintenance Mode - Admin Only (hidden at very bottom) */}
            {isAdmin && (
                <section className="pb-12">
                    <button
                        onClick={() => window.location.href = "/maintenance"}
                        className="w-full group cursor-pointer"
                    >
                        <div className="rounded-lg border border-dashed border-zinc-800 hover:border-amber-600/40 bg-zinc-950/40 hover:bg-amber-950/10 p-4 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-amber-500 tracking-wider transition-colors">
                                        ENTER MAINTENANCE MODE
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors">
                                    →
                                </span>
                            </div>
                        </div>
                    </button>
                </section>
            )}
        </div>
    )
}
