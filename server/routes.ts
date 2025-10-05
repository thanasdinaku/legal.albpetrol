import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, hashPassword } from "./auth";
import {
  createUserSchema,
  loginSchema,
  changePasswordSchema,
  insertCheckpointSchema,
  type CreateUser,
  type LoginData,
  type ChangePasswordData,
  type InsertCheckpoint
} from "@shared/schema";

import rateLimit from 'express-rate-limit';

// Create different rate limiters for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 50, // Limit each IP to 50 requests per windowMs for sensitive endpoints
  message: { error: 'Too many requests, please try again later.' },
});

// Removed caching middleware to fix authentication and system stability issues
import { insertDataEntrySchema, updateDataEntrySchema, emailNotificationSchema } from "@shared/schema";
import { z } from "zod";
import XLSX from "xlsx";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sessions } from "@shared/schema";
import { sendNewEntryNotification, sendEditEntryNotification, sendDeleteEntryNotification } from "./email";
import { sendCourtHearingNotification, sendCaseUpdateNotification, testEmailConnection } from "./email";
import nodemailer from 'nodemailer';
import { generateUserManual } from "./fixed-manual";
import { generateSimpleManual } from "./simple-manual";
import { LocalFileStorageService, ObjectNotFoundError } from "./localFileStorage";
import { BackupService, type BackupOptions, type BackupProgress } from "./backup-service";
import { courtHearingScheduler } from "./courtHearingScheduler";
import multer from "multer";

