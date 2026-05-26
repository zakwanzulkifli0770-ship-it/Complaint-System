import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, MoreVertical, Trash2 } from "lucide-react";
import { useListComplaints, useUpdateComplaint, useDeleteComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected" | "all";
type ComplaintPriority = "low" | "medium" | "critical" | "all";
type ComplaintUpdateStatus = "pending" | "in_progress" | "resolved" | "rejected";
const ComplaintStatus = { pending: "pending", in_progress: "in_progress", resolved: "resolved", rejected: "rejected" } as const;
const ComplaintPriority = { low: "low", medium: "medium", critical: "critical" } as const;
const ComplaintUpdateStatus = { pending: "pending", in_progress: "in_progress", resolved: "resolved", rejected: "rejected" } as const;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminComplaints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [priority, setPriority] = useState<ComplaintPriority | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryParams = { 
    page, 
    limit, 
    search: debouncedSearch || undefined, 
    status: status === "all" ? undefined : status as any,
    priority: priority === "all" ? undefined : priority as any
  };

  const { data, isLoading } = useListComplaints(queryParams, { query: { keepPreviousData: true } as any });
  
  const updateMutation = useUpdateComplaint();
  const deleteMutation = useDeleteComplaint();

  const handleUpdateStatus = (id: number, newStatus: ComplaintUpdateStatus) => {
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey(queryParams) });
        },
        onError: () => {
          toast({ title: "Update failed", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
    
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Complaint deleted" });
          queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey(queryParams) });
        },
        onError: () => {
          toast({ title: "Delete failed", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manage Complaints</h2>
        <p className="text-muted-foreground">View, filter, and process all user complaints.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, title, or username..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTimeout(() => setDebouncedSearch(e.target.value), 500);
                }}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-[160px]">
                <Select value={priority} onValueChange={(val) => { setPriority(val as any); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={ComplaintPriority.low}>Low</SelectItem>
                    <SelectItem value={ComplaintPriority.medium}>Medium</SelectItem>
                    <SelectItem value={ComplaintPriority.critical}>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <Select value={status} onValueChange={(val) => { setStatus(val as any); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={ComplaintStatus.pending}>Pending</SelectItem>
                    <SelectItem value={ComplaintStatus.in_progress}>In Progress</SelectItem>
                    <SelectItem value={ComplaintStatus.resolved}>Resolved</SelectItem>
                    <SelectItem value={ComplaintStatus.rejected}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <LoadingState />
          ) : !data || data.complaints.length === 0 ? (
            <EmptyState 
              title="No complaints found"
              description="No complaints match your current filters."
            />
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden bg-card">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticket ID</th>
                      <th className="px-4 py-3 font-medium w-full">Details</th>
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
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground truncate max-w-[200px] lg:max-w-[400px]">
                            {complaint.title}
                          </div>
                          <div className="text-xs text-muted-foreground">{complaint.category} • {format(new Date(complaint.createdAt), 'MMM d')}</div>
                        </td>
                        <td className="px-4 py-3">
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
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Set Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, ComplaintUpdateStatus.pending)}>
                                Mark Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, ComplaintUpdateStatus.in_progress)}>
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, ComplaintUpdateStatus.resolved)}>
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(complaint.id, ComplaintUpdateStatus.rejected)}>
                                Mark Rejected
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                                onClick={() => handleDelete(complaint.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} entries
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= data.total}
                  >
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
