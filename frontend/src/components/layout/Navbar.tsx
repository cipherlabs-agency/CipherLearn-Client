"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
            <div className="flex h-16 items-center px-6 gap-8 max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="h-7 w-7 bg-foreground rounded-lg flex items-center justify-center text-background text-[10px] font-bold tracking-tighter shadow-sm transition-transform duration-300 group-hover:scale-105">
                        CL
                    </div>
                    <span className="font-bold text-sm tracking-tight hidden md:block text-foreground">
                        CipherLearn <span className="text-muted-foreground/40 font-medium ml-1">/</span> <span className="text-muted-foreground/60 font-medium ml-1">Operations</span>
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-end gap-6 md:ml-auto">
                    <form className="hidden sm:flex-1 sm:flex max-w-sm ml-auto">
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="h-9 text-xs bg-muted/30 focus:bg-background"
                            icon={<Search className="h-3.5 w-3.5" />}
                        />
                    </form>

                    <nav className="flex items-center gap-1">
                        <ModeToggle />
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notifications</span>
                        </Button>

                        <div className="h-4 w-px bg-border/40 mx-2 hidden sm:block"></div>

                        <Button 
                            variant="ghost" 
                            className="h-9 px-2 gap-2 hover:bg-muted/50 transition-all hidden sm:flex font-medium text-xs text-muted-foreground hover:text-foreground"
                        >
                            <div className="h-6 w-6 rounded-full bg-muted border border-border/80 flex items-center justify-center text-[10px] font-bold">
                                AD
                            </div>
                            <span className="hidden lg:block">Admin</span>
                        </Button>

                        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
