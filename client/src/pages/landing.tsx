import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-database text-white text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Sistemi i Menaxhimit të të Dhënave</h1>
              <p className="text-gray-600 mt-2">Kyçuni për të hyrë në panelin tuaj</p>
            </div>
            
            <Button onClick={handleLogin} className="w-full primary-button">
              <i className="fas fa-sign-in-alt mr-2"></i>
              Kyçu
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Qasje e sigurt me leje të bazuara në role
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
