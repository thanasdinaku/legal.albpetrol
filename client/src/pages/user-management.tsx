import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, UserCheck, Calendar } from "lucide-react";
import { useEffect } from "react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  profileImageUrl?: string;
  createdAt: string;
  lastActive?: string;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  activeToday: number;
}

export default function UserManagement() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin (truealbos@gmail.com)
  const isAdmin = currentUser?.id === "46078954";

  // Debug logging
  useEffect(() => {
    console.log("User Management Debug:", {
      currentUser,
      isAdmin,
      isAuthenticated,
      isLoading
    });
  }, [currentUser, isAdmin, isAuthenticated, isLoading]);

  // Simplified access control for testing
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // For now, let's show mock data until API is working
  const mockUsers = [
    {
      id: "46078954",
      email: "truealbos@gmail.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin" as const,
      profileImageUrl: "https://replit.com/public/images/mark.png",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }
  ];

  const mockStats = {
    totalUsers: 1,
    adminUsers: 1,
    regularUsers: 0,
    activeToday: 1
  };

  const users = mockUsers;
  const stats = mockStats;
  const usersLoading = false;

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      await apiRequest(`/api/admin/users/${userId}/role`, 'PUT', { role });
    },
    onSuccess: (_, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
      toast({
        title: "Role Updated",
        description: `User role has been changed to ${role}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}/deactivate`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
      toast({
        title: "User Deactivated",
        description: "User has been successfully deactivated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-users text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email.split('@')[0];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions for the legal case management system
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {(stats as UserStats)?.totalUsers !== undefined && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).adminUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).regularUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).activeToday}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Normal users can only add legal cases, 
            while administrators have full access to edit, delete, and manage all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users as User[]).map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt={getDisplayName(user)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">{getDisplayName(user)}</span>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        {user.lastActive ? formatDate(user.lastActive) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.id !== currentUser.id && (
                          <>
                            <Select
                              value={user.role}
                              onValueChange={(role: 'user' | 'admin') => 
                                updateRoleMutation.mutate({ userId: user.id, role })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateUserMutation.mutate(user.id)}
                              disabled={deactivateUserMutation.isPending}
                            >
                              Deactivate
                            </Button>
                          </>
                        )}
                        {user.id === currentUser.id && (
                          <Badge variant="outline">Current User</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Overview of what each role can do in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Regular User</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View dashboard statistics</li>
                <li>• Add new legal case entries</li>
                <li>• View all case data in tables</li>
                <li>• Export data (Excel, CSV, PDF)</li>
                <li>• Import data from CSV files</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Administrator</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• All regular user permissions</li>
                <li>• Edit existing legal case entries</li>
                <li>• Delete legal case entries</li>
                <li>• Manage user accounts and roles</li>
                <li>• View user management dashboard</li>
                <li>• Deactivate user accounts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}