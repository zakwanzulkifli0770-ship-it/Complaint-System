import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, MoreVertical, Trash2 } from "lucide-react";
import { useListComplaints, useUpdateComplaint, useDeleteComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from "@/lib/constants";

type StatusFilter = "all" | "pending" | "in_progress" | "resolved" | "rejected";
type PriorityFilter = "all" | "low" | "medium" | "critical";

export default function AdminComplaints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const debouncedSearch = useDebounce(search, 400);

  const queryParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : (status as any),
    priority: priority === "all" ? undefined : (priority as any),
  };

  const { data, isLoading } = useListComplaints(queryParams, { query: { keepPreviousData: true } as any });
  const updateMutation = useUpdateComplaint();
  const deleteMutation = useDeleteComplaint();

  const handleUpdateStatus = (id: number, newStatus: "pending" | "in_progress" | "resolved" | "rejected") => {
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Complaint deleted" });
          queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Complaints"
        description="View, filter, and process all user complaints."
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, title, or category..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex gap-3">
              <Select value={priority} onValueChange={(v) => { setPriority(v as PriorityFilter); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {COMPLAINT_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {COMPLAINT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <TableSkeleton rows={8} cols={6} />
          ) : !data || data.complaints.length === 0 ? (
            <EmptyState
              title="No complaints found"
              description="No complaints match your current filters."
            />
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md overflow-x-auto bg-card">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticket ID</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-primary">
                          <Link href={`/complaints/${complaint.id}`} className="hover:underline">
                            {complaint.ticketId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="font-medium text-foreground truncate">{complaint.title}</div>
                          <div className="text-xs text-muted-foreground">{complaint.category} · {format(new Date(complaint.createdAt), 'MMM d, yyyy')}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {complaint.username || `User #${complaint.userId}`}
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/complaints/${complaint.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Set Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, "pending")}>
                                Mark Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, "in_progress")}>
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, "resolved")}>
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, "rejected")}>
                                Mark Rejected
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <ConfirmDialog
                                trigger={
                                  <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Complaint
                                  </DropdownMenuItem>
                                }
                                title="Delete complaint?"
                                description={`This will permanently delete "${complaint.title}" (${complaint.ticketId}). This action cannot be undone.`}
                                confirmLabel="Delete"
                                onConfirm={() => handleDelete(complaint.id)}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total} entries
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= data.total}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
