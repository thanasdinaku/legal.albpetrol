import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, Clock, Bell, Settings } from "lucide-react";

interface EmailNotificationSettings {
  enabled: boolean;
  recipientEmail: string;
  senderEmail: string;
}

export default function EmailNotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmailNotificationSettings>({
    enabled: false,
    recipientEmail: '',
    senderEmail: 'legal-system@albpetrol.al'
  });

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<EmailNotificationSettings>({
    queryKey: ['/api/admin/email-settings'],
    retry: false,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: EmailNotificationSettings) => {
      const response = await apiRequest('/api/admin/email-settings', 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
      toast({
        title: "Cilësimet u ruajtën",
        description: "Cilësimet e njoftimeve me email u ruajtën me sukses",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gabim",
        description: error.message || "Dështoi ruajtja e cilësimeve",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    if (formData.enabled && formData.recipientEmail && 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      toast({
        title: "Email i pavlefshëm",
        description: "Ju lutem vendosni një adresë email të vlefshme për marrësin",
        variant: "destructive",
      });
      return;
    }

    if (formData.enabled && formData.senderEmail && 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.senderEmail)) {
      toast({
        title: "Email i pavlefshëm",
        description: "Ju lutem vendosni një adresë email të vlefshme për dërguesin",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Duke ngarkuar cilësimet...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Njoftimet me Email për Seanca Gjyqësore</h2>
          <p className="text-gray-600">Konfiguro njoftimet automatike 24 orë përpara seancave gjyqësore</p>
        </div>
      </div>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Sistemi do të dërgojë automatikisht njoftimet me email 24 orë përpara çdo seance gjyqësore të caktuar 
          në fushat "Zhvillimi i seances gjyqesorë (Shkallë I)" ose "Zhvillimi i seances gjyqesorë (Apel)".
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Cilësimet e Email-it</span>
          </CardTitle>
          <CardDescription>
            Aktivizo dhe konfiguro njoftimet automatike me email për seanca gjyqësore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="email-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, enabled: checked }))
                }
                data-testid="switch-email-notifications"
              />
              <Label htmlFor="email-enabled" className="text-base">
                Aktivizo njoftimet me email
              </Label>
            </div>

            {formData.enabled && (
              <div className="space-y-4 pl-8 border-l-2 border-gray-100">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">
                    Adresa Email e Marrësit *
                  </Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="legal@albpetrol.al"
                    value={formData.recipientEmail}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))
                    }
                    required
                    data-testid="input-recipient-email"
                  />
                  <p className="text-sm text-gray-500">
                    Adresa ku do të dërgohen njoftimet për seanca gjyqësore
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-email">
                    Adresa Email e Dërguesit *
                  </Label>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="legal-system@albpetrol.al"
                    value={formData.senderEmail}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, senderEmail: e.target.value }))
                    }
                    required
                    data-testid="input-sender-email"
                  />
                  <p className="text-sm text-gray-500">
                    Adresa që do të shfaqet si dërgues i njoftimeve
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-email-settings"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Duke ruajtur...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Ruaj Cilësimet
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {formData.enabled && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-200 rounded-full">
                <Bell className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">Njoftimet janë aktive</h4>
                <p className="text-sm text-green-700">
                  Formati i njoftimit: "Tomorrow, a court hearing will take place for [Paditesi] and [I Paditur] at [ora e seancës]"
                </p>
                <p className="text-xs text-green-600">
                  Sistemi kontrollon çdo orë për seanca që do të zhvillohen brenda 24 orëve të ardhshme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}