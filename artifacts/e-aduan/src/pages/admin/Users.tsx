import { useState } from "react";
import { format } from "date-fns";
import { Search, Shield, User, Ban, ShieldAlert, Trash2 } from "lucide-react";
import { useListUsers, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
type UserRole = string;
const UserRole = { admin: "admin", user: "user" } as const;
const UserUpdateRole = { admin: "admin", user: "user" } as const;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryParams = { 
    page, 
    limit, 
    search: debouncedSearch || undefined, 
  };

  const { data, isLoading } = useListUsers(queryParams, { query: { keepPreviousData: true } as any });
  
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleToggleRole = (id: number, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.admin ? UserUpdateRole.user : UserUpdateRole.admin;
    updateMutation.mutate(
      { id, data: { role: newRole } },
      {
        onSuccess: () => {
          toast({ title: "Role updated" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" })
      }
    );
  };

  const handleToggleBan = (id: number, isBanned: boolean) => {
    updateMutation.mutate(
      { id, data: { isBanned: !isBanned } },
      {
        onSuccess: () => {
          toast({ title: isBanned ? "User unbanned" : "User banned" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User deleted" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" })
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage system users, roles, and access.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setTimeout(() => setDebouncedSearch(e.target.value), 500);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <LoadingState />
          ) : !data || data.users.length === 0 ? (
            <EmptyState 
              title="No users found"
              description="No users match your search."
            />
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden bg-card">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Joined</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.users.map((u) => (
                      <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${u.isBanned ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {u.username}
                                {u.isBanned && <Badge variant="destructive" className="h-4 px-1 text-[10px]">BANNED</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'admin' ? (
                            <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleRole(u.id, u.role)}
                            title={`Toggle role to ${u.role === 'admin' ? 'user' : 'admin'}`}
                          >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </Button>
                          <Button 
                            variant={u.isBanned ? "outline" : "destructive"} 
                            size="sm"
                            onClick={() => handleToggleBan(u.id, u.isBanned)}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(u.id)}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} users
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= data.total}
                  >
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