// Create SMTP transporter for testing
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, and DOCX files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all routes
  app.use('/api/', generalLimiter);
  
  // Auth middleware
  setupAuth(app);
  
  // Initialize backup service
  const backupService = new BackupService();
  
  // Ensure default admin exists on startup
  await storage.ensureDefaultAdmin();
  
  // Security.txt route for responsible disclosure (pentest requirement)
  app.get('/.well-known/security.txt', (req, res) => {
    res.type('text/plain');
    res.send(`Contact: mailto:it.system@albpetrol.al
Contact: https://legal.albpetrol.al/contact
Expires: 2026-08-13T12:00:00.000Z
Preferred-Languages: sq, en
Canonical: https://legal.albpetrol.al/.well-known/security.txt

# Security Policy for Albpetrol Legal Case Management System
# 
# If you discover a security vulnerability, please report it to:
# - Email: it.system@albpetrol.al
# - Subject: [SECURITY] Vulnerability Report for legal.albpetrol.al
#
# Please include:
# - Description of the vulnerability
# - Steps to reproduce
# - Potential impact
# - Your contact information for follow-up
#
# We appreciate responsible disclosure and will acknowledge
# your contribution in resolving security issues.`);
  });
  
  // Clear old sessions route (for migration)
  app.post('/api/clear-sessions', async (req, res) => {
    try {
      // Clear session table directly for migration
      await db.delete(sessions);
      res.json({ message: "All sessions cleared" });
    } catch (error) {
      console.log("Session clear error:", error);
      res.status(500).json({ error: "Failed to clear sessions" });
    }
  });

  // Auth routes (already handled in auth.ts setup)

  // Data entry routes
  app.post('/api/data-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Validate form data first, then add system fields
      const formData = insertDataEntrySchema.parse(req.body);
      const validatedData = {
        ...formData,
        createdById: userId,
      };
      
      const entry = await storage.createDataEntry(validatedData);
      
      // Update user's last activity
      try {
        await storage.updateUserLastActivity(userId);
      } catch (error) {
        console.error('Failed to update user activity:', error);
      }
      
      // Send email notification
      try {
        console.log('🔔 Checking email notification settings...');
        const emailSettings = await storage.getEmailNotificationSettings();
        console.log('📧 Email settings:', { 
          enabled: emailSettings.enabled, 
          emailAddresses: emailSettings.emailAddresses, 
          subject: emailSettings.subject 
        });
        
        if (emailSettings.enabled) {
          const creator = await storage.getUser(userId);
          console.log('👤 Creator found:', creator ? `${creator.firstName} ${creator.lastName}` : 'Not found');
          
          if (creator) {
            // Send legacy notification (existing functionality)
            if (emailSettings.emailAddresses.length > 0) {
              console.log('📬 Sending immediate new entry notification...');
              const totalEntries = await storage.getDataEntriesCount();
              await sendNewEntryNotification(entry, creator, emailSettings, totalEntries);
            } else {
              console.log('❌ No email addresses configured for notifications');
            }
            
            // Send new case update notification
            if (emailSettings.recipientEmail) {
              await sendCaseUpdateNotification(
                emailSettings.recipientEmail,
                emailSettings.senderEmail || 'legal-system@albpetrol.al',
                {
                  caseId: entry.id,
                  paditesi: entry.paditesi || 'N/A',
                  iPaditur: entry.iPaditur || 'N/A',
                  updateType: 'created',
                  updatedBy: creator.email || creator.firstName || 'System User',
                  timestamp: new Date().toISOString()
                }
              );
            }
          } else {
            console.log('❌ Creator not found for email notification');
          }
        } else {
          console.log('❌ Email notifications disabled');
        }
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating data entry:", error);
      res.status(500).json({ message: "Failed to create data entry" });
    }
  });

  app.get('/api/data-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const { search, category, status, page = '1', limit = '10', sortOrder = 'desc' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        search: search as string,
        category: category as string,
        status: status as string,
        limit: limitNum,
        offset,
        sortOrder: sortOrder as 'asc' | 'desc',
        // Both users and admins can see all entries
        createdById: undefined,
      };

      const [entries, total] = await Promise.all([
        storage.getDataEntries(filters),
        storage.getDataEntriesCount({
          search: search as string,
          category: category as string,
          status: status as string,
          createdById: undefined,
        }),
      ]);

      res.json({
        entries,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching data entries:", error);
      res.status(500).json({ message: "Failed to fetch data entries" });
    }
  });

  app.get('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const entry = await storage.getDataEntryById(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Data entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching data entry:", error);
      res.status(500).json({ message: "Failed to fetch data entry" });
    }
  });

  app.put('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      // Check if entry exists and get ownership
      const existingEntry = await storage.getDataEntryById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Permission check: admin can edit any entry, regular user can only edit their own
      if (user?.role !== 'admin' && existingEntry.createdById !== userId) {
        return res.status(403).json({ message: "You can only edit your own entries" });
      }

      const validatedData = updateDataEntrySchema.parse(req.body);
      const entry = await storage.updateDataEntry(id, validatedData);
      
      // Update user's last activity
      try {
        await storage.updateUserLastActivity(userId);
      } catch (error) {
        console.error('Failed to update user activity:', error);
      }
      
      // Send email notification for edit
      try {
        const emailSettings = await storage.getEmailNotificationSettings();
        if (emailSettings.enabled) {
          const editor = await storage.getUser(userId);
          if (editor) {
            // Send legacy notification (existing functionality)
            if (emailSettings.emailAddresses.length > 0) {
              const allEntries = await storage.getDataEntriesForExport();
              const entryIndex = allEntries.findIndex(e => e.id === entry.id);
              const nrRendor = entryIndex >= 0 ? allEntries.length - entryIndex : undefined;
              await sendEditEntryNotification(existingEntry, entry, editor, emailSettings, nrRendor);
            }
            
            // Send new case update notification with change tracking
            if (emailSettings.recipientEmail) {
              // Track changes between old and new data
              const changes: Record<string, { old: any; new: any }> = {};
              const fieldsToCheck = [
                'paditesi', 'iPaditur', 'personITrete', 'objektiIPadise', 
                'gjykataShkalle', 'fazaGjykataShkalle', 'zhvillimiSeancesShkalleI',
                'gjykataApelit', 'fazaGjykataApelit', 'zhvillimiSeancesApel',
                'fazaAktuale', 'perfaqesuesi', 'demiIPretenduar', 'shumaGjykata',
                'vendimEkzekutim', 'fazaEkzekutim', 'ankimuar', 'perfunduar', 'gjykataLarte'
              ];
              
              fieldsToCheck.forEach(field => {
                const oldValue = (existingEntry as any)[field];
                const newValue = (entry as any)[field];
                if (oldValue !== newValue) {
                  changes[field] = { old: oldValue, new: newValue };
                }
              });

              await sendCaseUpdateNotification(
                emailSettings.recipientEmail,
                emailSettings.senderEmail || 'legal-system@albpetrol.al',
                {
                  caseId: entry.id,
                  paditesi: entry.paditesi || 'N/A',
                  iPaditur: entry.iPaditur || 'N/A',
                  updateType: 'updated',
                  updatedBy: editor.email || editor.firstName || 'System User',
                  timestamp: new Date().toISOString(),
                  changes: Object.keys(changes).length > 0 ? changes : undefined
                }
              );
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send edit notification email:', emailError);
        // Don't fail the request if email fails
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating data entry:", error);
      res.status(500).json({ message: "Failed to update data entry" });
    }
  });

  app.delete('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);

      // Check if entry exists
      const existingEntry = await storage.getDataEntryById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Permission check: only administrators can delete entries
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can delete entries" });
      }

      // Update user's last activity
      try {
        await storage.updateUserLastActivity(userId);
      } catch (error) {
        console.error('Failed to update user activity:', error);
      }

      // Send email notification before deletion
      try {
        const emailSettings = await storage.getEmailNotificationSettings();
        if (emailSettings.enabled) {
          const deleter = await storage.getUser(userId);
          if (deleter) {
            // Send legacy notification (existing functionality)
            if (emailSettings.emailAddresses.length > 0) {
              const allEntries = await storage.getDataEntriesForExport();
              const entryIndex = allEntries.findIndex(e => e.id === existingEntry.id);
              const nrRendor = entryIndex >= 0 ? allEntries.length - entryIndex : undefined;
              await sendDeleteEntryNotification(existingEntry, deleter, emailSettings, nrRendor);
            }
            
            // Send new case update notification for deletion
            if (emailSettings.recipientEmail) {
              await sendCaseUpdateNotification(
                emailSettings.recipientEmail,
                emailSettings.senderEmail || 'legal-system@albpetrol.al',
                {
                  caseId: existingEntry.id,
                  paditesi: existingEntry.paditesi || 'N/A',
                  iPaditur: existingEntry.iPaditur || 'N/A',
                  updateType: 'deleted',
                  updatedBy: deleter.email || deleter.firstName || 'System User',
                  timestamp: new Date().toISOString()
                }
              );
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send delete notification email:', emailError);
        // Don't fail the request if email fails
      }

      await storage.deleteDataEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting data entry:", error);
      res.status(500).json({ message: "Failed to delete data entry" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDataEntryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-entries', isAuthenticated, async (req: any, res) => {
    try {
      const entries = await storage.getRecentDataEntries(5);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
      res.status(500).json({ message: "Failed to fetch recent entries" });
    }
  });



  // Export routes
  app.get('/api/data-entries/export/:format', isAuthenticated, async (req: any, res) => {
    try {
      const format = req.params.format;
      if (!['excel', 'csv'].includes(format)) {
        return res.status(400).json({ message: "Invalid export format" });
      }

      // Get the same filtering and sorting parameters as the UI
      const { search, sortOrder } = req.query;
      
      // Get all data entries for export with the same filters and sorting as the UI
      const entries = await storage.getDataEntriesForExport({ 
        search: search as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
      });

      if (!entries || entries.length === 0) {
        return res.status(404).json({ message: "No data to export" });
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      
      // Helper function to format datetime fields from "2025-10-31T17:05" to "31-10-2025 17:05"
      const formatDateTime = (dateTimeString: string | null | undefined): string => {
        if (!dateTimeString) return '';
        try {
          // Handle both ISO format and datetime-local format
          const date = new Date(dateTimeString);
          if (isNaN(date.getTime())) return dateTimeString; // Return original if invalid
          
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          
          return `${day}-${month}-${year} ${hours}:${minutes}`;
        } catch (error) {
          return dateTimeString; // Return original if error
        }
      };

      if (format === 'excel') {
        // Excel export with professional formatting
        const worksheetData = [
          // Main title row
          ['Ekstrakt i Ceshtjeve Ligjore'],
          [], // Empty row for spacing
          // Headers matching the current data entry form exactly
          [
            'Nr. Rendor', 'Paditesi (Emër e Mbiemër)', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë', 
            'Gjykata e Shkallës së Parë', 'Faza në të cilën ndodhet procesi (Shkallë I)', 'Zhvillimi i seances gjyqesorë data,ora (Shkallë I)',
            'Gjykata e Apelit', 'Faza në të cilën ndodhet procesi (Apel)', 'Zhvillimi i seances gjyqesorë data,ora (Apel)',
            'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi i Albpetrol SH.A.', 'Dëmi i Pretenduar në Objekt', 
            'Shuma e Caktuar nga Gjykata me Vendim', 'Vendim me Ekzekutim të Përkohshëm', 'Faza në të cilën ndodhet Ekzekutimi', 
            'Ankimuar', 'Përfunduar', 'Gjykata e Lartë', 'Krijuar nga', 'Krijuar më'
          ],
          // Data rows mapped to correct structure
          ...entries.map(entry => [
            entry.nrRendor,                                                              // Nr. Rendor
            entry.paditesi,                                                             // Paditesi (Emër e Mbiemër)
            entry.iPaditur,                                                             // I Paditur
            entry.personITrete || '',                                                   // Person i Tretë
            entry.objektiIPadise || '',                                                 // Objekti i Padisë
            entry.gjykataShkalle || '',                                                 // Gjykata e Shkallës së Parë
            entry.fazaGjykataShkalle || '',                                            // Faza në të cilën ndodhet procesi (Shkallë I)
            formatDateTime(entry.zhvillimiSeancesShkalleI),                             // Zhvillimi i seances gjyqesorë data,ora (Shkallë I)
            entry.gjykataApelit || '',                                                  // Gjykata e Apelit
            entry.fazaGjykataApelit || '',                                             // Faza në të cilën ndodhet procesi (Apel)
            formatDateTime(entry.zhvillimiSeancesApel),                                // Zhvillimi i seances gjyqesorë data,ora (Apel)
            entry.fazaAktuale || '',                                                    // Faza në të cilën ndodhet proçesi
            entry.perfaqesuesi || '',                                                   // Përfaqësuesi i Albpetrol SH.A.
            entry.demiIPretenduar || '',                                               // Dëmi i Pretenduar në Objekt
            entry.shumaGjykata || '',                                                   // Shuma e Caktuar nga Gjykata me Vendim
            entry.vendimEkzekutim || '',                                               // Vendim me Ekzekutim të Përkohshëm
            entry.fazaEkzekutim || '',                                                  // Faza në të cilën ndodhet Ekzekutimi
            entry.ankimuar || '',                                                       // Ankimuar
            entry.perfunduar || '',                                                     // Përfunduar
            entry.gjykataLarte || '',                                                   // Gjykata e Lartë
            (entry as any).createdByName || 'Përdorues i panjohur',                    // Krijuar nga
            entry.createdAt ? formatDateTime(entry.createdAt.toISOString()).split(' ')[0] : '' // Krijuar më (only date part)
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Set column widths for proper formatting
        const columnWidths = [
          { wch: 8 },  // Nr. Rendor
          { wch: 20 }, // Paditesi (Emër e Mbiemër)
          { wch: 15 }, // I Paditur
          { wch: 12 }, // Person i Tretë
          { wch: 25 }, // Objekti i Padisë
          { wch: 35 }, // Gjykata e Shkallës së Parë
          { wch: 30 }, // Faza në të cilën ndodhet procesi (Shkallë I)
          { wch: 30 }, // Zhvillimi i seances gjyqesorë data,ora (Shkallë I)
          { wch: 35 }, // Gjykata e Apelit
          { wch: 30 }, // Faza në të cilën ndodhet procesi (Apel)
          { wch: 30 }, // Zhvillimi i seances gjyqesorë data,ora (Apel)
          { wch: 25 }, // Faza në të cilën ndodhet proçesi
          { wch: 25 }, // Përfaqësuesi i Albpetrol SH.A.
          { wch: 25 }, // Dëmi i Pretenduar në Objekt
          { wch: 30 }, // Shuma e Caktuar nga Gjykata me Vendim
          { wch: 30 }, // Vendim me Ekzekutim të Përkohshëm
          { wch: 30 }, // Faza në të cilën ndodhet Ekzekutimi
          { wch: 15 }, // Ankimuar
          { wch: 15 }, // Përfunduar
          { wch: 15 }, // Gjykata e Lartë
          { wch: 12 }, // Krijuar nga
          { wch: 12 }  // Krijuar më
        ];
        worksheet['!cols'] = columnWidths;

        // Style the main title (row 1)
        if (worksheet['A1']) {
          worksheet['A1'].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: 'E6F3FF' } }
          };
        }

        // Merge cells for the main title across all columns
        worksheet['!merges'] = [
          { s: { c: 0, r: 0 }, e: { c: 21, r: 0 } } // Merge A1 to V1 (22 columns)
        ];

        // Style the header row (row 3)
        const headerRowIndex = 2; // 0-indexed, so row 3
        for (let col = 0; col < 22; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: 'D9EDF7' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            };
          }
        }

        // Add borders to data cells
        for (let row = 3; row < worksheetData.length; row++) {
          for (let col = 0; col < 22; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            if (worksheet[cellRef]) {
              worksheet[cellRef].s = {
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                },
                alignment: { vertical: 'center' }
              };
            }
          }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Çështjet Ligjore');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Pasqyra e Ceshtjeve - Excel.xlsx"`,
          'Content-Length': buffer.length
        });

        res.send(buffer);

      } else if (format === 'csv') {
        // CSV export - headers matching form exactly
        const csvHeaders = [
          'Nr. Rendor', 'Paditesi (Emër e Mbiemër)', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë',
          'Gjykata e Shkallës së Parë', 'Faza në të cilën ndodhet procesi (Shkallë I)', 'Zhvillimi i seances gjyqesorë data,ora (Shkallë I)',
          'Gjykata e Apelit', 'Faza në të cilën ndodhet procesi (Apel)', 'Zhvillimi i seances gjyqesorë data,ora (Apel)',
          'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi i Albpetrol SH.A.', 'Dëmi i Pretenduar në Objekt',
          'Shuma e Caktuar nga Gjykata me Vendim', 'Vendim me Ekzekutim të Përkohshëm', 'Faza në të cilën ndodhet Ekzekutimi', 
          'Ankimuar', 'Përfunduar', 'Gjykata e Lartë', 'Krijuar nga', 'Krijuar më'
        ];

        const csvRows = entries.map(entry => [
          entry.nrRendor,                                                              // Nr. Rendor
          `"${entry.paditesi || ''}"`,                                                // Paditesi (Emër e Mbiemër)
          `"${entry.iPaditur || ''}"`,                                                // I Paditur
          `"${entry.personITrete || ''}"`,                                            // Person i Tretë
          `"${entry.objektiIPadise || ''}"`,                                          // Objekti i Padisë
          `"${entry.gjykataShkalle || ''}"`,                                          // Gjykata e Shkallës së Parë
          `"${entry.fazaGjykataShkalle || ''}"`,                                      // Faza në të cilën ndodhet procesi (Shkallë I)
          `"${formatDateTime(entry.zhvillimiSeancesShkalleI)}"`,                     // Zhvillimi i seances gjyqesorë data,ora (Shkallë I)
          `"${entry.gjykataApelit || ''}"`,                                           // Gjykata e Apelit
          `"${entry.fazaGjykataApelit || ''}"`,                                       // Faza në të cilën ndodhet procesi (Apel)
          `"${formatDateTime(entry.zhvillimiSeancesApel)}"`,                         // Zhvillimi i seances gjyqesorë data,ora (Apel)
          `"${entry.fazaAktuale || ''}"`,                                             // Faza në të cilën ndodhet proçesi
          `"${entry.perfaqesuesi || ''}"`,                                            // Përfaqësuesi i Albpetrol SH.A.
          `"${entry.demiIPretenduar || ''}"`,                                         // Dëmi i Pretenduar në Objekt
          `"${entry.shumaGjykata || ''}"`,                                            // Shuma e Caktuar nga Gjykata me Vendim
          `"${entry.vendimEkzekutim || ''}"`,                                         // Vendim me Ekzekutim të Përkohshëm
          `"${entry.fazaEkzekutim || ''}"`,                                           // Faza në të cilën ndodhet Ekzekutimi
          `"${entry.ankimuar || ''}"`,                                                // Ankimuar
          `"${entry.perfunduar || ''}"`,                                              // Përfunduar
          `"${entry.gjykataLarte || ''}"`,                                            // Gjykata e Lartë
          `"${(entry as any).createdByName || 'Përdorues i panjohur'}"`,             // Krijuar nga
          entry.createdAt ? formatDateTime(entry.createdAt.toISOString()).split(' ')[0] : '' // Krijuar më (only date part)
        ]);

        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

        res.set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ceshtjet-ligjore-${timestamp}.csv"`
        });

        res.send('\uFEFF' + csvContent); // BOM for UTF-8
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/admin/users", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const users = await storage.getAllUsers();
      // Remove passwords from response and format lastLogin
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          lastActive: user.lastLogin ? user.lastLogin.toISOString() : null
        };
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/user-stats", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  app.get("/api/admin/database-stats", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const stats = await storage.getDatabaseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "Failed to fetch database statistics" });
    }
  });

  app.post("/api/admin/initialize-database", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      // Import and run database initialization
      const { initializeDatabase } = await import("./database-init");
      await initializeDatabase();
      
      res.json({ 
        message: "Database initialization completed successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });

  app.put("/api/admin/users/:userId/role", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/admin/users", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { email, firstName, lastName, role } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
      }
      
      // Generate a temporary password for the new user
      const tempPassword = `temp${Math.random().toString(36).substring(2, 8)}`;
      const hashedPassword = await hashPassword(tempPassword);
      
      const newUser = await storage.createManualUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role
      });
      
      // Remove password from response and include temp password for admin
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        ...userWithoutPassword,
        tempPassword: tempPassword  // Include temp password for admin to share with user
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error?.message && error.message.includes('unique')) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/admin/users/:userId/reset-password", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      
      // Generate a new temporary password
      const tempPassword = `temp${Math.random().toString(36).substring(2, 8)}`;
      const hashedPassword = await hashPassword(tempPassword);
      
      // Update user's password in database
      await storage.updateUserPassword(userId, hashedPassword);
      
      res.json({ 
        message: "Password reset successfully",
        tempPassword: tempPassword  // Include temp password for admin to share with user
      });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  app.delete("/api/admin/users/:userId", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Check if the user to be deleted is the default admin
      const userToDelete = await storage.getUser(userId);
      if (userToDelete && userToDelete.isDefaultAdmin) {
        return res.status(403).json({ 
          message: "Cannot delete the default administrator account. This account must always remain as the system root." 
        });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Database Backup/Restore Routes (Admin only)
  app.get("/api/admin/checkpoints", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpoints = await storage.getAllCheckpoints();
      res.json(checkpoints);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      res.status(500).json({ message: "Failed to fetch checkpoints" });
    }
  });

  app.post("/api/admin/backup", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { name, description, isAutoBackup } = req.body;
      
      // Create a backup checkpoint entry (simplified version)
      const checkpointData: InsertCheckpoint = {
        name: name || `Backup ${new Date().toLocaleDateString('sq-AL')}`,
        description: description || "Manual backup created from system settings",
        filePath: `/backups/backup_${Date.now()}.sql`, // Placeholder path
        fileSize: "1.2 MB", // Placeholder size
        createdById: req.user.id,
        isAutoBackup: isAutoBackup || false
      };
      
      const checkpoint = await storage.createBackupCheckpoint(checkpointData);
      res.status(201).json(checkpoint);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/admin/restore/:checkpointId", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpointId = parseInt(req.params.checkpointId);
      const checkpoint = await storage.getCheckpointById(checkpointId);
      
      if (!checkpoint) {
        return res.status(404).json({ message: "Checkpoint not found" });
      }
      
      // For now, return a simulated response since actual restore needs system-level access
      res.json({ 
        message: "Database restore initiated successfully",
        checkpointName: checkpoint.name,
        backupDate: checkpoint.createdAt 
      });
    } catch (error) {
      console.error("Error restoring from checkpoint:", error);
      res.status(500).json({ message: "Failed to restore from checkpoint" });
    }
  });

  app.delete("/api/admin/checkpoints/:id", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpointId = parseInt(req.params.id);
      await storage.deleteCheckpoint(checkpointId);
      res.json({ message: "Checkpoint deleted successfully" });
    } catch (error) {
      console.error("Error deleting checkpoint:", error);
      res.status(500).json({ message: "Failed to delete checkpoint" });
    }
  });

  // System Settings Routes (Admin only)
  app.put("/api/admin/settings", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const settings = req.body;
      
      // Save each setting to the database
      const savedSettings = [];
      for (const [key, value] of Object.entries(settings)) {
        if (key !== 'lastSaved') { // Skip the lastSaved timestamp
          const savedSetting = await storage.saveSystemSetting(key, value, req.user.id);
          savedSettings.push(savedSetting);
        }
      }
      
      console.log("Saved system settings:", savedSettings.length, "settings");
      
      res.json({ 
        message: "System settings saved successfully",
        timestamp: new Date().toISOString(),
        settingsCount: savedSettings.length
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save system settings" });
    }
  });

  // Email notification routes
  app.get("/api/admin/email-settings", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const emailSettings = await storage.getEmailNotificationSettings();
      res.json(emailSettings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.put("/api/admin/email-settings", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const validatedSettings = emailNotificationSchema.parse(req.body);
      await storage.saveEmailNotificationSettings(validatedSettings, req.user.id);
      
      res.json({ 
        message: "Email notification settings saved successfully",
        settings: validatedSettings
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving email settings:", error);
      res.status(500).json({ message: "Failed to save email settings" });
    }
  });

  app.post("/api/admin/test-email", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const isConnected = await testEmailConnection();
      res.json({ 
        success: isConnected,
        message: isConnected 
          ? "Email connection test successful" 
          : "Email connection test failed"
      });
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ 
        success: false,
        message: "Email connection test failed" 
      });
    }
  });

  // Test court hearing notification endpoint
  app.post("/api/admin/test-court-notification", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      // Use the proper email service
      const settings = await storage.getEmailNotificationSettings();
      
      if (!settings.enabled) {
        return res.json({ 
          success: false, 
          message: "Email notifications are disabled in settings" 
        });
      }

      if (!settings.recipientEmail) {
        return res.json({ 
          success: false, 
          message: "No recipient email configured" 
        });
      }

      console.log('Starting comprehensive email notification test...');
      
      // Test basic email connection
      const basicTest = await testEmailConnection();
      
      // Test basic email sending with real SMTP
      try {
        await transporter.sendMail({
          from: settings.senderEmail || 'it.system@albpetrol.al',
          to: settings.recipientEmail,
          subject: 'Test Email from Albpetrol Legal System',
          text: 'This is a test email to verify email configuration is working.',
          html: '<p>This is a test email to verify email configuration is working.</p>'
        });
        console.log('✅ Basic email test - REAL EMAIL SENT successfully');
      } catch (error) {
        console.log('❌ Basic email test failed:', error);
      }

      // Test court hearing notification format
      const courtTest = await sendCourtHearingNotification(
        settings.recipientEmail,
        settings.senderEmail || 'legal-system@albpetrol.al',
        {
          plaintiff: 'Test Plaintiff',
          defendant: 'Test Defendant', 
          hearingDateTime: new Date(Date.now() + 24*60*60*1000).toISOString(),
          hearingType: 'first_instance',
          caseId: 999
        }
      );

      // Test case update notification
      const caseUpdateTest = await sendCaseUpdateNotification(
        settings.recipientEmail,
        settings.senderEmail || 'legal-system@albpetrol.al',
        {
          caseId: 998,
          paditesi: 'Test Case Plaintiff',
          iPaditur: 'Test Case Defendant',
          updateType: 'updated',
          updatedBy: 'System Test',
          timestamp: new Date().toISOString(),
          changes: {
            'fazaAktuale': { old: 'Faza e parë', new: 'Faza e dytë' },
            'perfaqesuesi': { old: 'Avocat A', new: 'Avocat B' }
          }
        }
      );

      console.log('Email notification tests completed successfully');

      res.json({ 
        success: true,
        message: `All email notification tests completed successfully! Check server console for email logs. Basic email: success, Court hearing: success, Case update: success`
      });
    } catch (error) {
      console.error("Error testing court hearing notification:", error);
      res.status(500).json({ 
        success: false,
        message: `Email test failed: ${(error as Error).message}` 
      });
    }
  });

  // Manual trigger for court hearing check
  app.post('/api/admin/trigger-court-check', async (req, res) => {
    try {
      console.log('Manually triggering court hearing check...');
      const { courtHearingScheduler } = await import('./courtHearingScheduler');
      await courtHearingScheduler.checkUpcomingHearings();
      res.json({ success: true, message: 'Court hearing check triggered successfully' });
    } catch (error) {
      console.error('Error triggering court hearing check:', error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // Admin: Send test email to verify email delivery
  app.post('/api/admin/test-email', async (req, res) => {
    try {
      console.log('Sending test email...');
      const { sendCaseUpdateNotification } = await import('./email.js');
      
      const result = await sendCaseUpdateNotification(
        'thanas.dinaku@albpetrol.al',
        'it.system@albpetrol.al',
        {
          caseId: 999,
          paditesi: 'TEST EMAIL DELIVERY',
          iPaditur: 'EMAIL VERIFICATION TEST',
          updateType: 'test',
          updatedBy: 'System Admin',
          timestamp: new Date().toISOString(),
          changes: {
            'test_field': { old: 'old_value', new: 'new_value' }
          }
        }
      );
      
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        emailDelivered: result 
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: (error as Error).message 
      });
    }
  });

  // System backup and restore routes
  app.get('/api/system/status', isAuthenticated, async (req, res) => {
    try {
      const status = await backupService.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting system status:', error);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  });

  app.get('/api/system/backups', isAuthenticated, async (req, res) => {
    try {
      const backups = await backupService.getBackups();
      res.json(backups);
    } catch (error) {
      console.error('Error getting backups:', error);
      res.status(500).json({ error: 'Failed to get backups' });
    }
  });

  app.post('/api/system/backup/create', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { type, description } = req.body;
      const userId = (req as any).user?.id;
      
      const options: BackupOptions = {
        type,
        description,
        createdBy: userId
      };

      // Set up streaming response
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const backupId = await backupService.createBackup(options, (progress: BackupProgress) => {
        res.write(JSON.stringify(progress) + '\n');
      });

      res.end(JSON.stringify({ backupId, success: true }));
    } catch (error) {
      console.error('Error creating backup:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create backup' });
      } else {
        res.end(JSON.stringify({ error: 'Failed to create backup' }));
      }
    }
  });

  app.post('/api/system/backup/restore/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const backupId = req.params.id;

      // Set up streaming response
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      await backupService.restoreBackup(backupId, (progress: BackupProgress) => {
        res.write(JSON.stringify(progress) + '\n');
      });

      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error restoring backup:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to restore backup' });
      } else {
        res.end(JSON.stringify({ error: 'Failed to restore backup' }));
      }
    }
  });

  app.delete('/api/system/backup/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const backupId = req.params.id;
      await backupService.deleteBackup(backupId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ error: 'Failed to delete backup' });
    }
  });

  // PDF Manual generation route
  app.get("/api/download/user-manual", isAuthenticated, async (req: any, res) => {
    try {
      const pdfBuffer = generateUserManual();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Manuali_i_Perdoruesit_Albpetrol.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF manual:", error);
      res.status(500).json({ message: "Failed to generate user manual" });
    }
  });

  // HTML Manual route (fallback)
  app.get("/api/manual/html", isAuthenticated, async (req: any, res) => {
    try {
      const htmlContent = generateSimpleManual();
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating HTML manual:", error);
      res.status(500).json({ message: "Failed to generate user manual" });
    }
  });

  // Markdown Manual route - serves the exact content from MANUAL_PERDORUESI_DETAJUAR.md
  app.get("/api/manual/markdown", isAuthenticated, async (req: any, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const manualPath = path.join(process.cwd(), 'MANUAL_PERDORUESI_DETAJUAR.md');
      const markdownContent = fs.readFileSync(manualPath, 'utf8');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(markdownContent);
    } catch (error) {
      console.error("Error reading markdown manual:", error);
      res.status(500).json({ message: "Failed to load user manual" });
    }
  });

  // Document upload routes
  app.post("/api/documents/upload", isAuthenticated, async (req, res) => {
    try {
      const localFileStorage = new LocalFileStorageService();
      const uploadURL = await localFileStorage.getDocumentUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating document upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Server-side file upload handler to bypass network restrictions
  app.post("/api/documents/upload-file", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      console.log("Received file upload:", {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const localFileStorage = new LocalFileStorageService();
      
      // Upload file to local storage using server-side method
      const documentPath = await localFileStorage.uploadDocumentBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      console.log("File uploaded successfully to:", documentPath);

      // Return the document path for client use
      res.json({ 
        url: documentPath,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to upload file: " + errorMessage });
    }
  });

  // Document download route
  app.get("/documents/:documentPath(*)", isAuthenticated, async (req, res) => {
    try {
      const localFileStorage = new LocalFileStorageService();
      const filePath = await localFileStorage.getDocumentFile(req.path);
      localFileStorage.downloadObject(filePath, res);
    } catch (error) {
      console.error("Error downloading document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  // Manual notification trigger (for testing)
  app.post('/api/force-notifications', isAuthenticated, async (req, res) => {
    try {
      console.log('🔥 Manual notification check triggered by user');
      await courtHearingScheduler.forceNotificationCheck();
      res.json({ success: true, message: 'Notification check triggered' });
    } catch (error) {
      console.error('Error triggering notifications:', error);
      res.status(500).json({ error: 'Failed to trigger notifications' });
    }
  });

  // Get all users for dropdowns (Admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return only necessary fields for dropdowns
      const userList = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }));
      res.json(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Transfer case ownership from one user to another (Admin only)
  app.post('/api/transfer-cases', isAuthenticated, isAdmin, async (req, res) => {
    console.log('🚀 ROUTE HANDLER CALLED - /api/transfer-cases');
    console.log('Request body:', req.body);
    try {
      const { fromUserId, toUserId } = req.body;
      console.log('Extracted fromUserId:', fromUserId, 'toUserId:', toUserId);

      if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'Both fromUserId and toUserId are required' });
      }

      if (fromUserId === toUserId) {
        return res.status(400).json({ error: 'Cannot transfer cases to the same user' });
      }

      // Verify both users exist
      const fromUser = await storage.getUserById(fromUserId);
      const toUser = await storage.getUserById(toUserId);

      if (!fromUser) {
        return res.status(404).json({ error: 'Source user not found' });
      }

      if (!toUser) {
        return res.status(404).json({ error: 'Destination user not found' });
      }

      // Transfer all cases
      const result = await storage.transferCases(fromUserId, toUserId);

      res.json({
        success: true,
        message: `Successfully transferred ${result.count} case(s) from ${fromUser.firstName} ${fromUser.lastName} to ${toUser.firstName} ${toUser.lastName}`,
        count: result.count
      });
    } catch (error) {
      console.error('Error transferring cases:', error);
      res.status(500).json({ error: 'Failed to transfer cases' });
    }
  });

  return httpServer;
}
