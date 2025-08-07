import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CSVPreviewData {
  headers: string[];
  rows: string[][];
}

interface FieldMapping {
  csvField: string;
  dbField: string;
}

const DB_FIELDS = [
  { value: "paditesi", label: "Paditesi (Emer e Mbiemer)" },
  { value: "iPaditur", label: "I Paditur" },
  { value: "personITrete", label: "Person I Trete" },
  { value: "objektiIPadise", label: "Objekti I Padise" },
  { value: "gjykataShkalle", label: "Gjykata e Shkallës I" },
  { value: "fazaGjykataShkalle", label: "Faza ne te cilen ndodhet procesi (Shkalle I)" },
  { value: "gjykataApelit", label: "Gjykata e Apelit" },
  { value: "fazaGjykataApelit", label: "Faza ne te cilen ndodhet procesi (Apel)" },
  { value: "fazaAktuale", label: "Faza Aktuale e Procesit" },
  { value: "perfaqesuesi", label: "Perfaqesuesi i Albpetrol SH.A." },
  { value: "demiIPretenduar", label: "Demi i Pretenduar ne Objekt" },
  { value: "shumaGjykata", label: "Shuma e Caktuar nga Gjykata me Vendim" },
  { value: "vendimEkzekutim", label: "Vendim me Ekzekutim te Perkohshem" },
  { value: "fazaEkzekutim", label: "Faza ne te cilen ndodhet Ekzekutimi" },
  { value: "ankimuar", label: "Ankimuar (Po/Jo)" },
  { value: "perfunduar", label: "Perfunduar (Po/Jo)" },
  { value: "gjykataLarte", label: "Gjykata e Larte" },
  { value: "skip", label: "Skip this field" }
];

export default function CSVImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "mapping">("upload");

  const parseCSV = (text: string): CSVPreviewData => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1, 6).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or TXT file.",
        variant: "destructive",
      });
      return;
    }

    setCSVFile(file);
    
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setPreviewData(parsed);
      
      // Initialize field mappings
      const mappings = parsed.headers.map(header => ({
        csvField: header,
        dbField: "skip"
      }));
      setFieldMappings(mappings);
      setStep("preview");
      
      toast({
        title: "File loaded successfully",
        description: `Found ${parsed.headers.length} columns and ${parsed.rows.length} preview rows.`,
      });
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Could not parse the CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleMappingChange = (index: number, dbField: string) => {
    const updatedMappings = [...fieldMappings];
    updatedMappings[index].dbField = dbField;
    setFieldMappings(updatedMappings);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('mappings', JSON.stringify(fieldMappings));
      
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import successful",
        description: `Successfully imported ${data.imported} records.`,
      });
      
      // Reset form
      setCSVFile(null);
      setPreviewData(null);
      setFieldMappings([]);
      setStep("upload");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV data.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            <p className="text-sm text-gray-600">
              Upload a CSV file with your data. The first row should contain column headers.
            </p>
          </div>
        )}

        {step === "preview" && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Preview</h3>
              <Button onClick={() => setStep("mapping")}>
                Continue to Field Mapping
              </Button>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "mapping" && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Map CSV Fields to Database</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Back to Preview
                </Button>
                <Button 
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? "Importing..." : "Import Data"}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">CSV Field:</Label>
                    <p className="text-sm text-gray-600">{mapping.csvField}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Maps to:</Label>
                    <select
                      value={mapping.dbField}
                      onChange={(e) => handleMappingChange(index, e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {DB_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Field Mapping Guide:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Title:</strong> Main name or identifier for each record</li>
                <li><strong>Description:</strong> Detailed information about the record</li>
                <li><strong>Category:</strong> Classification (e.g., Finance, Operations, etc.)</li>
                <li><strong>Status:</strong> Must be: active, inactive, or pending</li>
                <li><strong>Priority:</strong> Must be: low, medium, or high</li>
                <li><strong>Value:</strong> Any additional value or reference</li>
                <li><strong>Date:</strong> Date in YYYY-MM-DD format</li>
              </ul>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Export your Excel file as a CSV</li>
              <li>Upload the CSV file here</li>
              <li>Preview your data to ensure it loaded correctly</li>
              <li>Map each CSV column to the appropriate database field</li>
              <li>Import the data to your database</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}