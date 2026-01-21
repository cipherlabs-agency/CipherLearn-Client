"use client";

import { useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  useGetSlotsQuery,
  useCreateSlotMutation,
  useDeleteSlotMutation,
  useGetSubmissionsQuery,
  useReviewSubmissionMutation,
  AssignmentSlot,
  StudentSubmission,
} from "@/redux/slices/assignments/assignmentsApi";
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi";

export default function AssignmentsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdminOrTeacher = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AssignmentSlot | null>(null);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);

  const { data: batchesData } = useGetAllBatchesQuery();
  const { data: slotsData, isLoading: loadingSlots } = useGetSlotsQuery({
    batchId: selectedBatchId,
  });
  const { data: submissionsData, isLoading: loadingSubmissions } = useGetSubmissionsQuery(
    selectedSlot ? { slotId: selectedSlot.id } : undefined,
    { skip: !selectedSlot }
  );

  const [createSlot, { isLoading: creating }] = useCreateSlotMutation();
  const [deleteSlot] = useDeleteSlotMutation();
  const [reviewSubmission, { isLoading: reviewing }] = useReviewSubmissionMutation();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    batchId: "",
    dueDate: "",
  });

  const handleCreateSlot = async () => {
    if (!formData.title || !formData.subject || !formData.batchId) return;

    try {
      await createSlot({
        title: formData.title,
        subject: formData.subject,
        description: formData.description || undefined,
        batchId: parseInt(formData.batchId, 10),
        dueDate: formData.dueDate || undefined,
      }).unwrap();

      setFormData({ title: "", subject: "", description: "", batchId: "", dueDate: "" });
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create slot:", error);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteSlot(id).unwrap();
      } catch (error) {
        console.error("Failed to delete slot:", error);
      }
    }
  };

  const handleReview = async (submissionId: number, status: "ACCEPTED" | "REJECTED") => {
    try {
      await reviewSubmission({
        id: submissionId,
        data: { status },
      }).unwrap();
    } catch (error) {
      console.error("Failed to review submission:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
            <CheckCircle className="h-3 w-3" /> Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 rounded">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 py-6 px-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdminOrTeacher
              ? "Create assignment slots and review student submissions"
              : "View and submit your assignments"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedBatchId?.toString() || "all"}
            onValueChange={(v) => setSelectedBatchId(v === "all" ? undefined : parseInt(v, 10))}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batchesData?.map((batch) => (
                <SelectItem key={batch.id} value={batch.id.toString()}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdminOrTeacher && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 text-xs font-medium">
                  <Plus className="h-4 w-4" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Assignment Slot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Assignment title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Batch</label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(v) => setFormData({ ...formData, batchId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batchesData?.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <textarea
                      className="w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Assignment description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateSlot} disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Assignment Slots Grid */}
      {loadingSlots ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-3 w-1/2 mb-6" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : slotsData?.data && slotsData.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slotsData.data.map((slot) => (
            <div key={slot.id} className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-foreground">{slot.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{slot.subject}</p>
                </div>
                {isAdminOrTeacher && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                  <Users className="h-3 w-3" />
                  {slot.batch.name}
                </span>
                {slot.dueDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(slot.dueDate), "MMM d")}
                  </span>
                )}
              </div>

              {slot.description && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {slot.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                <span className="text-xs text-muted-foreground font-medium">
                  {slot._count?.submissions || 0} submissions
                </span>

                {isAdminOrTeacher ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setShowSubmissionsDialog(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Upload className="h-3 w-3" />
                    Submit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-full bg-secondary mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No Assignments</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            {isAdminOrTeacher
              ? "Create your first assignment slot to get started."
              : "No assignments have been created yet."}
          </p>
        </div>
      )}

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle>Submissions</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedSlot?.title}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 -mr-2 pr-2">
            {loadingSubmissions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : submissionsData?.data && submissionsData.data.length > 0 ? (
              <div className="space-y-2">
                {submissionsData.data.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{submission.student?.fullname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {submission.student?.email}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(submission.status)}

                      {submission.status === "PENDING" && (
                        <div className="flex items-center gap-1 border-l border-border pl-3 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleReview(submission.id, "ACCEPTED")}
                            disabled={reviewing}
                            title="Accept"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleReview(submission.id, "REJECTED")}
                            disabled={reviewing}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="p-3 rounded-full bg-secondary/50 mb-3">
                  <Upload className="h-5 w-5 opacity-40" />
                </div>
                <p className="text-sm">No submissions yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
