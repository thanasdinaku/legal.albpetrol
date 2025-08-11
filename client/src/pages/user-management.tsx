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
import { Users, Shield, UserCheck, Calendar, UserPlus, Trash2, MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is admin
  const isAdmin = currentUser?.role === "admin";

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdUserEmail, setCreatedUserEmail] = useState('');
  const [resetPasswordUserEmail, setResetPasswordUserEmail] = useState('');
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
      console.log('Creating user with data:', userData);
      
      // Validate form data before sending
      if (!userData.email || !userData.firstName) {
        throw new Error('Email dhe emri janë të detyrueshme');
      }
      
      const response = await apiRequest('/api/admin/users', 'POST', userData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('User creation failed:', errorText);
        throw new Error(`Failed to create user: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('User creation response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('User created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
      
      // Show the temporary password to the admin
      if (data.tempPassword) {
        setGeneratedPassword(data.tempPassword);
        setCreatedUserEmail(data.email);
        setShowAddUserDialog(false);
        setShowPasswordDialog(true);
      } else {
        // Fallback success message if tempPassword is missing
        toast({
          title: "Përdoruesi u Krijua",
          description: "Përdoruesi i ri është krijuar me sukses.",
        });
        setShowAddUserDialog(false);
      }
      
      setNewUser({ email: '', firstName: '', lastName: '', role: 'user' });
    },
    onError: (error: any) => {
      console.error('User creation error:', error);
      toast({
        title: "Gabim",
        description: error.message || "Dështoi krijimi i përdoruesit. Ju lutemi provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}/reset-password`, 'POST');
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      return response.json();
    },
    onSuccess: (data, userId) => {
      // Find the user to get their email
      const user = (users as User[]).find((u: User) => u.id === userId);
      if (data.tempPassword) {
        setGeneratedPassword(data.tempPassword);
        setResetPasswordUserEmail(user?.email || '');
        setShowPasswordDialog(true);
      }
      toast({
        title: "Fjalëkalimi u Rivendos",
        description: "Fjalëkalimi i ri i përkohshëm është krijuar me sukses.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gabim",
        description: "Dështoi rivendosja e fjalëkalimit. Ju lutemi provoni përsëri.",
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          title="Menaxhimi i Përdoruesve" 
          subtitle="Menaxhimi i llogarive të përdoruesve dhe i lejeve për sistemin" 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Menaxhimi i Përdoruesve</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Menaxhimi i llogarive të përdoruesve dhe i lejeve për sistemin e menaxhimit të çështjeve ligjore.
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
                onClick={() => {
                  console.log('Creating user with form data:', newUser);
                  if (!newUser.email.trim() || !newUser.firstName.trim()) {
                    toast({
                      title: "Gabim",
                      description: "Email dhe emri janë të detyrueshme.",
                      variant: "destructive",
                    });
                    return;
                  }
                  createUserMutation.mutate(newUser);
                }}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Duke krijuar..." : "Krijo Përdorues"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Display Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-key mr-2 text-green-600"></i>
                {resetPasswordUserEmail ? 'Fjalëkalimi u Rivendos me Sukses' : 'Përdoruesi u Krijua me Sukses'}
              </DialogTitle>
              <DialogDescription>
                Fjalëkalimi i përkohshëm për përdoruesin <strong>{resetPasswordUserEmail || createdUserEmail}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                  <span className="font-medium text-yellow-800">Fjalëkalimi i Përkohshëm</span>
                </div>
                <div className="bg-white border rounded p-3 font-mono text-lg select-all">
                  {generatedPassword}
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Kopjoni këtë fjalëkalim dhe ndajeni me përdoruesin. Ai duhet të ndryshojë fjalëkalimin në hyrjen e parë.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                  <span className="font-medium text-blue-800">Udhëzime për Përdoruesin</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Hyrja e parë kërkon ndryshimin e fjalëkalimit</li>
                  <li>• Përdoruesi mund ta ndryshojë fjalëkalimin sa herë të dojë</li>
                  <li>• Fjalëkalimi duhet të jetë i sigurt dhe unik</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  toast({
                    title: "U Kopjua",
                    description: "Fjalëkalimi u kopjua në clipboard.",
                  });
                }}
                variant="outline"
                className="mr-2"
              >
                <i className="fas fa-copy mr-2"></i>
                Kopjo Fjalëkalimin
              </Button>
              <Button onClick={() => {
                setShowPasswordDialog(false);
                setResetPasswordUserEmail('');
              }}>
                <i className="fas fa-check mr-2"></i>
                U Kuptua
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
                        {currentUser && user.id !== currentUser.id && (
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
                                  onClick={() => resetPasswordMutation.mutate(user.id)}
                                  disabled={resetPasswordMutation.isPending}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Rivendos Fjalëkalimin
                                </DropdownMenuItem>
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
                        {currentUser && user.id === currentUser.id && (
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
            Përmbledhje e funksionaliteteve që mund të kryejë çdo rol në sistem
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
                <li>• Shikon statistikat e panelit</li>
                <li>• Shton regjistrime të reja të rasteve ligjore</li>
                <li>• Shikon të gjitha të dhënat e rasteve në tabela</li>
                <li>• Eksporton të dhënat (Excel, CSV)</li>
                <li>• Editon të dhënat e regjistrimeve që krijon vetë</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Administratori</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Përmban të gjitha lejet e përdoruesit të rregullt</li>
                <li>• Modifikon regjistrimet ekzistuese të rasteve ligjore</li>
                <li>• Fshin regjistrimet e rasteve ligjore</li>
                <li>• Menaxhon llogaritë dhe rolet e përdoruesve</li>
                <li>• Shikon panelin e menaxhimit të përdoruesve</li>
                <li>• Çaktivizon llogaritë e përdoruesve</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
          </div>
        </main>
      </div>
    </div>
  );
}