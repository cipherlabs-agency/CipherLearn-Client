"use client"

import { Settings, RotateCcw } from "lucide-react"
import { DangerZone } from "@/components/settings/DangerZone"
import { useAppSelector } from "@/redux/hooks"
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock"
import { useDockPreferences, AVAILABLE_APPS } from "@/hooks/useDockPreferences"
import { AppSelector } from "@/components/dock/AppSelector"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function DockPreview() {
    const { preferences } = useDockPreferences();
    const visibleApps = AVAILABLE_APPS.filter(app => preferences.selectedApps.includes(app.id));

    return (
        <Dock
            magnification={preferences.magnification}
            distance={preferences.distance}
            panelHeight={preferences.panelHeight}
            baseSize={preferences.baseSize}
            className="items-end pb-3 px-4 mx-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-xl"
        >
            {visibleApps.map((item) => (
                <DockItem
                    key={item.id}
                    className="aspect-square rounded-full cursor-default bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm"
                >
                    <DockLabel>{item.label}</DockLabel>
                    <DockIcon>
                        <item.icon className="h-full w-full p-2 text-neutral-600 dark:text-neutral-300" />
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
        </div>
    )
}
