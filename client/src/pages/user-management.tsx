import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, UserCheck, Calendar, UserPlus, Trash2, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

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

  // Use real API data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['/api/admin/user-stats'],
    enabled: isAuthenticated
  });

  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin'
  });

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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      await apiRequest('/api/admin/users', 'POST', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
      toast({
        title: "User Created",
        description: "New user has been successfully created.",
      });
      setShowAddUserDialog(false);
      setNewUser({ email: '', firstName: '', lastName: '', role: 'user' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">Menaxhimi i Përdoruesve</h1>
          <p className="text-muted-foreground mt-2">
            Menaxho llogaritë e përdoruesve dhe lejet për sistemin e menaxhimit të çështjeve ligjore
          </p>
        </div>
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Shto Përdorues
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Shto Përdorues të Ri</DialogTitle>
              <DialogDescription>
                Krijo një llogari të re përdoruesi dhe cakto rolin e tyre në sistem.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  Emri
                </Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Mbiemri
                </Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Roli
                </Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: 'user' | 'admin') => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Zgjidh një rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Përdorues i Rregullt</SelectItem>
                    <SelectItem value="admin">Administratori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Duke krijuar..." : "Krijo Përdorues"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {(stats as UserStats)?.totalUsers !== undefined && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totali Përdoruesve</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administratorë</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).adminUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Përdorues të Rregullt</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as UserStats).regularUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiv Sot</CardTitle>
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
          <CardTitle>Përdoruesit e Sistemit</CardTitle>
          <CardDescription>
            Menaxhimi i roleve dhe lejeve të përdoruesve parashikon që përdoruesit e rregullt të kenë vetëm të drejtën e shtimit të rasteve ligjore, 
            ndërsa administratorëve u garantohet qasje e plotë për modifikimin, fshirjen dhe menaxhimin e të gjitha të dhënave.
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
                    <TableHead>Përdoruesi</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roli</TableHead>
                    <TableHead>U Bashkua</TableHead>
                    <TableHead>Aktivi i Fundit</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
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
                          {user.role === 'admin' ? 'Administratori' : 'Përdoruesi'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        {user.lastActive ? formatDate(user.lastActive) : 'Kurrë'}
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
                                <SelectItem value="user">Përdorues</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="text-red-600"
                                  disabled={deleteUserMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Fshi Përdoruesin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                        {user.id === currentUser.id && (
                          <Badge variant="outline">Përdoruesi Aktual</Badge>
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
          <CardTitle>Lejet e Roleve</CardTitle>
          <CardDescription>
            Përmbledhje e asaj që mund të bëjë çdo rol në sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Përdorues i Rregullt</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Shiko statistikat e panelit</li>
                <li>• Shto regjistrime të reja të rasteve ligjore</li>
                <li>• Shiko të gjitha të dhënat e rasteve në tabela</li>
                <li>• Eksporto të dhënat (Excel, CSV, PDF)</li>
                <li>• Importo të dhënat nga skedarët CSV</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Administratori</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Të gjitha lejet e përdoruesit të rregullt</li>
                <li>• Modifiko regjistrimet ekzistuese të rasteve ligjore</li>
                <li>• Fshi regjistrimet e rasteve ligjore</li>
                <li>• Menaxho llogaritë dhe rolet e përdoruesve</li>
                <li>• Shiko panelin e menaxhimit të përdoruesve</li>
                <li>• Çaktivizo llogaritë e përdoruesve</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}