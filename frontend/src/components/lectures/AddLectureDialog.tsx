"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Plus, Loader2, ChevronLeft, ChevronRight, BookOpen, Users,
    Calendar, Clock, Repeat, CheckCircle2, Sparkles
} from "lucide-react"
import { useState, useMemo } from "react"
import { useCreateLectureMutation, useCreateBulkLecturesMutation } from "@/redux/slices/lectures/lecturesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useGetTeachersQuery } from "@/redux/slices/teachers/teachersApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { CreateLectureInput, CreateBulkLecturesInput } from "@/types"

// ── Presets ────────────────────────────────────────────────────────────────────
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Computer Science", "Economics", "Hindi"]

const TIME_QUICK_PICKS = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "19:00",
]

const DURATIONS = [
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hr", value: 60 },
    { label: "1.5 hr", value: 90 },
    { label: "2 hrs", value: 120 },
]

const DAYS = [
    { short: "M", label: "Monday", key: "MONDAY" },
    { short: "T", label: "Tuesday", key: "TUESDAY" },
    { short: "W", label: "Wednesday", key: "WEDNESDAY" },
    { short: "T", label: "Thursday", key: "THURSDAY" },
    { short: "F", label: "Friday", key: "FRIDAY" },
    { short: "S", label: "Saturday", key: "SATURDAY" },
    { short: "S", label: "Sunday", key: "SUNDAY" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt12(t: string) {
    if (!t) return ""
    const [h, m] = t.split(":").map(Number)
    const ap = h >= 12 ? "PM" : "AM"
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ap}`
}

function addMin(t: string, min: number) {
    const [h, m] = t.split(":").map(Number)
    const total = h * 60 + m + min
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function todayISO() { return new Date().toISOString().split("T")[0] }

function niceDate(iso: string) {
    if (!iso) return ""
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short"
    })
}

const LAST_BATCH = "cl_last_batchId"
const LAST_TEACHER = "cl_last_teacherId"
const lsGet = (k: string) => typeof window !== "undefined" ? (localStorage.getItem(k) || "") : ""
const lsSet = (k: string, v: string) => typeof window !== "undefined" && localStorage.setItem(k, v)

// ── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCal({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    const [view, setView] = useState(() => {
        const d = value ? new Date(value + "T00:00:00") : new Date()
        return { y: d.getFullYear(), m: d.getMonth() }
    })

    const first = new Date(view.y, view.m, 1).getDay()
    const total = new Date(view.y, view.m + 1, 0).getDate()
    const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
    const toISO = (d: number) => `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const today = new Date(); const ty = today.getFullYear(); const tm = today.getMonth(); const td = today.getDate()
    const prev = () => view.m === 0 ? setView({ y: view.y - 1, m: 11 }) : setView(v => ({ ...v, m: v.m - 1 }))
    const next = () => view.m === 11 ? setView({ y: view.y + 1, m: 0 }) : setView(v => ({ ...v, m: v.m + 1 }))

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="text-[14px] font-bold">
                    {new Date(view.y, view.m).toLocaleString("en", { month: "long" })} {view.y}
                </span>
                <button type="button" onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-[11px] font-bold text-muted-foreground">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center">
                        {d && (
                            <button type="button" onClick={() => onChange(toISO(d))} className={cn(
                                "w-8 h-8 rounded-full text-[13px] font-medium transition-all",
                                toISO(d) === value && "bg-primary text-primary-foreground font-bold",
                                toISO(d) !== value && ty === view.y && tm === view.m && td === d && "ring-2 ring-primary text-primary",
                                toISO(d) !== value && "hover:bg-muted",
                            )}>{d}</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Step Progress ──────────────────────────────────────────────────────────────
const STEPS = [
    { icon: BookOpen, label: "Subject" },
    { icon: Calendar, label: "When" },
    { icon: Clock, label: "Time" },
    { icon: Repeat, label: "Repeat" },
]

function StepBar({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-0 mb-6">
            {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                        i < step && "bg-primary border-primary text-primary-foreground",
                        i === step && "border-primary text-primary bg-primary/10",
                        i > step && "border-border text-muted-foreground",
                    )}>
                        {i < step ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <s.icon className="h-4 w-4" />
                        )}
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn(
                            "flex-1 h-[2px] mx-1 rounded-full transition-all duration-300",
                            i < step ? "bg-primary" : "bg-border"
                        )} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ── Interfaces ─────────────────────────────────────────────────────────────────
interface AddLectureDialogProps {
    defaultDate?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideTrigger?: boolean
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AddLectureDialog({ defaultDate, open: extOpen, onOpenChange: extChange, hideTrigger = false }: AddLectureDialogProps) {
    const isControlled = extOpen !== undefined
    const [internalOpen, setInternalOpen] = useState(false)
    const open = isControlled ? extOpen! : internalOpen

    const handleOpenChange = (v: boolean) => {
        if (isControlled) extChange?.(v); else setInternalOpen(v)
        if (v) reset()
    }

    const [createLecture, { isLoading: isC }] = useCreateLectureMutation()
    const [createBulk, { isLoading: isCB }] = useCreateBulkLecturesMutation()
    const { data: batches } = useGetAllBatchesQuery()
    const { data: teachersData } = useGetTeachersQuery()
    const teachers = teachersData?.teachers ?? []
    const isLoading = isC || isCB

    // ── State ──────────────────────────────────────────────────────────────────
    const [step, setStep] = useState(0)
    const [subject, setSubject] = useState("")
    const [customSubject, setCustomSubject] = useState("")
    const [batchId, setBatchId] = useState(lsGet(LAST_BATCH))
    const [teacherSelection, setTeacherSelection] = useState(lsGet(LAST_TEACHER))
    const [date, setDate] = useState(defaultDate || todayISO())
    const [startTime, setStartTime] = useState("09:00")
    const [duration, setDuration] = useState(60)
    const [recurring, setRecurring] = useState(false)
    const [recurDays, setRecurDays] = useState<string[]>([])
    const [recurEnd, setRecurEnd] = useState("")
    const [room, setRoom] = useState("")
    const [description, setDescription] = useState("")
    const [showRecurEnd, setShowRecurEnd] = useState(false)

    const endTime = useMemo(() => addMin(startTime, duration), [startTime, duration])
    const finalSubject = subject === "__custom__" ? customSubject : subject

    const reset = () => {
        setStep(0); setSubject(""); setCustomSubject("")
        setBatchId(lsGet(LAST_BATCH)); setTeacherSelection(lsGet(LAST_TEACHER))
        setDate(defaultDate || todayISO()); setStartTime("09:00"); setDuration(60)
        setRecurring(false); setRecurDays([]); setRecurEnd(""); setRoom(""); setDescription("")
        setShowRecurEnd(false)
    }

    const toggleDay = (key: string) => setRecurDays(p => p.includes(key) ? p.filter(d => d !== key) : [...p, key])

    const recurCount = useMemo(() => {
        if (!recurring || !recurDays.length || !recurEnd || !date) return 0
        const dayNums = recurDays.map(d => ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"].indexOf(d))
        const cur = new Date(date + "T00:00:00"); const end = new Date(recurEnd + "T00:00:00")
        let count = 0
        while (cur <= end) { if (dayNums.includes(cur.getDay())) count++; cur.setDate(cur.getDate() + 1) }
        return count
    }, [recurring, recurDays, recurEnd, date])

    // ── Navigation ─────────────────────────────────────────────────────────────
    const canNext = [
        finalSubject.trim() && batchId,    // step 0
        !!date,                             // step 1
        !!startTime,                        // step 2
        true,                               // step 3 (always can submit)
    ]

    const handleNext = () => { if (step < 3) setStep(s => s + 1) }
    const handleBack = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!batchId || !finalSubject || !date || !startTime) { toast.error("Please complete all steps"); return }
        if (recurring && (!recurDays.length || !recurEnd)) { toast.error("Select repeat days and end date"); return }

        lsSet(LAST_BATCH, batchId)
        if (teacherSelection) lsSet(LAST_TEACHER, teacherSelection)

        const isAuto = teacherSelection === "auto"
        const teacherId = !isAuto && teacherSelection ? Number(teacherSelection) : null

        try {
            if (recurring) {
                const p: CreateBulkLecturesInput = {
                    title: finalSubject, subject: finalSubject, batchId: Number(batchId),
                    teacherId, autoAssign: isAuto, startTime, endTime, room: room || undefined,
                    description: description || undefined,
                    recurrence: { startDate: date, endDate: recurEnd, days: recurDays }
                }
                const res = await createBulk(p).unwrap()
                toast.success(`${res.data?.created} classes created! 🎉`)
            } else {
                const p: CreateLectureInput = {
                    title: finalSubject, subject: finalSubject, batchId: Number(batchId),
                    teacherId, autoAssign: isAuto, date, startTime, endTime, room: room || undefined,
                    description: description || undefined,
                }
                await createLecture(p).unwrap()
                toast.success("Class scheduled! ✓")
            }
            handleOpenChange(false)
        } catch (err: unknown) {
            const e = err as { data?: { message?: string } }
            toast.error(e?.data?.message || "Failed to schedule")
        }
    }

    const selectedBatch = batches?.find(b => String(b.id) === batchId)

    // ── Dialog Content ─────────────────────────────────────────────────────────
    const dialogContent = (
        <DialogContent className="w-full max-w-[700px] md:w-[700px] p-0 gap-0 overflow-hidden">
            <VisuallyHidden><DialogTitle>Schedule a Class</DialogTitle></VisuallyHidden>
            {/* Header */}
            <div className="px-8 pt-7 pb-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-[18px] font-bold">Schedule a Class</h2>
                    </div>
                    <span className="text-[12px] text-muted-foreground font-medium">
                        Step {step + 1} of 4
                    </span>
                </div>
                <p className="text-[13px] text-muted-foreground mb-5">
                    {["What subject and who?", "Which day?", "What time and how long?", "Does it repeat?"][step]}
                </p>
                <StepBar step={step} />
            </div>

            {/* Step Body — constant height with internal scroll */}
            <div className="px-8 h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">

                {/* ── STEP 0: Subject + Batch + Teacher ──────────────────── */}
                {step === 0 && (
                    <div className="space-y-5">
                        {/* Subject chips */}
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Subject</p>
                            <div className="flex flex-wrap gap-2">
                                {SUBJECTS.map(s => (
                                    <button key={s} type="button" onClick={() => setSubject(s)}
                                        className={cn(
                                            "px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all",
                                            subject === s
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                                                : "border-border hover:border-primary/50 text-foreground"
                                        )}>
                                        {s}
                                    </button>
                                ))}
                                <button type="button" onClick={() => setSubject("__custom__")}
                                    className={cn(
                                        "px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all",
                                        subject === "__custom__"
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-dashed border-border hover:border-primary/50 text-muted-foreground"
                                    )}>
                                    + Other
                                </button>
                            </div>
                            {subject === "__custom__" && (
                                <Input
                                    value={customSubject}
                                    onChange={e => setCustomSubject(e.target.value)}
                                    placeholder="Type subject name..."
                                    className="mt-3 h-11 text-[14px]"
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* Batch + Teacher */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Batch *</p>
                                <Select value={batchId} onValueChange={setBatchId}>
                                    <SelectTrigger className="h-11 text-[14px]"><SelectValue placeholder="Select batch" /></SelectTrigger>
                                    <SelectContent>
                                        {batches?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Teacher</p>
                                <Select value={teacherSelection} onValueChange={setTeacherSelection}>
                                    <SelectTrigger className="h-11 text-[14px]"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto-assign</SelectItem>
                                        {teachers?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Room (optional)</p>
                            <Input value={room} onChange={e => setRoom(e.target.value)} placeholder="Room 03, Lab A, Online..." className="h-11 text-[14px]" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Description <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></p>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Topic of the class, notes for students..."
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                )}

                {/* ── STEP 1: Date via Calendar ────────────────────────── */}
                {step === 1 && (
                    <div>
                        {date && (
                            <div className="mb-4 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-[14px] font-bold text-primary">{niceDate(date)}</span>
                            </div>
                        )}
                        <MiniCal value={date} onChange={setDate} />
                    </div>
                )}

                {/* ── STEP 2: Time + Duration ────────────────────────────── */}
                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Start time</p>
                            <div className="flex flex-wrap gap-2">
                                {TIME_QUICK_PICKS.map(t => (
                                    <button key={t} type="button" onClick={() => setStartTime(t)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all",
                                            startTime === t
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                                                : "border-border hover:border-primary/50"
                                        )}>
                                        {fmt12(t)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Duration</p>
                            <div className="flex gap-2">
                                {DURATIONS.map(d => (
                                    <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-[13px] font-bold border transition-all",
                                            duration === d.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-border hover:border-primary/50"
                                        )}>
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[13px] text-muted-foreground">Class runs</span>
                            <span className="text-[14px] font-bold">{fmt12(startTime)} → {fmt12(endTime)}</span>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Recurring ─────────────────────────────────── */}
                {step === 3 && !showRecurEnd && (
                    <div className="space-y-5">
                        {/* Toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setRecurring(false)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 transition-all",
                                    !recurring ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                )}>
                                <Calendar className={cn("h-8 w-8", !recurring ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn("text-[14px] font-bold", !recurring ? "text-primary" : "text-muted-foreground")}>Just once</span>
                                <span className="text-[11px] text-muted-foreground">On {niceDate(date)}</span>
                            </button>
                            <button type="button" onClick={() => setRecurring(true)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 transition-all",
                                    recurring ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                )}>
                                <Repeat className={cn("h-8 w-8", recurring ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn("text-[14px] font-bold", recurring ? "text-primary" : "text-muted-foreground")}>Repeat it</span>
                                <span className="text-[11px] text-muted-foreground">Create multiple classes</span>
                            </button>
                        </div>

                        {recurring && (
                            <>
                                <div>
                                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Repeat on</p>
                                    <div className="flex gap-2">
                                        {DAYS.map((d, i) => (
                                            <button key={i} type="button" onClick={() => toggleDay(d.key)}
                                                title={d.label}
                                                className={cn(
                                                    "flex-1 h-11 rounded-xl text-[13px] font-bold border transition-all",
                                                    recurDays.includes(d.key)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border hover:border-primary/50 text-muted-foreground"
                                                )}>
                                                {d.short}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowRecurEnd(true)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                                        recurEnd ? "border-primary/30 bg-primary/5" : "border-dashed border-border hover:border-primary/40"
                                    )}>
                                    <span className="text-[13px] font-semibold">
                                        {recurEnd ? `Until ${niceDate(recurEnd)}` : "Pick end date →"}
                                    </span>
                                    {recurCount > 0 && (
                                        <span className="text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                            {recurCount} classes
                                        </span>
                                    )}
                                </button>
                            </>
                        )}

                        {/* Summary Card */}
                        <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 space-y-1.5">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Summary</p>
                            <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[13px]"><span className="font-bold">{finalSubject}</span></span>
                                <span className="text-[13px] text-muted-foreground">{selectedBatch?.name}</span>
                                <span className="text-[13px] text-muted-foreground">{niceDate(date)}</span>
                                <span className="text-[13px] text-muted-foreground">{fmt12(startTime)} – {fmt12(endTime)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3 SUB: Pick recurring end date ─────────────── */}
                {step === 3 && showRecurEnd && (
                    <div>
                        <button type="button" onClick={() => setShowRecurEnd(false)}
                            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to repeat settings
                        </button>
                        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Repeat until</p>
                        <MiniCal value={recurEnd} onChange={(d) => { setRecurEnd(d); setShowRecurEnd(false) }} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 flex items-center justify-between border-t border-border/50 mt-5">
                <Button type="button" variant="ghost" size="sm"
                    onClick={step === 0 ? () => handleOpenChange(false) : handleBack}
                    className="text-muted-foreground gap-1">
                    {step === 0 ? "Cancel" : <><ChevronLeft className="h-4 w-4" />Back</>}
                </Button>
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-border"
                        )} />
                    ))}
                </div>
                {step < 3 ? (
                    <Button type="button" onClick={handleNext} disabled={!canNext[step]} className="gap-1 min-w-[100px]">
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="button" onClick={handleSubmit} disabled={isLoading} className="min-w-[160px]">
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scheduling...</>
                        ) : (
                            <><CheckCircle2 className="h-4 w-4 mr-2" /> {recurring ? `Create ${recurCount || ""} Classes` : "Schedule Class"}</>
                        )}
                    </Button>
                )}
            </div>
        </DialogContent>
    )

    if (hideTrigger) return <Dialog open={open} onOpenChange={handleOpenChange}>{dialogContent}</Dialog>

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" /> Schedule a Class
                </Button>
            </DialogTrigger>
            {dialogContent}
        </Dialog>
    )
}
