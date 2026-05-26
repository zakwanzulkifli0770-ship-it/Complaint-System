import { Link } from "wouter";
import { useGetUserDashboard } from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  FileText, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  XCircle,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { PageHeader } from "@/components/shared/PageHeader";

export default function Dashboard() {
  const { data, isLoading } = useGetUserDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const statCards = [
    { title: "Total", value: data.totalComplaints, icon: FileText, color: "text-blue-500" },
    { title: "Pending", value: data.pendingComplaints, icon: Clock, color: "text-yellow-500" },
    { title: "In Progress", value: data.inProgressComplaints, icon: PlayCircle, color: "text-blue-400" },
    { title: "Resolved", value: data.resolvedComplaints, icon: CheckCircle2, color: "text-green-500" },
    { title: "Rejected", value: data.rejectedComplaints, icon: XCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your submitted complaints."
        action={
          <Link href="/complaints/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Complaint
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Complaints</CardTitle>
          <CardDescription>Your 5 most recently submitted issues.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentComplaints.length === 0 ? (
            <EmptyState 
              title="No complaints yet"
              description="You haven't submitted any complaints. Click the button above to start."
              action={{ label: "Submit Complaint", onClick: () => window.location.href = "/complaints/new" }}
            />
          ) : (
            <div className="space-y-3">
              {data.recentComplaints.map((complaint) => (
                <div key={complaint.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/complaints/${complaint.id}`}>
                        <span className="font-mono text-sm font-semibold text-primary hover:underline cursor-pointer">
                          {complaint.ticketId}
                        </span>
                      </Link>
                      <span className="text-sm font-medium">{complaint.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{format(new Date(complaint.createdAt), 'PP')}</span>
                      <span>·</span>
                      <span>{complaint.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {data.recentComplaints.length > 0 && (
            <div className="mt-4 text-center">
              <Link href="/complaints">
                <Button variant="outline" size="sm">View All Complaints</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
