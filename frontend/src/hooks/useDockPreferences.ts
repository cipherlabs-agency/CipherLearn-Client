"use client";

import { useDockContext, AVAILABLE_APPS, DockPreferences } from "@/context/DockPreferencesContext";

export { AVAILABLE_APPS };
export type { DockPreferences };

export function useDockPreferences() {
    return useDockContext();
}
