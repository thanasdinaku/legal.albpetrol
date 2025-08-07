import CSVImport from "@/components/csv-import";

export default function CSVImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import CSV Data</h1>
          <p className="text-gray-600 mt-2">
            Upload your Excel data as CSV to populate the database
          </p>
        </div>
        
        <CSVImport />
      </div>
    </div>
  );
}