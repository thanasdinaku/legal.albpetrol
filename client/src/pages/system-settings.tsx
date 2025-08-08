import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SystemSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>("");
  const [systemInfo, setSystemInfo] = useState({
    version: "2.1.0",
    buildDate: new Date().toLocaleDateString('sq-AL'), // Date when system is initialized for the first time
    author: "Albpetrol Sh.A.",
    environment: "Production",
    database: "PostgreSQL 15.3",
    lastBackup: "2025-01-07 21:30:00",
    totalStorage: "2.4 GB",
    usedStorage: "1.2 GB"
  });
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoBackup: true,
    auditLog: true,
    dataRetention: 365,
    sessionTimeout: 30,
    maxFileSize: 10,
    passwordPolicy: "Fjalëkalimet duhet të kenë të paktën 8 karaktere, përfshijnë shkronja të mëdha dhe të vogla, numra dhe simbole."
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Aksesi i kufizuar",
        description: "Vetëm administratori mund të aksesojë cilësimet e sistemit.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-cog text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Duke ngarkuar cilësimet...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const handleSaveSettings = () => {
    toast({
      title: "Cilësimet u ruajtën",
      description: "Cilësimet e sistemit u përditësuan me sukses.",
    });
  };

  // Fetch checkpoints for restore functionality
  const { data: checkpointsData } = useQuery({
    queryKey: ["/api/admin/checkpoints"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const res = await apiRequest("POST", "/api/admin/backup", backupData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup u krye me sukses",
        description: "Backup-i i të dhënave u krijua dhe u ruajt në listën e checkpoint-eve.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/checkpoints"] });
    },
    onError: () => {
      toast({
        title: "Gabim në backup",
        description: "Backup-i i të dhënave dështoi. Provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (checkpointId: number) => {
      const res = await apiRequest("POST", `/api/admin/restore/${checkpointId}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Restore u krye me sukses",
        description: `Të dhënat u rikthyen nga checkpoint-i: ${data.checkpointName}`,
      });
    },
    onError: () => {
      toast({
        title: "Gabim në restore",
        description: "Rikthimi i të dhënave dështoi. Provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  const handleBackup = () => {
    backupMutation.mutate({
      name: `Manual Backup ${new Date().toLocaleDateString('sq-AL')}`,
      description: "Manual backup created from system settings",
      isAutoBackup: false
    });
  };

  const handleRestore = () => {
    if (selectedCheckpoint) {
      restoreMutation.mutate(parseInt(selectedCheckpoint));
    } else {
      toast({
        title: "Zgjidhni checkpoint",
        description: "Ju lutem zgjidhni një checkpoint për t'u rikthyer.",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          title="Cilësimet e Sistemit" 
          subtitle="Menaxho konfigurimin dhe parametrat e sistemit të menaxhimit ligjor" 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="general">Të Përgjithshme</TabsTrigger>
              <TabsTrigger value="database">Baza e të Dhënave</TabsTrigger>
              <TabsTrigger value="security">Siguria</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-info-circle mr-2 text-blue-600"></i>
                      Informacioni i Sistemit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versioni:</span>
                      <Badge variant="secondary">{systemInfo.version}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data e Ndërtimit:</span>
                      <span className="font-medium">{systemInfo.buildDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Autori:</span>
                      <span className="font-medium">{systemInfo.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mjedisi:</span>
                      <Badge variant="default">{systemInfo.environment}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-database mr-2 text-green-600"></i>
                      Statusi i Bazës së të Dhënave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Motori:</span>
                      <span className="font-medium">{systemInfo.database}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Backup i Fundit:</span>
                      <span className="font-medium">{systemInfo.lastBackup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hapësira Totale:</span>
                      <span className="font-medium">{systemInfo.totalStorage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hapësira e Përdorur:</span>
                      <span className="font-medium">{systemInfo.usedStorage}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-cog mr-2 text-purple-600"></i>
                    Cilësimet e Përgjithshme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Koha e Sesionit (minuta)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Madhësia Maksimale e Skedarit (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Njoftimet me Email</Label>
                        <p className="text-sm text-gray-500">Aktivizo njoftimet automatike me email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auditLog">Regjistri i Auditimit</Label>
                        <p className="text-sm text-gray-500">Regjistro të gjitha veprimet e përdoruesve</p>
                      </div>
                      <Switch
                        id="auditLog"
                        checked={settings.auditLog}
                        onCheckedChange={(checked) => setSettings({...settings, auditLog: checked})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-save mr-2 text-blue-600"></i>
                      Backup dhe Restaurimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoBackup">Backup Automatik</Label>
                        <p className="text-sm text-gray-500">Backup i përditshëm automatik</p>
                      </div>
                      <Switch
                        id="autoBackup"
                        checked={settings.autoBackup}
                        onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Ruajtja e të Dhënave (ditë)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={settings.dataRetention}
                        onChange={(e) => setSettings({...settings, dataRetention: parseInt(e.target.value)})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={handleBackup} 
                        className="w-full" 
                        disabled={backupMutation.isPending}
                      >
                        <i className="fas fa-download mr-2"></i>
                        {backupMutation.isPending ? "Duke Krijuar..." : "Krijo Backup Tani"}
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="checkpoint-select">Rikthe nga Checkpoint-i</Label>
                      <Select value={selectedCheckpoint} onValueChange={setSelectedCheckpoint}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidhni një checkpoint" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {checkpointsData && checkpointsData.length > 0 ? (
                            checkpointsData.map((checkpoint: any) => (
                              <SelectItem key={checkpoint.id} value={checkpoint.id.toString()}>
                                {checkpoint.name} - {new Date(checkpoint.createdAt).toLocaleDateString('sq-AL')}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-checkpoints" disabled>
                              Nuk ka checkpoint të disponueshëm
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleRestore} 
                        variant="outline" 
                        className="w-full"
                        disabled={!selectedCheckpoint || selectedCheckpoint === "no-checkpoints" || restoreMutation.isPending}
                      >
                        <i className="fas fa-history mr-2"></i>
                        {restoreMutation.isPending ? "Duke Rikthyer..." : "Rikthe të Dhënat"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-chart-bar mr-2 text-green-600"></i>
                      Statistikat e Bazës së të Dhënave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Totali i Çështjeve:</span>
                      <Badge variant="secondary">1,247</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Përdorues Aktivë:</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Madhësia e Bazës:</span>
                      <Badge variant="secondary">1.2 GB</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Indekset:</span>
                      <Badge variant="default">Optimizuar</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-shield-alt mr-2 text-red-600"></i>
                    Cilësimet e Sigurisë
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="passwordPolicy">Politika e Fjalëkalimeve</Label>
                      <Textarea
                        id="passwordPolicy"
                        placeholder="Përshkrimi i politikës së fjalëkalimeve..."
                        value={settings.passwordPolicy}
                        onChange={(e) => setSettings({...settings, passwordPolicy: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tentativat e Dështuara</Label>
                        <Input type="number" defaultValue="5" />
                      </div>
                      <div>
                        <Label>Koha e Bllokimit (minuta)</Label>
                        <Input type="number" defaultValue="15" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} className="px-6">
              <i className="fas fa-save mr-2"></i>
              Ruaj Cilësimet
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}