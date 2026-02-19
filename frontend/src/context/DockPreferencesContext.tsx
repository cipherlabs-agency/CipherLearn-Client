"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardCheck,
    Receipt,
    Settings,
} from "lucide-react"

export const AVAILABLE_APPS = [
    { id: 'home', label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'classes', label: 'Classes', icon: BookOpen, href: '/batches' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, href: '/attendance' },
    { id: 'fees', label: 'Fees', icon: Receipt, href: '/fees' },
    { id: 'students', label: 'Students', icon: Users, href: '/students' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export interface DockPreferences {
    baseSize: number;
    magnification: number;
    distance: number;
    panelHeight: number;
    selectedApps: string[];
}

const DEFAULT_PREFERENCES: DockPreferences = {
    baseSize: 52,
    magnification: 80,
    distance: 140,
    panelHeight: 70,
    selectedApps: ['home', 'classes', 'attendance', 'fees', 'students', 'settings'],
};

interface DockContextType {
    preferences: DockPreferences;
    updatePreferences: (newPrefs: Partial<DockPreferences>) => void;
    toggleApp: (appId: string) => void;
    resetPreferences: () => void;
    isMounted: boolean;
}

const DockContext = createContext<DockContextType | undefined>(undefined);

export function DockPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<DockPreferences>(DEFAULT_PREFERENCES);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('dock-preferences');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
            } catch (e) {
                console.error('Failed to parse dock preferences', e);
            }
        }
    }, []);

    // Debounced persistence
    useEffect(() => {
        if (!mounted) return;
        
        const timeoutId = setTimeout(() => {
            localStorage.setItem('dock-preferences', JSON.stringify(preferences));
        }, 300); 

        return () => clearTimeout(timeoutId);
    }, [preferences, mounted]);

    const updatePreferences = (newPrefs: Partial<DockPreferences>) => {
        const updated = { ...preferences, ...newPrefs };
        
        if (newPrefs.baseSize) {
            updated.panelHeight = newPrefs.baseSize + 18;
        }

        setPreferences(updated);
    };

    const toggleApp = (appId: string) => {
        const current = preferences.selectedApps;
        const isSelected = current.includes(appId);
        let newSelected;

        if (isSelected) {
            newSelected = current.filter(id => id !== appId);
        } else {
            newSelected = [...current, appId];
        }

        updatePreferences({ selectedApps: newSelected });
    };

    const resetPreferences = () => {
        setPreferences(DEFAULT_PREFERENCES);
    };

    return (
        <DockContext.Provider value={{
            preferences: mounted ? preferences : DEFAULT_PREFERENCES,
            updatePreferences,
            toggleApp,
            resetPreferences,
            isMounted: mounted
        }}>
            {children}
        </DockContext.Provider>
    );
}

export function useDockContext() {
    const context = useContext(DockContext);
    if (context === undefined) {
        throw new Error("useDockContext must be used within a DockPreferencesProvider");
    }
    return context;
}
