import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useGetComplaintByTicket } from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";

const searchSchema = z.object({
  ticketId: z.string().min(1, { message: "Ticket ID is required" }).toUpperCase(),
});

function Timeline({ status }: { status: string }) {
  const steps = [
    { id: "pending", label: "Diterima" },
    { id: "in_progress", label: "Disemak" },
    { id: "action", label: "Dalam Tindakan" }, // 'in_progress' conceptually covers this, but UI wants 4 steps. We'll map pending->Diterima, in_progress->Disemak/Dalam Tindakan, resolved->Selesai. Let's make a formal timeline.
  ];

  // Map API status to timeline step index (0-3)
  const getStepIndex = () => {
    switch (status) {
      case "pending": return 0;
      case "in_progress": return 2; // Disemak/Dalam Tindakan
      case "resolved": return 3;
      case "rejected": return 3; // Ends at last step but shows rejected
      default: return 0;
    }
  };

  const currentIndex = getStepIndex();
  
  const timelineSteps = [
    { label: "Diterima", description: "Aduan diterima oleh sistem" },
    { label: "Disemak", description: "Pegawai sedang menyemak aduan" },
    { label: "Dalam Tindakan", description: "Tindakan sedang diambil" },
    { label: status === "rejected" ? "Ditolak" : "Selesai", description: status === "rejected" ? "Aduan ditolak" : "Aduan telah diselesaikan" },
  ];

  return (
    <div className="relative flex justify-between w-full mt-8 mb-4">
      {/* Background line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded" />
      
      {/* Active line */}
      <div 
        className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded transition-all duration-500 ${status === 'rejected' ? 'bg-destructive' : 'bg-primary'}`} 
        style={{ width: `${(currentIndex / 3) * 100}%` }} 
      />

      {timelineSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isRejected = status === "rejected" && isCurrent;

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
  );
}

export default function Track() {
  const [searchedTicketId, setSearchedTicketId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { ticketId: "" },
  });

  const { data: complaint, isLoading, isError, error } = useGetComplaintByTicket(
    searchedTicketId || "",
    { query: { enabled: !!searchedTicketId, retry: false } }
  );

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    setSearchedTicketId(values.ticketId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-16 px-4">
      <div className="w-full max-w-3xl space-y-8">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>

        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Track Complaint Status
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enter your ticket ID to check the real-time status of your complaint.
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
                <FormField
                  control={form.control}
                  name="ticketId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="e.g. ADU-123456" 
                          className="h-12 text-lg uppercase" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="h-12 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Track
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}

        {isError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-6 text-center text-destructive">
              <p className="font-semibold">Ticket not found</p>
              <p className="text-sm opacity-90">Please check your ticket number and try again.</p>
            </CardContent>
          </Card>
        )}

        {complaint && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader className="pb-4">
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
                      Submitted on {format(new Date(complaint.createdAt), 'PPP p')}
                    </CardDescription>
                  </div>
                  <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md self-start md:self-auto">
                    Category: {complaint.category}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-6 border-y border-border mb-6">
                  <Timeline status={complaint.status} />
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

            {complaint.comments && complaint.comments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Responses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complaint.comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {comment.adminUsername || 'Admin'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'PPP')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
