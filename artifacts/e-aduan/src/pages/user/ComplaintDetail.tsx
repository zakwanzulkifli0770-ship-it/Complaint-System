import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useGetComplaint, useAddComment } from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { ComplaintDetailSkeleton } from "@/components/shared/Skeletons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetComplaintQueryKey } from "@workspace/api-client-react";

const TIMELINE_STEPS = ["Diterima", "Disemak", "Dalam Tindakan", "Selesai"];

function getStepIndex(status: string): number {
  switch (status) {
    case "pending":     return 0;
    case "in_progress": return 2;
    case "resolved":
    case "rejected":    return 3;
    default:            return 0;
  }
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const complaintId = parseInt(id || "0", 10);

  const { data: complaint, isLoading, isError } = useGetComplaint(complaintId, {
    query: { enabled: !!complaintId } as any,
  });

  const addCommentMutation = useAddComment();
  const [newComment, setNewComment] = useState("");

  if (isLoading) return <ComplaintDetailSkeleton />;
  if (isError || !complaint) {
    return (
      <EmptyState
        title="Complaint Not Found"
        description="The requested complaint could not be found or you don't have access."
      />
    );
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(
      { id: complaintId, data: { comment: newComment } },
      {
        onSuccess: () => {
          setNewComment("");
          toast({ title: "Comment added" });
          queryClient.invalidateQueries({ queryKey: getGetComplaintQueryKey(complaintId) });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add comment", variant: "destructive" });
        },
      },
    );
  };

  const currentIndex = getStepIndex(complaint.status);
  const steps = TIMELINE_STEPS.map((label, i) =>
    i === 3 && complaint.status === "rejected" ? "Ditolak" : label
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={isAdmin ? "/admin/complaints" : "/complaints"}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CardTitle className="text-2xl font-mono tracking-tight text-primary">
                  {complaint.ticketId}
                </CardTitle>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <CardDescription>
                Submitted by <span className="font-medium text-foreground">{complaint.username}</span> on{" "}
                {format(new Date(complaint.createdAt), 'PPP p')}
              </CardDescription>
            </div>
            <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md self-start">
              {complaint.category}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="py-2 border-b border-border mb-6 print:hidden">
            <div className="relative flex justify-between w-full mt-4 mb-8">
              <div className="absolute top-3 left-0 w-full h-0.5 bg-muted" />
              <div
                className={`absolute top-3 left-0 h-0.5 transition-all duration-500 ${complaint.status === 'rejected' ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${(currentIndex / 3) * 100}%` }}
              />
              {steps.map((label, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isRejected = complaint.status === "rejected" && isCurrent;

                return (
                  <div key={index} className="relative flex flex-col items-center z-10 w-1/4">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
                        ${isCompleted
                          ? (isRejected ? 'bg-destructive border-destructive' : 'bg-primary border-primary')
                          : 'bg-card border-muted-foreground/30'}
                      `}
                    >
                      {isCompleted && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div className="mt-3 text-center px-1">
                      <div className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{complaint.title}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
            </div>

            {(complaint.location || complaint.phone) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border">
                {complaint.location && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</div>
                    <div className="text-sm">{complaint.location}</div>
                  </div>
                )}
                {complaint.phone && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</div>
                    <div className="text-sm">{complaint.phone}</div>
                  </div>
                )}
              </div>
            )}

            {complaint.imageUrl && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attached Image</div>
                <img
                  src={complaint.imageUrl}
                  alt="Complaint attachment"
                  className="max-h-96 rounded-lg object-contain border bg-muted/50"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments & Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!complaint.comments || complaint.comments.length === 0) ? (
            <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded text-center">
              No comments yet. Updates from the authority team will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {complaint.comments.map((comment) => (
                <div key={comment.id} className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-sm">{comment.adminUsername || 'Admin'}</span>
                      <span className="text-xs text-muted-foreground ml-2 bg-muted px-1.5 py-0.5 rounded">Official</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'PPP p')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 border-t mt-4">
              <h4 className="font-medium text-sm mb-3">Add Official Response</h4>
              <Textarea
                placeholder="Type your official response here..."
                className="mb-3 min-h-[100px]"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button
                onClick={handleAddComment}
                disabled={addCommentMutation.isPending || !newComment.trim()}
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
