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
import { AlertCircle, Plus, X, TestTube, Mail, Download, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SystemSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: "2.1.0",
    buildDate: new Date().toLocaleDateString('sq-AL'), // Date when system is initialized for the first time
    author: "Albpetrol Sh.A.",
    environment: "Production",
    database: "PostgreSQL 15.3"
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



  const handleSaveEmailSettings = () => {
    saveEmailMutation.mutate(emailSettings);
  };

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@') && !emailSettings.emailAddresses.includes(newEmail)) {
      setEmailSettings({
        ...emailSettings,
        emailAddresses: [...emailSettings.emailAddresses, newEmail]
      });
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailSettings({
      ...emailSettings,
      emailAddresses: emailSettings.emailAddresses.filter(email => email !== emailToRemove)
    });
  };

  const handleTestEmail = () => {
    testEmailMutation.mutate();
  };

  // Fetch database statistics
  const { data: dbStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ["/api/admin/user-stats"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Fetch database statistics
  const { data: databaseStats } = useQuery({
    queryKey: ["/api/admin/database-stats"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Email notification settings state
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    emailAddresses: [] as string[],
    subject: "Hyrje e re në sistemin e menaxhimit të çështjeve ligjore",
    includeDetails: true
  });

  const [newEmail, setNewEmail] = useState("");

  // Fetch email notification settings
  const { data: emailData, isLoading: emailLoading } = useQuery({
    queryKey: ["/api/admin/email-settings"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Update email settings when data is fetched
  useEffect(() => {
    if (emailData && typeof emailData === 'object') {
      const data = emailData as any;
      setEmailSettings({
        enabled: data.enabled ?? true,
        emailAddresses: data.emailAddresses ?? [],
        subject: data.subject ?? "Hyrje e re në sistemin e menaxhimit të çështjeve ligjore",
        includeDetails: data.includeDetails ?? true
      });
    }
  }, [emailData]);

  // Save email notification settings mutation
  const saveEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const res = await apiRequest("/api/admin/email-settings", "PUT", emailData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cilësimet e email-it u ruajtën",
        description: "Konfigurimi i njoftimeve me email u përditësua me sukses.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
    },
    onError: () => {
      toast({
        title: "Gabim në ruajtje",
        description: "Cilësimet e email-it nuk u ruajtën. Provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  // Test email connection mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/test-email", "POST", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Testimi i suksesshëm" : "Testimi dështoi",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Gabim në testim",
        description: "Nuk mund të testohet lidhja me serverin e email-it.",
        variant: "destructive",
      });
    },
  });





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

                {/* User Manual Download Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                      Manuali i Përdoruesit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Shkarkoni manualin e plotë të përdoruesit për udhëzime të detajuara mbi përdorimin e sistemit.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Format:</span>
                        <Badge variant="outline">PDF</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Gjuha:</span>
                        <Badge variant="outline">Shqip</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Versioni:</span>
                        <Badge variant="outline">2.0</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/download/user-manual');
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'Manuali_i_Perdoruesit_Albpetrol.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            toast({
                              title: "Manuali u Shkarkua",
                              description: "Manuali i përdoruesit është shkarkuar me sukses.",
                            });
                          } else {
                            throw new Error('Failed to download manual');
                          }
                        } catch (error) {
                          console.error('Download error:', error);
                          toast({
                            title: "Gabim në Shkarkim",
                            description: "Dështoi shkarkimi i manualit. Ju lutemi provoni përsëri.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full"
                      variant="default"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Shkarko Manualin PDF
                    </Button>
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
                      <span className="text-gray-600">Hapësira Totale:</span>
                      <span className="font-medium">{(databaseStats as any)?.totalStorage || "100.0 MB"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hapësira e Përdorur:</span>
                      <span className="font-medium">{(databaseStats as any)?.usedStorage || "7.9 MB"}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(databaseStats as any)?.usagePercentage || 8}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-1">
                      {(databaseStats as any)?.usagePercentage || 8}% e përdorur
                    </div>
                  </CardContent>
                </Card>
              </div>


            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="max-w-2xl mx-auto">
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
                      <Badge variant="secondary">{(dbStats as any)?.totalEntries || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Çështje të Krijuara Sot:</span>
                      <Badge variant="secondary">{(dbStats as any)?.todayEntries || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Përdorues Aktivë:</span>
                      <Badge variant="secondary">{(userStats as any)?.totalUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Administratorë:</span>
                      <Badge variant="secondary">{(userStats as any)?.adminUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Përdorues Regularë:</span>
                      <Badge variant="secondary">{(userStats as any)?.regularUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Madhësia e Bazës:</span>
                      <Badge variant="secondary">{(databaseStats as any)?.usedStorage || "7.9 MB"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Indekset:</span>
                      <Badge variant="default">Optimizuar</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versioni i Bazës:</span>
                      <Badge variant="secondary">{systemInfo.database}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="mr-2 h-5 w-5 text-blue-600" />
                      Njoftimet me Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailEnabled">Aktivizo Njoftimet</Label>
                        <p className="text-sm text-gray-500">Dërgo email kur shtohen çështje të reja</p>
                      </div>
                      <Switch
                        id="emailEnabled"
                        checked={emailSettings.enabled}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, enabled: checked})}
                      />
                    </div>

                    {emailSettings.enabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="emailSubject">Tema e Email-it</Label>
                          <Input
                            id="emailSubject"
                            value={emailSettings.subject}
                            onChange={(e) => setEmailSettings({...emailSettings, subject: e.target.value})}
                            placeholder="Tema e email-it..."
                          />
                        </div>

                        <div className="space-y-4">
                          <Label>Adresat e Email-it</Label>
                          
                          <div className="flex gap-2">
                            <Input
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="Shtoni adresë email..."
                              type="email"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                            />
                            <Button 
                              onClick={handleAddEmail}
                              disabled={!newEmail || !newEmail.includes('@')}
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {emailSettings.emailAddresses.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">Adresat e konfiguruar:</p>
                              <div className="space-y-2">
                                {emailSettings.emailAddresses.map((email, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <span className="text-sm">{email}</span>
                                    <Button
                                      onClick={() => handleRemoveEmail(email)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {emailSettings.emailAddresses.length === 0 && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Asnjë adresë email</AlertTitle>
                              <AlertDescription>
                                Shtoni të paktën një adresë email për të marrë njoftimet.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="includeDetails">Përfshi Detajet</Label>
                            <p className="text-sm text-gray-500">Përfshi detajet e çështjes në email</p>
                          </div>
                          <Switch
                            id="includeDetails"
                            checked={emailSettings.includeDetails}
                            onCheckedChange={(checked) => setEmailSettings({...emailSettings, includeDetails: checked})}
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={handleSaveEmailSettings}
                            disabled={saveEmailMutation.isPending || emailSettings.emailAddresses.length === 0}
                            className="flex-1"
                          >
                            {saveEmailMutation.isPending ? "Duke ruajtur..." : "Ruaj Cilësimet"}
                          </Button>
                          <Button 
                            onClick={handleTestEmail}
                            disabled={testEmailMutation.isPending}
                            variant="outline"
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            {testEmailMutation.isPending ? "Duke testuar..." : "Test"}
                          </Button>
                        </div>
                      </>
                    )}
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
                  <div>
                    <Label htmlFor="passwordPolicy">Politika e Fjalëkalimeve</Label>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 leading-relaxed">
                      <p className="font-semibold mb-2">Kërkesat për Fjalëkalimin:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Të paktën 8 karaktere</li>
                        <li>Të paktën një shkronjë të madhe (A-Z)</li>
                        <li>Të paktën një numër (0-9)</li>
                        <li>Të paktën një karakter special (!@#$%^&*)</li>
                      </ul>
                      <p className="mt-3 text-xs text-gray-600">
                        Fjalëkalimet e forta mbrojnë të dhënat tuaja dhe sigurojnë aksesim të sigurt në sistem.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </main>
      </div>
    </div>
  );
}