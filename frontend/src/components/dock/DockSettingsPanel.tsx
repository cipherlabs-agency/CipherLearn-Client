import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface DockPreferences {
    baseSize: number;
    magnification: number;
    distance: number;
    panelHeight: number;
}

interface DockSettingsProps {
    preferences: DockPreferences;
    onUpdate: (prefs: Partial<DockPreferences>) => void;
    onReset: () => void;
}

export function DockSettingsPanel({ preferences, onUpdate, onReset }: DockSettingsProps) {
    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-xl text-white shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm text-white/90">Dock Settings</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                    title="Reset to defaults"
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>

            <div className="space-y-5">
                {/* Size Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/60">
                        <Label className="text-white/80 font-normal">Base Size</Label>
                        <span>{preferences.baseSize}px</span>
                    </div>
                    <Slider
                        defaultValue={[preferences.baseSize]}
                        value={[preferences.baseSize]}
                        max={80}
                        min={40}
                        step={2}
                        onValueChange={(vals: number[]) => onUpdate({ baseSize: vals[0] })}
                        className="cursor-pointer"
                    />
                </div>

                {/* Magnification Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/60">
                        <Label className="text-white/80 font-normal">Magnification</Label>
                        <span>{preferences.magnification}px</span>
                    </div>
                    <Slider
                        defaultValue={[preferences.magnification]}
                        value={[preferences.magnification]}
                        max={120}
                        min={0}
                        step={5}
                        onValueChange={(vals: number[]) => onUpdate({ magnification: vals[0] })}
                        className="cursor-pointer"
                    />
                </div>

                {/* Distance Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/60">
                        <Label className="text-white/80 font-normal">Wave Spread</Label>
                        <span>{preferences.distance}px</span>
                    </div>
                    <Slider
                        defaultValue={[preferences.distance]}
                        value={[preferences.distance]}
                        max={300}
                        min={50}
                        step={10}
                        onValueChange={(vals: number[]) => onUpdate({ distance: vals[0] })}
                        className="cursor-pointer"
                    />
                </div>
            </div>
            
            {/* Pointer arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/80 rotate-45 border-r border-b border-white/20"></div>
        </div>
    )
}
