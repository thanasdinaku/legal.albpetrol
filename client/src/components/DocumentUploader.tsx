import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

interface DocumentUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children?: ReactNode;
}

/**
 * A document upload component that allows uploading PDF and Word files.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Restricted to PDF and Word document types
 * - Provides a modal interface for file selection and upload progress
 * - Handles direct-to-storage uploads using presigned URLs
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 5)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters from backend
 * @param props.onComplete - Callback when upload is complete
 * @param props.buttonClassName - Optional CSS class for the button
 * @param props.children - Optional custom button content
 */
export function DocumentUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
}: DocumentUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.pdf', '.doc', '.docx'],
      },
      autoProceed: false,
      debug: true,
    });

    uppyInstance
      .use(XHRUpload, {
        endpoint: '/api/documents/upload-file',
        method: 'POST',
        formData: true,
        fieldName: 'document',
        bundle: false,
        limit: maxNumberOfFiles,
        headers: {
          // Let the browser set Content-Type with boundary for multipart
        },
        getResponseData: (xhr: XMLHttpRequest) => {
          try {
            const response = JSON.parse(xhr.responseText);
            return response;
          } catch {
            return { url: xhr.responseURL };
          }
        },
        shouldRetry: (xhr: XMLHttpRequest) => {
          const status = xhr.status;
          return status === 500 || status === 503 || status === 504;
        }
      })
      .on("upload-error", (file, error, response) => {
        console.error("Upload error details:", { 
          file: file?.name, 
          error: error?.message || error, 
          response: response,
          status: response?.status
        });
      })
      .on("upload-success", (file, response) => {
        console.log("Upload success:", { file: file?.name, response });
      })
      .on("error", (error) => {
        console.error("General Uppy error:", error);
      })
      .on("complete", (result) => {
        console.log("Upload complete result:", {
          successful: result.successful?.length || 0,
          failed: result.failed?.length || 0
        });
        onComplete?.(result);
        setShowModal(false);
      });

    // Log file additions for debugging
    uppyInstance.on('file-added', (file) => {
      console.log('File added for upload:', file.name, 'Type:', file.type);
    });

    return uppyInstance;
  });

  return (
    <div>
      <Button 
        type="button"
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant="outline"
        data-testid="button-upload-documents"
      >
        {children || (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Bashkangjit Dokumente</span>
            <Upload className="h-4 w-4" />
          </div>
        )}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}

      />
    </div>
  );
}