import { Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class LocalFileStorageService {
  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  async downloadObject(filePath: string, res: Response) {
    try {
      const fullPath = path.join(DOCUMENTS_DIR, path.basename(filePath));
      
      const stats = await fs.stat(fullPath);
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      res.set({
        "Content-Type": contentType,
        "Content-Length": stats.size,
        "Cache-Control": `private, max-age=3600`,
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      });

      const stream = createReadStream(fullPath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(404).json({ error: "File not found" });
      }
    }
  }

  async uploadDocumentBuffer(
    buffer: Buffer, 
    originalName: string, 
    mimeType: string
  ): Promise<string> {
    const fileExtension = originalName.split('.').pop() || 'bin';
    const uniqueId = randomUUID();
    const fileName = `${uniqueId}.${fileExtension}`;
    
    const fullPath = path.join(DOCUMENTS_DIR, fileName);

    console.log("Uploading to local storage:", fullPath);

    await fs.writeFile(fullPath, buffer);

    console.log("Successfully uploaded file to local storage");
    
    return `/documents/${fileName}`;
  }

  async getDocumentFile(objectPath: string): Promise<string> {
    if (!objectPath.startsWith("/documents/")) {
      throw new ObjectNotFoundError();
    }

    const fileName = path.basename(objectPath);
    const fullPath = path.join(DOCUMENTS_DIR, fileName);
    
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      throw new ObjectNotFoundError();
    }
  }

  normalizeDocumentPath(rawPath: string): string {
    return rawPath;
  }

  getPrivateObjectDir(): string {
    return '/albpetrol-legal/uploads';
  }

  async getDocumentUploadURL(): Promise<string> {
    // For local file storage, return an empty string since we use direct server upload
    // The client will use the /api/documents/upload-file endpoint instead
    return '';
  }
}
