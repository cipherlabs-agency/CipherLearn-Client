import { GraduationCap } from "lucide-react"
import { siteConfig } from "@/config/siteConfig"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left: Branding Panel */}
            <div className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0c4a44 0%, #0f766e 50%, #134e4a 100%)" }}
            >
                {/* Warm background orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute right-[-5%] top-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
                        style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
                    />
                    <div className="absolute left-[-10%] bottom-[-10%] w-[450px] h-[450px] rounded-full opacity-15"
                        style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
                        style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
                    />
                </div>

                {/* Logo + Class Name */}
                <div className="relative z-10 flex items-center gap-3">
                    {siteConfig.logoUrl ? (
                        <img src={siteConfig.logoUrl} alt={siteConfig.appName} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.15)" }}
                        >
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                    )}
                    <div>
                        <span className="font-bold text-xl leading-none">{siteConfig.appName}</span>
                        <p className="text-[11px] text-white/60 leading-none mt-0.5 font-medium">{siteConfig.appTagline}</p>
                    </div>
                </div>

                {/* Feature highlights */}
                <div className="relative z-10 space-y-6 max-w-md">
                    <div className="space-y-3">
                        {[
                            { icon: "📋", text: "One-click attendance tracking" },
                            { icon: "💰", text: "Automated fee reminders" },
                            { icon: "📊", text: "Real-time student progress" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-[14px] text-white/80 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-l-2 border-white/30 pl-4">
                        <p className="text-[15px] font-medium leading-relaxed text-white/90">
                            &ldquo;{siteConfig.appName} has completely transformed how I manage my classes. It&rsquo;s so easy to use — I was up and running in minutes!&rdquo;
                        </p>
                        <footer className="text-[13px] text-white/60 mt-2 font-medium">
                            — Happy Teacher
                        </footer>
                    </div>
                </div>

                <div className="relative z-10 text-[12px] text-white/40">
                    &copy; {new Date().getFullYear()} {siteConfig.appName}. All rights reserved.
                </div>
            </div>

            {/* Right: Form Area */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 md:hidden">
                        {siteConfig.logoUrl ? (
                            <img src={siteConfig.logoUrl} alt={siteConfig.appName} className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
                            </div>
                        )}
                        <span className="font-bold text-lg text-foreground">{siteConfig.appName}</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
