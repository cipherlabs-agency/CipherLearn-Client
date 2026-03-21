"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, ChevronRight, Lock, Mail, KeyRound } from "lucide-react"
import { useState } from "react"
import { useLoginMutation, useResetPasswordMutation, useCheckEmailMutation } from "@/redux/slices/auth/authApi"
import { useAppDispatch } from "@/redux/hooks"
import { setCredentials } from "@/redux/slices/auth/authSlice"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

type Step = "email" | "password" | "setup"

export default function LoginPage() {
    const [login, { isLoading: isLoginLoading }] = useLoginMutation()
    const [resetPassword, { isLoading: isResetLoading }] = useResetPasswordMutation()
    const [checkEmail, { isLoading: isCheckLoading }] = useCheckEmailMutation()
    
    const dispatch = useAppDispatch()
    const router = useRouter()
    
    // Form state
    const [step, setStep] = useState<Step>("email")
    const [direction, setDirection] = useState(0) // 1 for forward, -1 for back
    
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const isLoading = isLoginLoading || isResetLoading || isCheckLoading

    // Sliding animation variants
    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (dir: number) => ({
            zIndex: 0,
            x: dir < 0 ? 50 : -50,
            opacity: 0
        })
    }

    const nextStep = (next: Step) => {
        setDirection(1)
        setStep(next)
    }

    const prevStep = (prev: Step) => {
        setDirection(-1)
        setStep(prev)
    }

    async function onEmailSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        if (!email) return
        
        try {
            const response = await checkEmail(email).unwrap()
            if (!response.data.exists) {
                toast.error("Email not registered. Please contact admin.")
                return
            }
            
            if (response.data.isPasswordSet) {
                nextStep("password")
            } else {
                nextStep("setup")
                toast.info("Account found! Please set your password.")
            }
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to verify email")
        }
    }

    async function onLoginSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        try {
            const response = await login({ email, password }).unwrap()
            const { user, token } = response.data || response
            dispatch(setCredentials({ user, token }))
            toast.success(response.message || "Login successful")
            router.push("/dashboard")
        } catch (err: any) {
            toast.error(err?.data?.message || "Login failed")
        }
    }

    async function onSetPasswordSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        try {
            await resetPassword({ email, newPassword }).unwrap()
            toast.success("Password set successfully! Please login with your new password.")
            prevStep("password") // Go to password step so they can login
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to set password")
        }
    }

    return (
        <div className="space-y-6 overflow-hidden min-h-[400px]">
            <div className="space-y-2 text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {step === "email" && "Welcome"}
                    {step === "password" && "Enter Password"}
                    {step === "setup" && "Set Password"}
                </h1>
                <p className="text-muted-foreground">
                    {step === "email" && "Log in to your CipherLearn account"}
                    {step === "password" && `Logging in as ${email}`}
                    {step === "setup" && "Create a secure password for your account"}
                </p>
            </div>

            <div className="relative">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="w-full"
                    >
                        {step === "email" && (
                            <form onSubmit={onEmailSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            placeholder="name@example.com"
                                            type="email"
                                            disabled={isLoading}
                                            className="h-11 pl-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next"}
                                    {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        )}

                        {step === "password" && (
                            <form onSubmit={onLoginSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link href="#" className="text-xs font-medium text-primary hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                            className="h-11 pl-10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 pt-2">
                                    <Button disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign In
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isLoading}
                                        onClick={() => prevStep("email")}
                                        className="w-full h-11"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Switch account
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === "setup" && (
                            <form onSubmit={onSetPasswordSubmit} className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-password">Create New Password</Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="new-password"
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                className="h-11 pl-10"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                className="h-11 pl-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    <Button disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Activate Account
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isLoading}
                                        onClick={() => prevStep("email")}
                                        className="w-full h-11"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {step === "email" && (
                <div className="pt-4 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground">
                        Protected by Secure Authenticator. <br />
                        Access is managed by your administration.
                    </p>
                </div>
            )}
        </div>
    )
}
