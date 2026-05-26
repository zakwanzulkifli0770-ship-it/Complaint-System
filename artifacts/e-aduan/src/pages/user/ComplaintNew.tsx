import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateComplaint } from "@workspace/api-client-react";
type ComplaintInputPriority = "low" | "medium" | "critical";
const ComplaintInputPriority = { low: "low", medium: "medium", critical: "critical" } as const;
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categories = [
  "Kemudahan Awam",
  "Keselamatan",
  "Kebersihan",
  "Infrastruktur",
  "Perkhidmatan",
  "Lain-lain"
];

const complaintSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  priority: z.nativeEnum(ComplaintInputPriority),
  location: z.string().optional(),
  phone: z.string().optional(),
  imageUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

export default function ComplaintNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createComplaintMutation = useCreateComplaint();
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      priority: ComplaintInputPriority.low,
      location: "",
      phone: "",
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof complaintSchema>) => {
    // Clean up empty strings
    const payload = {
      ...values,
      location: values.location || undefined,
      phone: values.phone || undefined,
      imageUrl: values.imageUrl || undefined,
    };

    createComplaintMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          setSuccessTicketId(data.ticketId);
        },
        onError: (error) => {
          toast({
            title: "Submission failed",
            description: error.data?.error || "An error occurred while submitting.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Submit New Complaint</h2>
        <p className="text-muted-foreground">Fill out the form below to report an issue.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ComplaintInputPriority.low}>Rendah (Low)</SelectItem>
                          <SelectItem value={ComplaintInputPriority.medium}>Sederhana (Medium)</SelectItem>
                          <SelectItem value={ComplaintInputPriority.critical}>Kritikal (Critical)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide as much detail as possible..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific area or building" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="For follow-up if needed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Link to an image showing the issue.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createComplaintMutation.isPending}>
                  {createComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={!!successTicketId} onOpenChange={(open) => {
        if (!open) {
          setSuccessTicketId(null);
          setLocation("/complaints");
        }
      }}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-primary mb-2">Complaint Submitted</DialogTitle>
            <DialogDescription className="text-center text-base">
              Your complaint has been successfully recorded.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 p-6 bg-muted rounded-lg border border-border">
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Your Ticket Number</div>
            <div className="text-3xl font-mono font-bold tracking-tighter text-foreground">{successTicketId}</div>
          </div>
          
          <DialogDescription className="text-center mb-6">
            Please save this ticket number. You can use it to track the status of your complaint on the public tracker.
          </DialogDescription>
          
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setLocation("/complaints")} className="w-full sm:w-auto">
              View My Complaints
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
