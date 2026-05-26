import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useGetComplaint, useAddComment } from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetComplaintQueryKey } from "@workspace/api-client-react";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const complaintId = parseInt(id || "0", 10);
  
  const { data: complaint, isLoading, isError } = useGetComplaint(complaintId, {
    query: { enabled: !!complaintId }
  });

  const addCommentMutation = useAddComment();
  const [newComment, setNewComment] = useState("");

  if (isLoading) return <LoadingState message="Loading complaint details..." />;
  if (isError || !complaint) return <EmptyState title="Not Found" description="The requested complaint could not be found." />;

  const handlePrint = () => {
    window.print();
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate(
      { id: complaintId, data: { comment: newComment } },
      {
        onSuccess: (data) => {
          setNewComment("");
          toast({ title: "Comment added" });
          // Update cache manually or invalidate
          queryClient.invalidateQueries({ queryKey: getGetComplaintQueryKey(complaintId) });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add comment", variant: "destructive" });
        }
      }
    );
  };

  const getStepIndex = () => {
    switch (complaint.status) {
      case "pending": return 0;
      case "in_progress": return 2;
      case "resolved": return 3;
      case "rejected": return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex();
  
  const timelineSteps = [
    { label: "Diterima" },
    { label: "Disemak" },
    { label: "Dalam Tindakan" },
    { label: complaint.status === "rejected" ? "Ditolak" : "Selesai" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={isAdmin ? "/admin/complaints" : "/complaints"}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl font-mono tracking-tight text-primary">
                  {complaint.ticketId}
                </CardTitle>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <CardDescription>
                Submitted by <span className="font-medium text-foreground">{complaint.username}</span> on {format(new Date(complaint.createdAt), 'PPP p')}
              </CardDescription>
            </div>
            <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md self-start md:self-auto">
              Category: {complaint.category}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="py-2 border-b border-border mb-6 print:hidden">
            <div className="relative flex justify-between w-full mt-4 mb-8">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded" />
              <div 
                className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded transition-all duration-500 ${complaint.status === 'rejected' ? 'bg-destructive' : 'bg-primary'}`} 
                style={{ width: `${(currentIndex / 3) * 100}%` }} 
              />

              {timelineSteps.map((step, index) => {
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
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
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
              <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
            </div>
            
            {(complaint.location || complaint.phone) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                {complaint.location && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</div>
                    <div>{complaint.location}</div>
                  </div>
                )}
                {complaint.phone && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</div>
                    <div>{complaint.phone}</div>
                  </div>
                )}
              </div>
            )}

            {complaint.imageUrl && (
              <div className="mt-4">
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
          <CardTitle className="text-lg">Comments & Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!complaint.comments || complaint.comments.length === 0) ? (
            <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded text-center">
              No comments yet.
            </div>
          ) : (
            <div className="space-y-4">
              {complaint.comments.map((comment) => (
                <div key={comment.id} className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">
                      {comment.adminUsername || 'Admin'} <span className="text-xs font-normal text-muted-foreground ml-1">(Admin)</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'PPP p')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 border-t mt-6">
              <h4 className="font-medium text-sm mb-3">Add Official Response</h4>
              <Textarea 
                placeholder="Type your comment here..." 
                className="mb-3"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleAddComment} disabled={addCommentMutation.isPending || !newComment.trim()}>
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
