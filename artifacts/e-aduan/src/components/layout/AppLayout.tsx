import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  User, 
  LogOut, 
  Settings, 
  Users,
  Search,
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/shared/ThemeProvider";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  const navItems = isAdmin ? [
    { label: "Overview", path: "/admin", icon: LayoutDashboard },
    { label: "All Complaints", path: "/admin/complaints", icon: FileText },
    { label: "Users", path: "/admin/users", icon: Users },
  ] : [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "My Complaints", path: "/complaints", icon: FileText },
    { label: "New Complaint", path: "/complaints/new", icon: PlusCircle },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-primary tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground flex-row">
            E
          </div>
          e-Aduan
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 uppercase tracking-wider font-semibold">Smart Management System</p>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.path || (location.startsWith(item.path) && item.path !== "/admin" && item.path !== "/dashboard");
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
              }`}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2">
          <div className="font-medium truncate">{user?.username}</div>
          <div className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded text-sidebar-accent-foreground uppercase tracking-wider font-semibold border border-sidebar-border bg-[#7599eb]">
            {user?.role}
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div className="md:hidden font-semibold">e-Aduan</div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/track">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Search className="h-4 w-4 mr-2" />
                Track Ticket
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
