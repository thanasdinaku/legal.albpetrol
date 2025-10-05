import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, FileText, Settings, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
// import { sq } from "date-fns/locale";  // Albanian locale not available

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: 'full' | 'data-only' | 'config-only';
  description?: string;
  tables: string[];
  recordCount: number;
}

interface BackupProgress {
  stage: string;
  progress: number;
  message: string;
  completed: boolean;
}

export default function BackupRestorePage() {
  const { toast } = useToast();
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<BackupProgress | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Fetch available backups
  const { data: backups, isLoading: backupsLoading, refetch: refetchBackups } = useQuery({
    queryKey: ['/api/system/backups'],
    retry: false,
  });

  // Fetch system status
  const { data: systemStatus } = useQuery({
    queryKey: ['/api/system/status'],
    retry: false,
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (options: { type: 'full' | 'data-only' | 'config-only'; description?: string }) => {
      const response = await fetch('/api/system/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Backup creation failed');
      }

      // Handle streaming progress
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              setBackupProgress(data);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Backup u krijua me sukses",
        description: "Backup-u i sistemit u kompletua me sukses.",
      });
      refetchBackups();
      setBackupProgress(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gabim në krijimin e backup-ut",
        description: error.message,
        variant: "destructive",
      });
      setBackupProgress(null);
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/system/backup/restore/${backupId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Backup restore failed');
      }

      // Handle streaming progress
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              setRestoreProgress(data);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Restaurimi u kompletua me sukses",
        description: "Sistemi u restaurua nga backup-u i zgjedhur.",
      });
      refetchBackups();
      queryClient.invalidateQueries();
      setRestoreProgress(null);
      setSelectedBackup(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gabim në restaurimin e backup-ut",
        description: error.message,
        variant: "destructive",
      });
      setRestoreProgress(null);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/system/backup/delete/${backupId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete backup');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup u fshi me sukses",
        description: "Backup-u u largua nga sistemi.",
      });
      refetchBackups();
    },
    onError: (error: Error) => {
      toast({
        title: "Gabim në fshirjen e backup-ut",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = (type: 'full' | 'data-only' | 'config-only') => {
    const description = prompt('Përshkrimi i backup-ut (opsional):');
    createBackupMutation.mutate({ type, description: description || undefined });
  };

  const handleRestoreBackup = (backupId: string) => {
    if (confirm('Jeni i sigurt që doni të restauroni këtë backup? Të gjitha të dhënat aktuale do të zëvendësohen.')) {
      restoreBackupMutation.mutate(backupId);
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    if (confirm('Jeni i sigurt që doni të fshini këtë backup? Ky veprim nuk mund të kthehet.')) {
      deleteBackupMutation.mutate(backupId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'I plotë';
      case 'data-only': return 'Vetëm të dhëna';
      case 'config-only': return 'Vetëm konfigurimi';
      default: return type;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'data-only': return 'bg-blue-100 text-blue-800';
      case 'config-only': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup dhe Restaurim</h1>
          <p className="text-gray-600 mt-2">
            Menaxhoni backup-et e sistemit dhe restauroni të dhënat në rast nevoje
          </p>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statusi i Sistemit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Databaza</p>
                  <p className="text-sm text-gray-600">{(systemStatus as any).database?.status || 'Aktive'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Të dhënat</p>
                  <p className="text-sm text-gray-600">{(systemStatus as any).totalRecords || 0} regjistra</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Backup i fundit</p>
                  <p className="text-sm text-gray-600">
                    {(systemStatus as any).lastBackup ? 
                      format(new Date((systemStatus as any).lastBackup), 'dd MMM yyyy HH:mm') : 
                      'Asnjë'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Krijo Backup të Ri
          </CardTitle>
          <CardDescription>
            Krijoni një kopje rezervë të sistemit për siguri maksimale
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupProgress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="h-4 w-4 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium">{backupProgress.stage}</p>
                  <p className="text-sm text-gray-600">{backupProgress.message}</p>
                </div>
              </div>
              <Progress value={backupProgress.progress} className="w-full" />
              <p className="text-sm text-gray-500 text-center">
                {backupProgress.progress}% e kompletuar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleCreateBackup('full')}
                disabled={createBackupMutation.isPending}
                className="h-20 flex flex-col gap-2"
                data-testid="button-create-full-backup"
              >
                <Database className="h-6 w-6" />
                <span>Backup i Plotë</span>
                <span className="text-xs opacity-75">Të dhëna + Konfigurimi</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateBackup('data-only')}
                disabled={createBackupMutation.isPending}
                className="h-20 flex flex-col gap-2"
                data-testid="button-create-data-backup"
              >
                <FileText className="h-6 w-6" />
                <span>Vetëm të Dhëna</span>
                <span className="text-xs opacity-75">Pa konfigurimin</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateBackup('config-only')}
                disabled={createBackupMutation.isPending}
                className="h-20 flex flex-col gap-2"
                data-testid="button-create-config-backup"
              >
                <Settings className="h-6 w-6" />
                <span>Vetëm Konfigurimi</span>
                <span className="text-xs opacity-75">Pa të dhënat</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Backup-et e Disponueshme
          </CardTitle>
          <CardDescription>
            Zgjidhni një backup për ta restauruar ose për ta fshirë
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restoreProgress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Upload className="h-4 w-4 text-green-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium">{restoreProgress.stage}</p>
                  <p className="text-sm text-gray-600">{restoreProgress.message}</p>
                </div>
              </div>
              <Progress value={restoreProgress.progress} className="w-full" />
              <p className="text-sm text-gray-500 text-center">
                {restoreProgress.progress}% e kompletuar
              </p>
            </div>
          ) : backupsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Database className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-gray-500 mt-2">Duke ngarkuar backup-et...</p>
            </div>
          ) : !backups || (backups as any[]).length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nuk ka backup-e të disponueshme</p>
              <p className="text-sm text-gray-400 mt-1">Krijoni një backup të ri për të filluar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(backups as BackupInfo[]).map((backup: BackupInfo) => (
                <div
                  key={backup.id}
                  className={`border rounded-lg p-4 ${
                    selectedBackup === backup.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  data-testid={`backup-item-${backup.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Database className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{backup.filename}</p>
                          <Badge className={getBackupTypeColor(backup.type)}>
                            {getBackupTypeLabel(backup.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(new Date(backup.createdAt), 'dd MMM yyyy HH:mm')} • {' '}
                          {formatFileSize(backup.size)} • {backup.recordCount} regjistra
                        </p>
                        {backup.description && (
                          <p className="text-sm text-gray-500 mt-1">{backup.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBackup(selectedBackup === backup.id ? null : backup.id)}
                        data-testid={`button-select-backup-${backup.id}`}
                      >
                        {selectedBackup === backup.id ? 'Anulo' : 'Zgjidh'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={deleteBackupMutation.isPending}
                        data-testid={`button-delete-backup-${backup.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedBackup === backup.id && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Kujdes:</strong> Restaurimi do të zëvendësojë të gjitha të dhënat aktuale. 
                            Rekomandohet të krijoni një backup para restaurimit.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Tabela të përfshira:</p>
                            <p className="text-sm text-gray-600">
                              {backup.tables.join(', ')}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={restoreBackupMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700"
                            data-testid={`button-restore-backup-${backup.id}`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Restauro Tani
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}