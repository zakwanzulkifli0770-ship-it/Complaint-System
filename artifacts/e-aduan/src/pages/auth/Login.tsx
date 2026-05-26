import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthContext(data.token);
          setLocation("/dashboard");
          toast({
            title: "Welcome back",
            description: "You have successfully logged in.",
          });
        },
        onError: (error) => {
          toast({
            title: "Login failed",
            description: error.data?.error || "An error occurred during login.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-bold text-2xl mb-6">
            <div className="w-10 h-10 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            E-Aduan
          </div>
          <h1 className="text-4xl font-bold leading-tight mt-12 mb-6">
            Government-grade<br/>
            complaint management<br/>
            system.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            Report issues, track progress, and help us build a better environment for everyone.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-sm text-sidebar-foreground/60">
          <Link href="/track">
            <Button variant="outline" className="bg-transparent border-sidebar-foreground/20 hover:bg-sidebar-foreground/10 text-sidebar-foreground">
              <Search className="w-4 h-4 mr-2" />
              Public Ticket Tracker
            </Button>
          </Link>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sidebar-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="md:hidden flex items-center gap-3 font-bold text-2xl mb-8 justify-center">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Building2 className="w-5 h-5" />
            </div>
            E-Aduan
          </div>

          <Card className="border-0 shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
              <CardDescription>
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} disabled={loginMutation.isPending} />
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
                          <Input type="password" placeholder="••••••••" {...field} disabled={loginMutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-0 sm:px-6">
              <div className="text-sm text-center text-muted-foreground w-full">
                Don't have an account?{" "}
                <Link href="/register">
                  <span className="text-primary hover:underline cursor-pointer font-medium">Create one</span>
                </Link>
              </div>
              <div className="md:hidden w-full text-center">
                <Link href="/track">
                  <Button variant="link" className="text-muted-foreground">
                    <Search className="w-4 h-4 mr-2" />
                    Track a ticket instead
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
