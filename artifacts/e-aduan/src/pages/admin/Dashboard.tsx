import { 
  useGetAdminStats, 
  useGetStatsByCategory, 
  useGetComplaintTrend 
} from "@workspace/api-client-react";
import { 
  FileText, Clock, PlayCircle, CheckCircle2, XCircle, Users, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboardSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#0284c7', '#16a34a', '#eab308', '#dc2626', '#9333ea', '#ea580c'];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: categories, isLoading: catLoading } = useGetStatsByCategory();
  const { data: trends, isLoading: trendLoading } = useGetComplaintTrend();

  if (statsLoading || catLoading || trendLoading) return <AdminDashboardSkeleton />;
  if (!stats) return null;

  const statCards = [
    { title: "Total Complaints", value: stats.totalComplaints, icon: FileText, color: "text-blue-500" },
    { title: "Today", value: stats.todayComplaints, icon: Activity, color: "text-indigo-500" },
    { title: "Pending", value: stats.pendingComplaints, icon: Clock, color: "text-yellow-500" },
    { title: "In Progress", value: stats.inProgressComplaints, icon: PlayCircle, color: "text-blue-400" },
    { title: "Resolved", value: stats.resolvedComplaints, icon: CheckCircle2, color: "text-green-500" },
    { title: "Rejected", value: stats.rejectedComplaints, icon: XCircle, color: "text-red-500" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-slate-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        description="System-wide complaint statistics and metrics."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground line-clamp-1">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    cursor={{fill: 'rgba(0,0,0,0.04)'}}
                    contentStyle={{borderRadius: '8px', fontSize: '12px'}}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No trend data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categories && categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{borderRadius: '8px', fontSize: '12px'}}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No category data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
