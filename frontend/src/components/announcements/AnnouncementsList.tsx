"use client"

import { useState } from "react"
import { Trash2, Edit, AlertCircle, Bell, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    useGetAnnouncementsQuery,
    useDeleteAnnouncementMutation,
    Announcement,
    AnnouncementPriority,
} from "@/redux/slices/announcements/announcementsApi"
import { EditAnnouncementDialog } from "./EditAnnouncementDialog"

interface AnnouncementsListProps {
    priorityFilter?: AnnouncementPriority
    activeFilter?: boolean
    isAdmin: boolean
}

const priorityColors: Record<AnnouncementPriority, string> = {
    URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
    HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    NORMAL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    LOW: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

const priorityIcons: Record<AnnouncementPriority, React.ReactNode> = {
    URGENT: <AlertCircle className="w-3 h-3" />,
    HIGH: <Bell className="w-3 h-3" />,
    NORMAL: <Bell className="w-3 h-3" />,
    LOW: <Bell className="w-3 h-3" />,
}

export function AnnouncementsList({ priorityFilter, activeFilter, isAdmin }: AnnouncementsListProps) {
    const [page, setPage] = useState(1)
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

    const { data, isLoading, error } = useGetAnnouncementsQuery({
        page,
        limit: 10,
        priority: priorityFilter,
        isActive: activeFilter,
    })

    const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation()

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this announcement?")) {
            try {
                await deleteAnnouncement(id).unwrap()
            } catch (err) {
                console.error("Failed to delete announcement:", err)
            }
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "No date"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-500">
                Failed to load announcements
            </div>
        )
    }

    const announcements = data?.data || []
    const pagination = data?.pagination

    if (announcements.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No announcements found</p>
                <p className="text-sm">Announcements will appear here when created.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="divide-y divide-border/40">
                {announcements.map((announcement) => (
                    <div
                        key={announcement.id}
                        className={`p-6 hover:bg-muted/30 transition-colors ${!announcement.isActive ? "opacity-60" : ""}`}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {announcement.imageUrl && (
                                <div className="flex-shrink-0">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${announcement.imageUrl}`}
                                        alt={announcement.title}
                                        className="w-full lg:w-32 h-32 object-cover rounded-lg border border-border/40"
                                    />
                                </div>
                            )}

                            <div className="flex-grow min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[announcement.priority]}`}>
                                        {priorityIcons[announcement.priority]}
                                        {announcement.priority}
                                    </span>
                                    {!announcement.isActive && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                    {announcement.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(announcement.date || announcement.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {announcement.createdBy}
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex lg:flex-col gap-2 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingAnnouncement(announcement)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(announcement.id)}
                                        disabled={isDeleting}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {editingAnnouncement && (
                <EditAnnouncementDialog
                    announcement={editingAnnouncement}
                    open={!!editingAnnouncement}
                    onOpenChange={(open) => !open && setEditingAnnouncement(null)}
                />
            )}
        </div>
    )
}
