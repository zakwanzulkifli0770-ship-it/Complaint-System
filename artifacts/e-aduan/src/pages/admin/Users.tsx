import { useState } from "react";
import { format } from "date-fns";
import { Search, Shield, User, Ban, ShieldAlert, Trash2 } from "lucide-react";
import { useListUsers, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const debouncedSearch = useDebounce(search, 400);

  const queryParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading } = useListUsers(queryParams, { query: { keepPreviousData: true } as any });
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleToggleRole = (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateMutation.mutate(
      { id, data: { role: newRole } },
      {
        onSuccess: () => {
          toast({ title: newRole === "admin" ? "User promoted to admin" : "Admin demoted to user" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
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
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User deleted" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access."
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <TableSkeleton rows={6} cols={4} />
          ) : !data || data.users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No users match your search criteria."
            />
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md overflow-x-auto bg-card">
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
                      <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${u.isBanned ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {u.username}
                                {u.isBanned && (
                                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">BANNED</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'admin' ? (
                            <Badge className="bg-indigo-500 hover:bg-indigo-600">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ConfirmDialog
                              trigger={
                                <Button variant="outline" size="sm" title={`Toggle role to ${u.role === 'admin' ? 'user' : 'admin'}`}>
                                  <ShieldAlert className="w-4 h-4 mr-1.5" />
                                  {u.role === 'admin' ? 'Demote' : 'Promote'}
                                </Button>
                              }
                              title={u.role === 'admin' ? "Demote to user?" : "Promote to admin?"}
                              description={
                                u.role === 'admin'
                                  ? `${u.username} will lose admin access and become a regular user.`
                                  : `${u.username} will gain full admin access to the system.`
                              }
                              confirmLabel={u.role === 'admin' ? "Demote" : "Promote"}
                              variant="default"
                              onConfirm={() => handleToggleRole(u.id, u.role)}
                            />
                            <Button
                              variant={u.isBanned ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleToggleBan(u.id, u.isBanned)}
                            >
                              <Ban className="w-4 h-4 mr-1.5" />
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              }
                              title="Delete user?"
                              description={`This will permanently delete ${u.username} (${u.email}) and all their complaints. This cannot be undone.`}
                              confirmLabel="Delete"
                              onConfirm={() => handleDelete(u.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total} users
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= data.total}>
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
