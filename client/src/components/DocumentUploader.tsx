import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

interface DocumentUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
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
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: DocumentUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.pdf', '.doc', '.docx'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

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