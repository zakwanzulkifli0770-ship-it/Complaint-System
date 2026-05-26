import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, Plus } from "lucide-react";
import { useListComplaints } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDebounce } from "@/hooks/use-debounce";
import { COMPLAINT_STATUSES } from "@/lib/constants";

type StatusFilter = "all" | "pending" | "in_progress" | "resolved" | "rejected";

export default function Complaints() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useListComplaints(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : (status as any),
    },
    { query: { keepPreviousData: true } as any },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Manage and track your submitted issues."
        action={
          <Link href="/complaints/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Complaint
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID or title..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {COMPLAINT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <TableSkeleton rows={6} cols={5} />
          ) : !data || data.complaints.length === 0 ? (
            <EmptyState
              title="No complaints found"
              description={debouncedSearch || status !== "all" ? "No complaints match your current filters." : "You haven't submitted any complaints yet."}
              action={!debouncedSearch && status === "all" ? { label: "Submit a Complaint", onClick: () => window.location.href = "/complaints/new" } : undefined}
            />
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticket ID</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.complaints.map((complaint) => (
                      <tr key={complaint.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-primary">
                          <Link href={`/complaints/${complaint.id}`} className="hover:underline">
                            {complaint.ticketId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-medium text-foreground truncate">{complaint.title}</div>
                          <div className="text-xs text-muted-foreground">{complaint.category}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
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
