"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
            <div className="flex h-14 items-center px-4 gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-foreground rounded-md flex items-center justify-center text-background text-[10px] font-semibold">
                        CL
                    </div>
                    <span className="font-semibold text-sm hidden md:block text-foreground">
                        CipherLearn
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <form className="hidden sm:flex max-w-xs">
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="h-8 text-xs"
                            icon={<Search className="h-3.5 w-3.5" />}
                        />
                    </form>

                    <nav className="flex items-center gap-1">
                        <ModeToggle />
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notifications</span>
                        </Button>

                        <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>

                        <Button 
                            variant="ghost" 
                            className="h-8 px-2 gap-2 hover:bg-secondary hidden sm:flex font-medium text-xs text-muted-foreground hover:text-foreground"
                        >
                            <div className="h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-semibold">
                                AD
                            </div>
                            <span className="hidden lg:block">Admin</span>
                        </Button>

                        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
