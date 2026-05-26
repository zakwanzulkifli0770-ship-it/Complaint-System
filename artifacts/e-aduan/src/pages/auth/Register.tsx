import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useRegister();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthContext(data.token);
          setLocation("/dashboard");
          toast({
            title: "Account created",
            description: "Welcome to e-Aduan.",
          });
        },
        onError: (error) => {
          toast({
            title: "Registration failed",
            description: error.data?.error || "An error occurred during registration.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="md:hidden flex items-center gap-3 font-bold text-2xl mb-8 justify-center">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Building2 className="w-5 h-5" />
            </div>
            e-Aduan
          </div>

          <Card className="border-0 shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Create account</CardTitle>
              <CardDescription>
                Enter your details to create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} disabled={registerMutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} disabled={registerMutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={registerMutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="px-0 sm:px-6">
              <div className="text-sm text-center text-muted-foreground w-full">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-primary hover:underline cursor-pointer font-medium">Sign in</span>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <div className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-end text-right">
          <div className="flex items-center justify-end gap-3 font-bold text-2xl mb-6">
            e-Aduan
            <div className="w-10 h-10 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mt-12 mb-6">
            Empowering citizens,<br/>
            streamlining services.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            Join the platform designed to bridge the gap between citizens and authorities.
          </p>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sidebar-primary/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 translate-x-1/3"></div>
      </div>
    </div>
  );
}