import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loginSchema, type LoginData, type User } from "@shared/schema";
import albpetrolLogo from "@assets/Albpetrol.svg_1754604323425.png";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [, setLocation] = useLocation();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include", // Important for cookies/sessions
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid email or password");
      }
      return await response.json();
    },
    onSuccess: (response: any) => {
      if (response.requiresTwoFactor) {
        // Show 2FA form
        setTwoFactorUserId(response.userId);
        setUserEmail(response.email);
        setShowTwoFactor(true);
        toast({
          title: "Kodi i Verifikimit",
          description: "Kodi i verifikimit është dërguar në email-in tuaj. Kontrolloni kutinë postare.",
        });
      } else {
        // Direct login success (shouldn't happen with new 2FA flow)
        queryClient.setQueryData(["/api/auth/user"], response);
        toast({
          title: "Mirë se erdhët!",
          description: `Jeni kyçur me sukses si ${response.firstName} ${response.lastName}`,
        });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Gabim në kyçje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: twoFactorUserId, code }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid verification code");
      }
      return await response.json() as User;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Mirë se erdhët!",
        description: `Jeni kyçur me sukses si ${user.firstName} ${user.lastName}`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Gabim në verifikim",
        description: error.message,
        variant: "destructive",
      });
      setVerificationCode("");
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onVerifyTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      verifyTwoFactorMutation.mutate(verificationCode);
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTwoFactorUserId("");
    setUserEmail("");
    setVerificationCode("");
    form.reset();
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={albpetrolLogo} 
                alt="Albpetrol SHA" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifikimi i Sigurisë
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vendosni kodin e verifikimit të dërguar në: <br />
              <span className="font-medium">{userEmail}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onVerifyTwoFactor} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kodi i Verifikimit (6 shifra)
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Vëmendje:</strong> Kodi skadon për 3 minuta. Nëse nuk e keni marrë, kontrolloni kutinë e spam-it.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyTwoFactorMutation.isPending || verificationCode.length !== 6}
              >
                {verifyTwoFactorMutation.isPending ? "Po verifikohet..." : "Verifiko Kodin"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackToLogin}
                disabled={verifyTwoFactorMutation.isPending}
              >
                Kthehu te Kyçja
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={albpetrolLogo} 
              alt="Albpetrol SHA" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistemi i Menaxhimit të Rasteve Ligjore
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kyçuni për të aksesuar sistemin
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresa e Email-it</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@albpetrol.al"
                        {...field}
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fjalëkalimi</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Futni fjalëkalimin tuaj"
                          {...field}
                          disabled={loginMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loginMutation.isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Po kyçet..." : "Kyçu"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}