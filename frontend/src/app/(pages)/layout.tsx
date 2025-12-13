import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
