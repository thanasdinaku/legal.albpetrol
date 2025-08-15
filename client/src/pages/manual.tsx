import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, BookOpen } from "lucide-react";

export default function ManualPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchManual();
  }, []);

  const fetchManual = async () => {
    try {
      const response = await fetch("/api/manual/markdown", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const content = await response.text();
        setMarkdownContent(content);
      } else {
        throw new Error('Failed to load manual');
      }
    } catch (error) {
      console.error("Error loading manual:", error);
      toast({
        title: "Gabim",
        description: "Nuk u arrit të ngarkohet manuali",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/download/user-manual', {
        credentials: 'include'
      });
      
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
          title: "Sukses",
          description: "Manuali PDF u shkarkua me sukses",
        });
      } else {
        throw new Error('PDF download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Gabim",
        description: "Dështoi shkarkimi i PDF",
        variant: "destructive",
      });
    }
  };

  const openHTMLVersion = () => {
    window.open('/api/manual/html', '_blank');
  };

  // Convert markdown to basic HTML for display
  const formatMarkdownToHTML = (markdown: string) => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-blue-700 mt-6 mb-3 border-l-4 border-blue-500 pl-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-blue-800 mt-8 mb-4 border-b-2 border-blue-200 pb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-blue-900 mt-10 mb-6 text-center border-b-3 border-blue-300 pb-3">$1</h1>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
      
      // Code/inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-2">$1. $2</li>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>')
      
      // Wrap in paragraphs
      .replace(/^(?!<[h|l|c])/gm, '<p class="mb-4">')
      .replace(/$/gm, '</p>')
      
      // Clean up extra paragraphs
      .replace(/<\/p><p class="mb-4"><\/p>/g, '</p><p class="mb-4">')
      .replace(/<p class="mb-4"><\/p>/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                <p className="text-gray-500">Po ngarkohet manuali...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
            Manual i Përdoruesit
          </h1>
          <p className="text-gray-600 mt-2">Udhëzues i plotë për përdorimin e sistemit</p>
        </div>

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Veprime të Disponueshme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={downloadPDF}
                className="flex items-center"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Shkarko PDF
              </Button>
              <Button 
                onClick={openHTMLVersion}
                variant="outline"
                className="flex items-center"
                data-testid="button-open-html"
              >
                <FileText className="h-4 w-4 mr-2" />
                Hap në HTML
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(markdownContent) 
              }}
              data-testid="manual-content"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}