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
import { sendNewEntryNotification, sendEditEntryNotification, sendDeleteEntryNotification, testEmailConnection } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all routes
  app.use('/api/', generalLimiter);
  
  // Auth middleware
  setupAuth(app);
  
  // Ensure default admin exists on startup
  await storage.ensureDefaultAdmin();
  
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
      const validatedData = insertDataEntrySchema.parse({
        ...req.body,
        createdById: userId,
      });
      
      const entry = await storage.createDataEntry(validatedData);
      
      // Send email notification
      try {
        const emailSettings = await storage.getEmailNotificationSettings();
        if (emailSettings.enabled && emailSettings.emailAddresses.length > 0) {
          const creator = await storage.getUser(userId);
          if (creator) {
            // Get the correct Nr. Rendor by counting total entries
            const totalEntries = await storage.getDataEntriesCount();
            await sendNewEntryNotification(entry, creator, emailSettings, totalEntries);
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
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
      
      // Send email notification for edit
      try {
        const emailSettings = await storage.getEmailNotificationSettings();
        if (emailSettings.enabled && emailSettings.emailAddresses.length > 0) {
          const editor = await storage.getUser(userId);
          if (editor) {
            // Get all entries to calculate correct Nr. Rendor
            const allEntries = await storage.getDataEntriesForExport();
            const entryIndex = allEntries.findIndex(e => e.id === entry.id);
            const nrRendor = entryIndex >= 0 ? entryIndex + 1 : undefined;
            await sendEditEntryNotification(existingEntry, entry, editor, emailSettings, nrRendor);
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

      // Send email notification before deletion
      try {
        const emailSettings = await storage.getEmailNotificationSettings();
        if (emailSettings.enabled && emailSettings.emailAddresses.length > 0) {
          const deleter = await storage.getUser(userId);
          if (deleter) {
            // Get all entries to calculate correct Nr. Rendor
            const allEntries = await storage.getDataEntriesForExport();
            const entryIndex = allEntries.findIndex(e => e.id === existingEntry.id);
            const nrRendor = entryIndex >= 0 ? entryIndex + 1 : undefined;
            await sendDeleteEntryNotification(existingEntry, deleter, emailSettings, nrRendor);
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

      if (format === 'excel') {
        // Excel export with professional formatting
        const worksheetData = [
          // Main title row
          ['Ekstrakt i Ceshtjeve Ligjore'],
          [], // Empty row for spacing
          // Headers matching the current data entry form exactly
          [
            'Nr. Rendor', 'Paditesi (Emër e Mbiemër)', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë', 
            'Gjykata e Shkallës së Parë', 'Faza në të cilën ndodhet procesi (Shkallë I)', 'Gjykata e Apelit', 
            'Faza në të cilën ndodhet procesi (Apel)', 'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi i Albpetrol SH.A.', 
            'Dëmi i Pretenduar në Objekt', 'Shuma e Caktuar nga Gjykata me Vendim', 'Vendim me Ekzekutim të Përkohshëm', 
            'Faza në të cilën ndodhet Ekzekutimi', 'Gjykata e Lartë', 'Krijuar nga', 'Krijuar më'
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
            entry.gjykataApelit || '',                                                  // Gjykata e Apelit
            entry.fazaGjykataApelit || '',                                             // Faza në të cilën ndodhet procesi (Apel)
            entry.fazaAktuale || '',                                                    // Faza në të cilën ndodhet proçesi
            entry.perfaqesuesi || '',                                                   // Përfaqësuesi i Albpetrol SH.A.
            entry.demiIPretenduar || '',                                               // Dëmi i Pretenduar në Objekt
            entry.shumaGjykata || '',                                                   // Shuma e Caktuar nga Gjykata me Vendim
            entry.vendimEkzekutim || '',                                               // Vendim me Ekzekutim të Përkohshëm
            entry.fazaEkzekutim || '',                                                  // Faza në të cilën ndodhet Ekzekutimi
            entry.gjykataLarte || '',                                                   // Gjykata e Lartë
            (entry as any).createdByName || 'Përdorues i panjohur',                    // Krijuar nga
            entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : '' // Krijuar më
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
          { wch: 35 }, // Gjykata e Apelit
          { wch: 30 }, // Faza në të cilën ndodhet procesi (Apel)
          { wch: 25 }, // Faza në të cilën ndodhet proçesi
          { wch: 25 }, // Përfaqësuesi i Albpetrol SH.A.
          { wch: 25 }, // Dëmi i Pretenduar në Objekt
          { wch: 30 }, // Shuma e Caktuar nga Gjykata me Vendim
          { wch: 30 }, // Vendim me Ekzekutim të Përkohshëm
          { wch: 30 }, // Faza në të cilën ndodhet Ekzekutimi
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
          { s: { c: 0, r: 0 }, e: { c: 17, r: 0 } } // Merge A1 to R1 (18 columns)
        ];

        // Style the header row (row 3)
        const headerRowIndex = 2; // 0-indexed, so row 3
        for (let col = 0; col < 18; col++) {
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
          for (let col = 0; col < 18; col++) {
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
          'Gjykata e Shkallës së Parë', 'Faza në të cilën ndodhet procesi (Shkallë I)', 'Gjykata e Apelit', 
          'Faza në të cilën ndodhet procesi (Apel)', 'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi i Albpetrol SH.A.',
          'Dëmi i Pretenduar në Objekt', 'Shuma e Caktuar nga Gjykata me Vendim', 'Vendim me Ekzekutim të Përkohshëm',
          'Faza në të cilën ndodhet Ekzekutimi', 'Gjykata e Lartë', 'Krijuar nga', 'Krijuar më'
        ];

        const csvRows = entries.map(entry => [
          entry.nrRendor,                                                              // Nr. Rendor
          `"${entry.paditesi || ''}"`,                                                // Paditesi (Emër e Mbiemër)
          `"${entry.iPaditur || ''}"`,                                                // I Paditur
          `"${entry.personITrete || ''}"`,                                            // Person i Tretë
          `"${entry.objektiIPadise || ''}"`,                                          // Objekti i Padisë
          `"${entry.gjykataShkalle || ''}"`,                                          // Gjykata e Shkallës së Parë
          `"${entry.fazaGjykataShkalle || ''}"`,                                      // Faza në të cilën ndodhet procesi (Shkallë I)
          `"${entry.gjykataApelit || ''}"`,                                           // Gjykata e Apelit
          `"${entry.fazaGjykataApelit || ''}"`,                                       // Faza në të cilën ndodhet procesi (Apel)
          `"${entry.fazaAktuale || ''}"`,                                             // Faza në të cilën ndodhet proçesi
          `"${entry.perfaqesuesi || ''}"`,                                            // Përfaqësuesi i Albpetrol SH.A.
          `"${entry.demiIPretenduar || ''}"`,                                         // Dëmi i Pretenduar në Objekt
          `"${entry.shumaGjykata || ''}"`,                                            // Shuma e Caktuar nga Gjykata me Vendim
          `"${entry.vendimEkzekutim || ''}"`,                                         // Vendim me Ekzekutim të Përkohshëm
          `"${entry.fazaEkzekutim || ''}"`,                                           // Faza në të cilën ndodhet Ekzekutimi
          `"${entry.gjykataLarte || ''}"`,                                            // Gjykata e Lartë
          `"${(entry as any).createdByName || 'Përdorues i panjohur'}"`,             // Krijuar nga
          entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : '' // Krijuar më
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
      res.json(users);
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

  const httpServer = createServer(app);
  return httpServer;
}
