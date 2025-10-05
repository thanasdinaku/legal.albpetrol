import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Users, AlertTriangle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function CaseTransferPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [fromUserId, setFromUserId] = useState<string>("");
  const [toUserId, setToUserId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not admin
  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Transfer cases mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/transfer-cases", {
        fromUserId,
        toUserId,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Transferimi u krye me sukses",
        description: data.message,
      });
      // Reset form
      setFromUserId("");
      setToUserId("");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gabim në transferim",
        description: error.message || "Nuk u arrit të transferohen çështjet",
        variant: "destructive",
      });
    },
  });

  const handleTransferClick = () => {
    if (!fromUserId || !toUserId) {
      toast({
        title: "Zgjidhni përdoruesit",
        description: "Duhet të zgjidhni si përdoruesin burim ashtu edhe atë destinacion",
        variant: "destructive",
      });
      return;
    }

    if (fromUserId === toUserId) {
      toast({
        title: "Përdorues të njëjtë",
        description: "Nuk mund të transferoni çështje tek i njëjti përdorues",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = () => {
    setShowConfirmDialog(false);
    transferMutation.mutate();
  };

  const fromUser = users.find(u => u.id === fromUserId);
  const toUser = users.find(u => u.id === toUserId);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          title="Transferimi i Çështjeve" 
          subtitle="Transferoni të gjitha çështjet ligjore nga një përdorues tek një tjetër" 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="container mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  Transferimi i Çështjeve Ligjore
                </CardTitle>
                <CardDescription>
                  Transferoni të gjitha çështjet ligjore nga një përdorues tek një tjetër.
                  Kjo është e dobishme kur një punonjës largohet ose ndryshon pozicion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* From User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nga Përdoruesi (Burimi)
                </label>
                <Select
                  value={fromUserId}
                  onValueChange={setFromUserId}
                  disabled={isLoading || transferMutation.isPending}
                >
                  <SelectTrigger data-testid="select-from-user">
                    <SelectValue placeholder="Zgjidhni përdoruesin burim" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Përdoruesi që aktualisht zotëron çështjet
                </p>
              </div>

              {/* To User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Tek Përdoruesi (Destinacioni)
                </label>
                <Select
                  value={toUserId}
                  onValueChange={setToUserId}
                  disabled={isLoading || transferMutation.isPending}
                >
                  <SelectTrigger data-testid="select-to-user">
                    <SelectValue placeholder="Zgjidhni përdoruesin destinacion" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.id !== fromUserId)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Përdoruesi që do të marrë çështjet
                </p>
              </div>
            </div>

            {/* Transfer Summary */}
            {fromUserId && toUserId && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Përmbledhje e Transferimit
                </h3>
                <p className="text-sm">
                  Të gjitha çështjet e krijuara nga{" "}
                  <span className="font-semibold">
                    {fromUser?.firstName} {fromUser?.lastName}
                  </span>{" "}
                  do të transferohen tek{" "}
                  <span className="font-semibold">
                    {toUser?.firstName} {toUser?.lastName}
                  </span>
                  .
                </p>
                <p className="text-xs text-muted-foreground">
                  Ky veprim është i pakthyeshëm. Ju lutemi sigurohuni që keni zgjedhur përdoruesit e duhur.
                </p>
              </div>
            )}

            {/* Transfer Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleTransferClick}
                disabled={!fromUserId || !toUserId || transferMutation.isPending}
                size="lg"
                data-testid="button-transfer-cases"
              >
                {transferMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Duke transferuar...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Transfero Çështjet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Konfirmo Transferimin
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  A jeni të sigurt që dëshironi të transferoni të gjitha çështjet nga{" "}
                  <span className="font-semibold text-foreground">
                    {fromUser?.firstName} {fromUser?.lastName}
                  </span>{" "}
                  tek{" "}
                  <span className="font-semibold text-foreground">
                    {toUser?.firstName} {toUser?.lastName}
                  </span>
                  ?
                </p>
                <p className="text-amber-600 dark:text-amber-500">
                  ⚠️ Ky veprim nuk mund të zhbëhet!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-transfer">
                Anulo
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmTransfer}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-confirm-transfer"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Po, Transfero
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
}
