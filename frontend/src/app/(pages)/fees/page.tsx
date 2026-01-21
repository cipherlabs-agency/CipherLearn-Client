"use client";

import { useState } from "react";
import {
  Receipt,
  Download,
  Search,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge as GeistStatusBadge } from "@/components/ui/status-dot";
import { useAppSelector } from "@/redux/hooks";
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi";
import {
  useGetFeeReceiptsQuery,
  useGetReceiptsSummaryQuery,
  useGetMyReceiptsQuery,
  useGetMySummaryQuery,
} from "@/redux/slices/fees/feesApi";
import {
  CreateReceiptDialog,
  BulkCreateReceiptsDialog,
  FeeStructureManager,
  ReceiptDetailDialog,
} from "@/components/fees";
import type { FeeReceipt, PaymentStatus, FeeReceiptFilters } from "@/types";

// Status badge component with Geist-style dot indicator
function StatusBadge({ status }: { status: PaymentStatus }) {
  const variantMap: Record<
    PaymentStatus,
    "paid" | "partial" | "pending" | "overdue"
  > = {
    PAID: "paid",
    PARTIAL: "partial",
    PENDING: "pending",
    OVERDUE: "overdue",
  };

  const labelMap: Record<PaymentStatus, string> = {
    PAID: "Paid",
    PARTIAL: "Partial",
    PENDING: "Pending",
    OVERDUE: "Overdue",
  };

  return (
    <GeistStatusBadge variant={variantMap[status]} pulse={status === "OVERDUE"}>
      {labelMap[status]}
    </GeistStatusBadge>
  );
}

// KPI Card component
function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for receipts table
function ReceiptsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border-b border-border"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Month name helper
function getMonthName(month: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month - 1];
}

// Admin Fees View
function AdminFeesView() {
  const [filters, setFilters] = useState<FeeReceiptFilters>({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(
    null,
  );

  const { data: batches = [] } = useGetAllBatchesQuery();
  const {
    data: receiptsData,
    isLoading: isLoadingReceipts,
    refetch,
  } = useGetFeeReceiptsQuery(filters);
  const { data: summary, isLoading: isLoadingSummary } =
    useGetReceiptsSummaryQuery({
      batchId: filters.batchId,
      academicYear: filters.academicYear || new Date().getFullYear(),
    });

  const receipts = receiptsData?.receipts || [];
  const pagination = receiptsData?.pagination;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))
        ) : (
          <>
            <KPICard
              title="Total Collected"
              value={formatCurrency(summary?.paidAmount || 0)}
              subtext={`${summary?.byStatus.paid || 0} receipts paid`}
              icon={CreditCard}
            />
            <KPICard
              title="Pending Amount"
              value={formatCurrency(summary?.pendingAmount || 0)}
              subtext={`${(summary?.byStatus.pending || 0) + (summary?.byStatus.partial || 0)} receipts pending`}
              icon={Clock}
            />
            <KPICard
              title="Overdue Amount"
              value={formatCurrency(summary?.overdueAmount || 0)}
              subtext={`${summary?.byStatus.overdue || 0} receipts overdue`}
              icon={AlertCircle}
            />
            <KPICard
              title="Total Receipts"
              value={(summary?.totalReceipts || 0).toString()}
              subtext={formatCurrency(summary?.totalAmount || 0) + " total"}
              icon={Receipt}
            />
          </>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={filters.batchId?.toString() || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                batchId: value === "all" ? undefined : parseInt(value),
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id.toString()}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                status: value === "all" ? undefined : (value as PaymentStatus),
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <FeeStructureManager />
          <BulkCreateReceiptsDialog onSuccess={refetch} />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <CreateReceiptDialog onSuccess={refetch} />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Receipt #</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Batch</TableHead>
              <TableHead className="font-semibold">Period</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold text-right">Paid</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingReceipts ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <ReceiptsTableSkeleton />
                </TableCell>
              </TableRow>
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No receipts found. Create your first receipt to get started.
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow
                  key={receipt.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <TableCell className="font-mono text-sm">
                    {receipt.receiptNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {receipt.student?.fullname || "Unknown Student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.student?.email || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {receipt.batch?.name || "No Batch"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getMonthName(receipt.academicMonth)} {receipt.academicYear}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(receipt.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(receipt.paidAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={receipt.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(receipt.dueDate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setFilters({ ...filters, page: pagination.page - 1 })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                setFilters({ ...filters, page: pagination.page + 1 })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Receipt Detail Dialog */}
      {selectedReceipt && (
        <ReceiptDetailDialog
          receipt={selectedReceipt}
          open={!!selectedReceipt}
          onOpenChange={(open) => !open && setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

// Student Fees View
function StudentFeesView() {
  const { data: receipts = [], isLoading: isLoadingReceipts } =
    useGetMyReceiptsQuery();
  const { data: summary, isLoading: isLoadingSummary } = useGetMySummaryQuery();

  if (isLoadingSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Total Paid"
          value={formatCurrency(summary?.totalPaid || 0)}
          icon={CheckCircle}
        />
        <KPICard
          title="Pending Dues"
          value={formatCurrency(summary?.totalPending || 0)}
          subtext={
            summary?.overdueReceipts
              ? `${summary.overdueReceipts} overdue`
              : undefined
          }
          icon={Clock}
        />
        <KPICard
          title="Total Due"
          value={formatCurrency(summary?.totalDue || 0)}
          icon={TrendingUp}
        />
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Your Fee Receipts
        </h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Receipt #</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold text-right">
                  Amount
                </TableHead>
                <TableHead className="font-semibold text-right">Paid</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingReceipts ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <ReceiptsTableSkeleton />
                  </TableCell>
                </TableRow>
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No fee receipts found.
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-sm">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getMonthName(receipt.academicMonth)}{" "}
                      {receipt.academicYear}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(receipt.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(receipt.paidAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={receipt.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(receipt.dueDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Main Fees Page
export default function FeesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-12 py-10 px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">
            Fees Management
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">
            {isAdmin
              ? "Manage student fee receipts, track payments, and generate reports."
              : "View your fee receipts and payment history."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Receipt className="h-5 w-5" />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Content based on role */}
      {isAdmin ? <AdminFeesView /> : <StudentFeesView />}
    </div>
  );
}
